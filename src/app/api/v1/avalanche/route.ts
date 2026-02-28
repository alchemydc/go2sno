import { NextResponse } from 'next/server';
import { AvalancheOrgClient } from '../../../../services/sac/client';
import { logger } from '../../../../utils/logger';

// Colorado destination coordinates for point-in-polygon zone matching.
// Format: [lon, lat] — extracted from src/config/regions.ts.
// Gateway cities (Denver, Boulder) are outside CAIC zone polygons,
// so they use a nearby resort coordinate as a proxy.
const CO_DESTINATION_COORDS: Record<string, [number, number]> = {
    // Gateway cities → proxy to nearby resort coordinates
    boulder: [-105.5835, 39.9382],     // proxy: Eldora
    denver: [-105.5835, 39.9382],      // proxy: Eldora
    // Summit / I-70 corridor
    frisco: [-106.0975, 39.5744],
    copper: [-106.1510, 39.5021],
    breck: [-106.0384, 39.4817],
    keystone: [-105.9436, 39.6084],
    arapahoebasin: [-105.8719, 39.6425],
    abasin: [-105.8719, 39.6425],
    // Vail Valley
    vail: [-106.3742, 39.6403],
    beavercreek: [-106.5165, 39.6042],
    // Front Range / north I-70
    winterpark: [-105.7631, 39.8917],
    eldora: [-105.5835, 39.9382],
    // Sawatch
    leadville: [-106.2925, 39.2508],
    skicooper: [-106.3020, 39.3627],
    monarch: [-106.3258, 38.5458],
    // Central mountains
    aspen: [-106.8175, 39.1911],
    crestedbutte: [-106.9878, 38.8697],
    // San Juan
    telluride: [-107.8123, 37.9375],
    silverton: [-107.6639, 37.8119],
    wolfcreek: [-106.8830, 37.3869],
    // Steamboat
    steamboat: [-106.8317, 40.4848],
};

const avyOrgClient = new AvalancheOrgClient();

// Tahoe-area destinations mapped to their avalanche center.
// Most Tahoe resorts fall within SAC (Sierra Avalanche Center).
// Mammoth is in ESAC (Eastern Sierra Avalanche Center) territory.
const TAHOE_DESTINATION_TO_CENTER: Record<string, string> = {
    sf: 'SAC',
    oakland: 'SAC',
    sacramento: 'SAC',
    reno: 'SAC',
    tahoe: 'SAC',
    incline: 'SAC',
    heavenly: 'SAC',
    palisades: 'SAC',
    alpinemeadows: 'SAC',
    sugarbowl: 'SAC',
    homewood: 'SAC',
    northstar: 'SAC',
    kirkwood: 'SAC',
    mammoth: 'ESAC',
};

// Utah destinations mapped to their UAC forecast zone name.
// All current Wasatch-area resorts fall within the "Salt Lake" zone.
const UT_DESTINATION_TO_ZONE: Record<string, string> = {
    slc: 'Salt Lake',
    parkcity: 'Salt Lake',
    deervalley: 'Salt Lake',
    alta: 'Salt Lake',
    snowbird: 'Salt Lake',
    brighton: 'Salt Lake',
    solitude: 'Salt Lake',
};

async function getCoForecast(dest: string) {
    const destKey = dest.toLowerCase().replace(/\s+/g, '');
    const coords = CO_DESTINATION_COORDS[destKey];

    if (!coords) {
        // Fall back to Frisco (central I-70 corridor) for unknown destinations
        logger.warn(`No coordinates for CO destination: ${destKey}, using Frisco fallback`);
    }

    const [lon, lat] = coords || [-106.0975, 39.5744]; // Frisco fallback
    const zone = await avyOrgClient.getForecastByCoordinates('CAIC', lon, lat);
    if (!zone) return null;

    const dangerLevel = zone.danger_level >= 1 ? zone.danger_level : 0;
    const dangerDisplay = zone.danger
        ? zone.danger.charAt(0).toUpperCase() + zone.danger.slice(1)
        : 'No Rating';

    return {
        zoneId: `CAIC-${destKey}`,
        zoneName: zone.name !== 'CAIC zone' ? zone.name : destKey
            .split(/(?=[A-Z])/)
            .join(' ')
            .replace(/^\w/, c => c.toUpperCase()),
        dangerRating: dangerLevel,
        dangerRatingDisplay: dangerDisplay,
        summary: zone.travel_advice || 'No summary available.',
        issueDate: zone.start_date,
        url: zone.link,
        provider: 'caic',
    };
}

async function getTahoeForecast(dest: string) {
    const destKey = dest.toLowerCase().replace(/\s+/g, '');
    const centerId = TAHOE_DESTINATION_TO_CENTER[destKey] || 'SAC';

    const zone = await avyOrgClient.getForecastByCenter(centerId);
    if (!zone) return null;

    // Map danger_level from the API: -1 means no rating, 1-5 = Low to Extreme
    const dangerLevel = zone.danger_level >= 1 ? zone.danger_level : 0;
    const dangerDisplay = zone.danger
        ? zone.danger.charAt(0).toUpperCase() + zone.danger.slice(1)
        : 'No Rating';

    return {
        zoneId: centerId,
        zoneName: zone.name,
        dangerRating: dangerLevel,
        dangerRatingDisplay: dangerDisplay,
        summary: zone.travel_advice || 'No summary available.',
        issueDate: zone.start_date,
        url: zone.link,
        provider: 'sac',
    };
}

async function getUtahForecast(dest: string) {
    const destKey = dest.toLowerCase().replace(/\s+/g, '');
    const zoneName = UT_DESTINATION_TO_ZONE[destKey] || 'Salt Lake';

    const zone = await avyOrgClient.getForecastByZoneName('UAC', zoneName);
    if (!zone) return null;

    const dangerLevel = zone.danger_level >= 1 ? zone.danger_level : 0;
    const dangerDisplay = zone.danger
        ? zone.danger.charAt(0).toUpperCase() + zone.danger.slice(1)
        : 'No Rating';

    return {
        zoneId: `UAC-${zoneName.toLowerCase().replace(/\s+/g, '-')}`,
        zoneName: zoneName,
        dangerRating: dangerLevel,
        dangerRatingDisplay: dangerDisplay,
        summary: zone.travel_advice || 'No summary available.',
        issueDate: zone.start_date,
        url: zone.link,
        provider: 'uac',
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const destination = searchParams.get('destination');

    if (!destination) {
        return NextResponse.json({ error: 'Destination required' }, { status: 400 });
    }

    try {
        let result = null;
        if (region === 'co' || !region) { // Default to CO for backward compat logic
            result = await getCoForecast(destination);
        } else if (region === 'tahoe') {
            result = await getTahoeForecast(destination);
        } else if (region === 'ut') {
            result = await getUtahForecast(destination);
        } else {
            result = {
                zoneName: 'Unknown Zone',
                dangerRating: 0,
                dangerRatingDisplay: 'No Data',
                summary: 'Avalanche data not yet available for this region.',
                provider: 'stub'
            };
        }

        if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(result);
    } catch (error) {
        logger.error('Error in v1/avalanche', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
