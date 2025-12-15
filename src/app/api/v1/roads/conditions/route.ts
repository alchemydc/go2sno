import { NextResponse } from 'next/server';
import { logger } from '../../../../../utils/logger';

// --- Shared Types ---
interface RoadCondition {
    id: string;
    type: string;
    location: {
        lat: number;
        lon: number;
    };
    routeName: string;
    status: string;
    description: string;
    regionId: string;
    provider: string; // 'cdot' | 'caltrans'
}

// --- Caltrans Logic (Tahoe) ---
interface CaltransStatusData {
    status: string;
    statusDescription: string;
}

interface CaltransChainControl {
    index: string;
    location: {
        latitude: string;
        longitude: string;
        locationName: string;
        route: string;
    };
    inService: string;
    statusData: CaltransStatusData;
}

interface CaltransResponse {
    data: Array<{ cc: CaltransChainControl }>;
}

const CALTRANS_DISTRICTS = ['3', '9', '10'];

async function fetchCaltransConditions(districts: string[]): Promise<RoadCondition[]> {
    const promises = districts.map(async (d) => {
        const url = `https://cwwp2.dot.ca.gov/data/d${d}/cc/ccStatusD${d.padStart(2, '0')}.json`;
        try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const json: CaltransResponse = await res.json();
            return json.data
                .filter(item => item.cc.inService === 'true')
                .map(({ cc }) => ({
                    id: cc.index,
                    type: 'ChainControl',
                    location: {
                        lat: parseFloat(cc.location.latitude),
                        lon: parseFloat(cc.location.longitude)
                    },
                    routeName: `${cc.location.route} ${cc.location.locationName}`,
                    status: cc.statusData.status,
                    description: cc.statusData.statusDescription,
                    regionId: 'tahoe',
                    provider: 'caltrans'
                }));
        } catch (err) {
            logger.error(`Failed to fetch Caltrans district ${d}`, err);
            return [];
        }
    });

    const results = await Promise.all(promises);
    return results.flat();
}

// --- CDOT Logic (Colorado) ---
// COtrip API response is GeoJSON FeatureCollection
async function fetchCdotConditions(): Promise<RoadCondition[]> {
    const apiKey = process.env.COTRIP_API_KEY;
    if (!apiKey) {
        logger.error('COTRIP_API_KEY missing');
        return [];
    }

    const url = `https://data.cotrip.org/api/v1/roadConditions?apiKey=${apiKey}&limit=500`; // Limit? verify default
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        return (data.features || [])
            .map((f: any) => ({
                id: f.id || `cdot-${Math.random()}`,
                type: 'RoadCondition',
                location: {
                    lat: f.properties.primaryLatitude,
                    lon: f.properties.primaryLongitude
                },
                routeName: f.properties.routeName,
                status: f.properties.currentConditions?.[0]?.conditionDescription || 'Unknown',
                description: f.properties.currentConditions?.[0]?.conditionDescription || '',
                regionId: 'co',
                provider: 'cdot'
            }))
            .filter((c: RoadCondition) => {
                // Filter out bad data from CDOT API
                const desc = (c.description || '').toLowerCase();
                if (desc.includes('forecast text included')) return false;
                return true;
            });
    } catch (err) {
        logger.error('Failed to fetch CDOT conditions', err);
        return [];
    }
}


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const districtsParam = searchParams.get('districts');

    try {
        let conditions: RoadCondition[] = [];

        if (region === 'tahoe' || region === 'canv') {
            const districts = districtsParam ? districtsParam.split(',') : CALTRANS_DISTRICTS;
            conditions = await fetchCaltransConditions(districts);
        } else if (region === 'co') {
            conditions = await fetchCdotConditions();
        }

        return NextResponse.json(conditions);
    } catch (error) {
        logger.error('Error in v1/roads/conditions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
