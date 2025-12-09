import { NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

// Caltrans CWWP2 RWIS API response types
interface RWISLocation {
    district: string;
    locationName: string;
    longitude: string;
    latitude: string;
    nearbyPlace: string;
    county: string;
    route: string;
    elevation: string;
    direction: string;
}

interface RWISTemperatureData {
    essNumTemperatureSensors: string;
    essTemperatureSensorTable: Array<{
        essTemperatureSensorEntry: {
            essTemperatureSensorIndex: string;
            essAirTemperature: string;
        };
    }>;
    essDewpointTemp: string;
    essMaxTemp: string;
    essMinTemp: string;
}

interface RWISWindData {
    essAvgWindDirection: string;
    essAvgWindSpeed: string;
    essSpotWindDirection: string;
    essSpotWindSpeed: string;
    essMaxWindGustSpeed: string;
    essMaxWindGustDir: string;
}

interface RWISPrecipData {
    essRelativeHumidity: string;
    essPrecipYesNo: string;
    essPrecipRate: string;
    essPrecipSituation: string;
    essPrecipitation24Hours: string;
}

interface RWISVisibilityData {
    essVisibility: string;
    essVisibilitySituation: string;
}

interface RWISPavementSensor {
    essPavementSensorEntry: {
        essPavementSensorIndex: string;
        essSurfaceStatus: string;
        essSurfaceTemperature: string;
        essSurfaceFreezePoint: string;
        essSurfaceBlackIceSignal: string;
    };
}

interface RWISData {
    stationData: {
        essAtmosphericPressure: string;
    };
    windData: RWISWindData;
    temperatureData: RWISTemperatureData;
    humidityPrecipData: RWISPrecipData;
    visibilityData: RWISVisibilityData;
    pavementSensorData: {
        numEssPavementSensors: string;
        essPavementSensorTable: RWISPavementSensor[];
    };
}

interface CaltransRWIS {
    index: string;
    recordTimestamp: {
        recordDate: string;
        recordTime: string;
        recordEpoch: string;
    };
    location: RWISLocation;
    inService: string;
    rwisData: RWISData;
}

interface CaltransRWISResponse {
    data: Array<{ rwis: CaltransRWIS }>;
}

// Road Weather Station interface for the application
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
        airTemperature: number; // Fahrenheit
        dewpoint: number;
        humidity: number; // percentage
        visibility: number; // feet
        windSpeed: number; // mph
        windDirection: number; // degrees
        windGust: number; // mph
    };
    surface: {
        status: string; // dry, wet, ice/snow, etc.
        temperature: number; // Fahrenheit
        freezePoint: number;
        blackIceWarning: boolean;
    };
    precipitation: {
        isPresent: boolean;
        rate: number;
        last24Hours: number;
    };
}

// Default districts for winter driving in Sierra Nevada
// Note: District 10 currently has malformed JSON (as of Dec 2025), but is included
// so the API will automatically work once Caltrans fixes the upstream data issue
const DEFAULT_DISTRICTS = ['3', '9', '10'];

function parseTemperature(temp: string): number {
    const parsed = parseInt(temp);
    // RWIS temps appear to be in Fahrenheit already, but handle edge cases
    return parsed === 1001 || parsed === 65535 ? 0 : parsed;
}

function parseSurfaceStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
        '1': 'Error/Unknown',
        '2': 'Other',
        '3': 'Dry',
        '4': 'Trace Moisture',
        '5': 'Wet',
        '6': 'Chemically Wet',
        '7': 'Ice Warning',
        '8': 'Ice Watch',
        '9': 'Snow Warning',
        '10': 'Snow Watch',
    };
    return statusMap[status] || 'Unknown';
}

async function fetchDistrictRWIS(district: string): Promise<RoadWeatherStation[]> {
    const url = `https://cwwp2.dot.ca.gov/data/d${district}/rwis/rwisStatusD${district.padStart(2, '0')}.json`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            logger.error(`Failed to fetch RWIS for district ${district}: ${response.statusText}`);
            return [];
        }

        const data: CaltransRWISResponse = await response.json();

        return data.data
            .filter(({ rwis }) => rwis.inService === 'true')
            .map(({ rwis }) => {
                const airTemp = rwis.rwisData.temperatureData.essTemperatureSensorTable[0]
                    ?.essTemperatureSensorEntry.essAirTemperature || '0';

                const surfaceSensor = rwis.rwisData.pavementSensorData.essPavementSensorTable[0]
                    ?.essPavementSensorEntry;

                return {
                    id: `rwis-d${district}-${rwis.index}`,
                    name: rwis.location.locationName,
                    location: {
                        latitude: parseFloat(rwis.location.latitude),
                        longitude: parseFloat(rwis.location.longitude),
                        route: rwis.location.route,
                        nearbyPlace: rwis.location.nearbyPlace,
                        elevation: parseInt(rwis.location.elevation),
                    },
                    timestamp: {
                        date: rwis.recordTimestamp.recordDate,
                        time: rwis.recordTimestamp.recordTime,
                        epoch: parseInt(rwis.recordTimestamp.recordEpoch),
                    },
                    weather: {
                        airTemperature: parseTemperature(airTemp),
                        dewpoint: parseTemperature(rwis.rwisData.temperatureData.essDewpointTemp),
                        humidity: parseInt(rwis.rwisData.humidityPrecipData.essRelativeHumidity),
                        visibility: parseInt(rwis.rwisData.visibilityData.essVisibility),
                        windSpeed: parseInt(rwis.rwisData.windData.essAvgWindSpeed),
                        windDirection: parseInt(rwis.rwisData.windData.essAvgWindDirection),
                        windGust: parseInt(rwis.rwisData.windData.essMaxWindGustSpeed),
                    },
                    surface: {
                        status: parseSurfaceStatus(surfaceSensor?.essSurfaceStatus || '1'),
                        temperature: parseTemperature(surfaceSensor?.essSurfaceTemperature || '0'),
                        freezePoint: parseTemperature(surfaceSensor?.essSurfaceFreezePoint || '0'),
                        blackIceWarning: surfaceSensor?.essSurfaceBlackIceSignal === '3',
                    },
                    precipitation: {
                        isPresent: rwis.rwisData.humidityPrecipData.essPrecipYesNo === '1',
                        rate: parseInt(rwis.rwisData.humidityPrecipData.essPrecipRate),
                        last24Hours: parseInt(rwis.rwisData.humidityPrecipData.essPrecipitation24Hours),
                    },
                };
            });
    } catch (error) {
        if (error instanceof SyntaxError) {
            logger.error(`RWIS data for district ${district} contains invalid JSON. This is a known issue with Caltrans API. Skipping district ${district}.`);
        } else {
            logger.error(`Error fetching RWIS for district ${district}:`, error);
        }
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const districtsParam = searchParams.get('districts');

        // Parse districts from query param or use defaults
        const districts = districtsParam
            ? districtsParam.split(',').map(d => d.trim())
            : DEFAULT_DISTRICTS;

        // Fetch RWIS data from all requested districts concurrently
        const stationArrays = await Promise.all(
            districts.map(district => fetchDistrictRWIS(district))
        );

        // Flatten all station arrays into single array
        const stations = stationArrays.flat();

        return NextResponse.json(stations);
    } catch (error) {
        logger.error('Error in caltrans-rwis API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch RWIS data' },
            { status: 500 }
        );
    }
}
