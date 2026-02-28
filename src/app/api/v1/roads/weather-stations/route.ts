import { NextResponse } from 'next/server';
import { logger } from '../../../../../utils/logger';

interface RoadWeatherStation {
    id: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
        elevation: number;
    };
    weather: {
        airTemp: number;
        windSpeed: number;
        // ... simplistic mapping for MVP
    };
    provider: string;
    regionId: string;
}

// --- Caltrans Logic ---
const CALTRANS_DISTRICTS = ['3', '9', '10'];

async function fetchCaltransRWIS(districts: string[]): Promise<RoadWeatherStation[]> {
    const promises = districts.map(async (d) => {
        const url = `https://cwwp2.dot.ca.gov/data/d${d}/rwis/rwisStatusD${d.padStart(2, '0')}.json`;
        try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const json = await res.json();

            return json.data
                .filter((item: any) => item.rwis.inService === 'true')
                .map(({ rwis }: any) => ({
                    id: `rwis-d${d}-${rwis.index}`,
                    name: rwis.location.locationName,
                    location: {
                        latitude: parseFloat(rwis.location.latitude),
                        longitude: parseFloat(rwis.location.longitude),
                        elevation: parseInt(rwis.location.elevation)
                    },
                    weather: {
                        airTemp: parseInt(rwis.rwisData.temperatureData.essTemperatureSensorTable[0]?.essTemperatureSensorEntry.essAirTemperature || '0'),
                        windSpeed: parseInt(rwis.rwisData.windData.essAvgWindSpeed || '0')
                    },
                    provider: 'caltrans',
                    regionId: 'tahoe'
                }));
        } catch (err) {
            // District 10 JSON is often malformed (known issue), ignore syntax errors silently or log warning
            if (err instanceof SyntaxError) {
                logger.warn(`Malformed JSON from Caltrans RWIS district ${d}`);
            } else {
                logger.error(`Failed to fetch RWIS district ${d}`, err);
            }
            return [];
        }
    });

    const results = await Promise.all(promises);
    return results.flat();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const districtsParam = searchParams.get('districts');

    let stations: RoadWeatherStation[] = [];

    try {
        if (region === 'tahoe' || region === 'canv') {
            const districts = districtsParam ? districtsParam.split(',') : CALTRANS_DISTRICTS;
            stations = await fetchCaltransRWIS(districts);
        }
        // CO not supported

        return NextResponse.json(stations);
    } catch (error) {
        logger.error('Error in v1/roads/weather-stations', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
