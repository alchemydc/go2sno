import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@mapbox/togeojson';
import { Camera, Incident, RoadCondition } from './cdot';
import { logger } from '../utils/logger';

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
        logger.debug(`Fetched ${text.length} bytes from ${url}`);

        // Use native DOMParser in browser, fall back to xmldom in Node
        const parser = typeof window !== 'undefined'
            ? new window.DOMParser()
            : new DOMParser();

        const kml = parser.parseFromString(text, 'text/xml');

        const parserError = kml.getElementsByTagName("parsererror");
        if (parserError.length > 0) {
            logger.error(`XML Parsing Error for ${url}:`, parserError[0].textContent);
            logger.debug(`Response snippet: ${text.substring(0, 500)}`);
            throw new Error('XML parsing failed');
        }

        const geojson = toGeoJSON.kml(kml);
        logger.debug(`Parsed ${geojson.features.length} features from ${url}`);

        if (geojson.features.length === 0) {
            logger.warn(`No features found for ${url}. Sample text: ${text.substring(0, 200)}`);
        }

        return geojson;
    } catch (error) {
        logger.error(`Error fetching KML from ${url}:`, error);
        return { features: [] };
    }
}

export const getCameras = async (districts?: string[]): Promise<Camera[]> => {
    logger.info('Fetching Caltrans cameras...');

    // Build API URL with optional districts parameter
    const url = new URL('/api/caltrans-cctv', window.location.origin);
    if (districts && districts.length > 0) {
        url.searchParams.set('districts', districts.join(','));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to fetch cameras: ${response.statusText}`);
    }

    const cameras: Camera[] = await response.json();
    logger.info(`Found ${cameras.length} Caltrans cameras`);
    return cameras;
};

export const getRoadConditions = async (districts?: string[]): Promise<RoadCondition[]> => {
    logger.info('Fetching Caltrans road conditions...');

    // Build API URL with optional districts parameter
    const url = new URL('/api/caltrans-chain-control', window.location.origin);
    if (districts && districts.length > 0) {
        url.searchParams.set('districts', districts.join(','));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to fetch road conditions: ${response.statusText}`);
    }

    const conditions: RoadCondition[] = await response.json();
    logger.info(`Found ${conditions.length} Caltrans road conditions`);
    return conditions;
};

export const getIncidents = async (): Promise<Incident[]> => {
    logger.info('Fetching Caltrans incidents...');
    const data = await fetchKmlAsGeoJson(FEEDS.incidents);

    const incidents = data.features.map((f: any) => ({
        id: f.properties.name || Math.random().toString(),
        type: 'Incident',
        geometry: f.geometry,
        properties: {
            type: 'Incident',
            startTime: new Date().toISOString(), // KML might not have parseable time easily
            travelerInformationMessage: f.properties.description?.replace(/<[^>]*>?/gm, ''), // Strip HTML
            routeName: f.properties.name || 'Unknown Road'
        }
    }));
    logger.info(`Found ${incidents.length} Caltrans incidents`);
    return incidents;
};

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
