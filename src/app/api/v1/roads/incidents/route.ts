import { NextResponse } from 'next/server';
import { logger } from '../../../../../utils/logger';
import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@mapbox/togeojson';

interface Incident {
    id: string;
    type: string;
    description: string;
    startTime: string;
    location: {
        lat: number;
        lon: number;
    };
    routeName: string;
    regionId: string;
    provider: string;
}

// --- CDOT Logic (CO) ---
async function fetchCdotIncidents(): Promise<Incident[]> {
    const apiKey = process.env.COTRIP_API_KEY;
    if (!apiKey) {
        logger.error('COTRIP_API_KEY missing');
        return [];
    }
    const url = `https://data.cotrip.org/api/v1/incidents?apiKey=${apiKey}&limit=100`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        return (data.features || []).map((f: any) => ({
            id: f.id,
            type: f.properties.type || 'Unknown',
            // Map 'travelerInformationMessage' to description, defaulting to type if empty (e.g. MEXL Open)
            description: f.properties.travelerInformationMessage || f.properties.type || 'No description available',
            startTime: f.properties.startTime,
            location: {
                lat: f.properties.geometry?.coordinates?.[1] || 0,
                lon: f.properties.geometry?.coordinates?.[0] || 0
            },
            routeName: f.properties.routeName,
            regionId: 'co',
            provider: 'cdot'
        })).map((i: any, idx: number, arr: any[]) => {
            // Refine location mapping
            const f = (data.features || [])[idx];
            let lat = 0, lon = 0;
            if (f.geometry?.type === 'Point') {
                lon = f.geometry.coordinates[0];
                lat = f.geometry.coordinates[1];
            } else if (f.geometry?.type === 'MultiPoint') {
                lon = f.geometry.coordinates[0][0];
                lat = f.geometry.coordinates[0][1];
            }
            i.location = { lat, lon };
            return i;
        });
    } catch (err) {
        logger.error('Error fetching CDOT incidents', err);
        return [];
    }
}

// --- Caltrans Logic (Tahoe) ---
// Parses KML from QuickMap
async function fetchCaltransIncidents(regionId: string = 'tahoe'): Promise<Incident[]> {
    const url = 'https://quickmap.dot.ca.gov/data/chp-only.kml';
    logger.debug(`Fetching Caltrans incidents from ${url} for region ${regionId}`);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            logger.warn(`Failed to fetch Caltrans incidents: ${res.status}`);
            throw new Error(res.statusText);
        }
        const text = await res.text();

        const parser = new DOMParser();
        const kml = parser.parseFromString(text, 'text/xml');
        const geojson = toGeoJSON.kml(kml);

        const incidents = geojson.features.map((f: any) => {
            let lat = 0, lon = 0;
            if (f.geometry?.type === 'Point') {
                lon = f.geometry.coordinates[0];
                lat = f.geometry.coordinates[1];
            } else if (f.geometry?.type === 'MultiPoint' || f.geometry?.type === 'LineString') { // LineString unusual for incident but possible
                if (f.geometry.coordinates.length > 0) {
                    const pt = typeof f.geometry.coordinates[0] === 'number' ? f.geometry.coordinates : f.geometry.coordinates[0];
                    // LineString/MultiPoint usually array of arrays.
                    lon = pt[0];
                    lat = pt[1];
                }
            }

            // Strip HTML from description
            const rawDesc = f.properties.description || '';
            const desc = rawDesc.replace(/<[^>]*>?/gm, '');

            return {
                id: f.properties.name || `caltrans-${Math.random()}`,
                type: 'Incident', // KML doesn't explicitly type nicely
                description: desc,
                startTime: new Date().toISOString(), // No reliable time in KML props usually
                location: { lat, lon },
                routeName: f.properties.name || 'Unknown',
                regionId: regionId,
                provider: 'caltrans'
            };
        });
        logger.debug(`Fetched ${incidents.length} Caltrans incidents`);
        return incidents;
    } catch (err) {
        logger.error('Error fetching Caltrans incidents', err);
        return [];
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    let incidents: Incident[] = [];

    try {
        if (region === 'co') {
            logger.info('Fetching incidents for CO');
            incidents = await fetchCdotIncidents();
        } else if (region === 'tahoe' || region === 'canv') {
            logger.info('Fetching incidents for Tahoe');
            incidents = await fetchCaltransIncidents('tahoe');
        } else if (region === 'socal') {
            logger.info('Fetching incidents for SoCal');
            incidents = await fetchCaltransIncidents('socal');
        }

        return NextResponse.json(incidents);
    } catch (error) {
        logger.error('Error in v1/roads/incidents', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
