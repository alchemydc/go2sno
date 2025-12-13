import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@mapbox/togeojson';
import { logger } from '../utils/logger';
import { IRoadService } from './interfaces';
import { Camera, Incident, RoadCondition } from '../types/domain';

const FEEDS = {
    cctv: 'https://quickmap.dot.ca.gov/data/cctv.kml',
    chain: 'https://quickmap.dot.ca.gov/data/cc.kml',
    incidents: 'https://quickmap.dot.ca.gov/data/chp-only.kml',
};

async function fetchKmlAsGeoJson(url: string) {
    const proxyUrl = `/api/ca-road-conditions?url=${encodeURIComponent(url)}`;
    logger.debug(`Fetching KML via proxy from: ${url}`);
    try {
        const res = await fetch(proxyUrl);
        if (!res.ok) {
            logger.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to fetch ${url}`);
        }
        const text = await res.text();

        // Use native DOMParser in browser, fall back to xmldom in Node
        const parser = typeof window !== 'undefined'
            ? new window.DOMParser()
            : new DOMParser();

        const kml = parser.parseFromString(text, 'text/xml');

        const parserError = kml.getElementsByTagName("parsererror");
        if (parserError.length > 0) {
            logger.error(`XML Parsing Error for ${url}:`, parserError[0].textContent);
            throw new Error('XML parsing failed');
        }

        const geojson = toGeoJSON.kml(kml);
        logger.debug(`Parsed ${geojson.features.length} features from ${url}`);

        return geojson;
    } catch (error) {
        logger.error(`Error fetching KML from ${url}:`, error);
        return { features: [] };
    }
}

export class CaltransRoadService implements IRoadService {
    async getIncidents(): Promise<Incident[]> {
        logger.debug('CaltransRoadService: fetching incidents');
        const data = await fetchKmlAsGeoJson(FEEDS.incidents);

        const incidents = data.features.map((f: any) => {
            let lat = 0;
            let lon = 0;

            if (f.geometry && f.geometry.coordinates) {
                if (f.geometry.type === 'Point') {
                    lon = f.geometry.coordinates[0];
                    lat = f.geometry.coordinates[1];
                } else if (f.geometry.type === 'MultiPoint' || f.geometry.type === 'LineString') {
                    // Take the first point
                    if (f.geometry.coordinates.length > 0) {
                        lon = f.geometry.coordinates[0][0];
                        lat = f.geometry.coordinates[0][1];
                    }
                }
            }

            return {
                id: f.properties.name || Math.random().toString(),
                type: 'Incident',
                description: f.properties.description?.replace(/<[^>]*>?/gm, '') || 'No description', // Strip HTML
                startTime: new Date().toISOString(), // KML might not have parseable time easily
                location: { lat, lon },
                routeName: f.properties.name || 'Unknown Road'
            };
        });

        logger.debug(`CaltransRoadService: found ${incidents.length} incidents`);
        return incidents;
    }

    async getConditions(districts?: string[]): Promise<RoadCondition[]> {
        logger.debug('CaltransRoadService: fetching road conditions (chain controls)');
        // Chain controls are the closest mapping to "Road Conditions" for now
        const url = new URL('/api/caltrans-chain-control', window.location.origin);

        if (districts && districts.length > 0) {
            url.searchParams.set('districts', districts.join(','));
        }

        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to fetch road conditions: ${response.statusText}`);
            }

            const rawData: any[] = await response.json();

            const conditions: RoadCondition[] = rawData.map((item: any, index: number) => ({
                id: item.id || `cc-${index}`,
                type: 'ChainControl',
                location: {
                    lat: item.properties?.primaryLatitude || item.location?.lat || 0,
                    lon: item.properties?.primaryLongitude || item.location?.lon || 0
                },
                routeName: item.properties?.routeName || item.route || 'Unknown',
                status: item.properties?.currentConditions?.[0]?.conditionDescription || item.status || 'Chain Control',
                description: item.properties?.currentConditions?.[0]?.conditionDescription || item.description || ''
            }));

            logger.debug(`CaltransRoadService: found ${conditions.length} conditions`);
            return conditions;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching road conditions', { error });
            return [];
        }
    }

    async getCameras(filterRoute?: string): Promise<Camera[]> {
        logger.debug('CaltransRoadService: fetching cameras', { filterRoute });
        const url = new URL('/api/caltrans-cctv', window.location.origin);
        // Note: The previous implementation used 'districts' param. 
        // We might want to default to districts 3 (Sacramento/Tahoe) and 10 (Stockton/Central) for Tahoe access
        url.searchParams.set('districts', '3,10,9');

        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to fetch cameras: ${response.statusText}`);
            }

            const rawCameras: any[] = await response.json();

            const cameras: Camera[] = rawCameras.map((cam: any) => ({
                id: cam.id,
                name: cam.name || cam.locationName || 'Unknown',
                url: cam.url || cam.videoUrl || cam.imageUrl,
                type: (cam.url?.includes('.mp4') || cam.url?.includes('.m3u8')) ? 'stream' : 'image', // Basic heuristic
                thumbnailUrl: cam.thumbnailUrl, // if available
                location: {
                    lat: cam.latitude || cam.location?.latitude,
                    lon: cam.longitude || cam.location?.longitude
                },
                regionId: 'tahoe'
            }));

            logger.debug(`CaltransRoadService: found ${cameras.length} cameras`);
            return cameras;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching cameras', { error });
            return [];
        }
    }
}

// Legacy Exports for compatibility if needed (updating to use new service)
export const getCameras = async (districts?: string[]) => new CaltransRoadService().getCameras();
export const getRoadConditions = async (districts?: string[]) => new CaltransRoadService().getConditions(districts);
export const getIncidents = async () => new CaltransRoadService().getIncidents();

export interface RoadWeatherStation {
    id: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
        route: string;
        nearbyPlace: string;
        elevation: number;
    };
    timestamp: {
        date: string;
        time: string;
        epoch: number;
    };
    weather: {
        airTemperature: number;
        dewpoint: number;
        humidity: number;
        visibility: number;
        windSpeed: number;
        windDirection: number;
        windGust: number;
    };
    surface: {
        status: string;
        temperature: number;
        freezePoint: number;
        blackIceWarning: boolean;
    };
    precipitation: {
        isPresent: boolean;
        rate: number;
        last24Hours: number;
    };
}

export const getRoadWeatherStations = async (districts?: string[]): Promise<RoadWeatherStation[]> => {
    logger.info('Fetching Caltrans road weather stations...');

    // Build API URL with optional districts parameter
    const url = new URL('/api/caltrans-rwis', window.location.origin);
    if (districts && districts.length > 0) {
        url.searchParams.set('districts', districts.join(','));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to fetch road weather stations: ${response.statusText}`);
    }

    const stations: RoadWeatherStation[] = await response.json();
    logger.info(`Found ${stations.length} Caltrans road weather stations`);
    return stations;
};
