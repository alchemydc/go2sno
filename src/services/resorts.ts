import { fetchResortWeather } from './open-meteo';

export interface Resort {
    id: string;
    name: string;
    snow24h: number; // in inches
    liftsOpen: number;
    totalLifts: number;
    lat: number;
    lon: number;
    temp?: number;
    weatherDesc?: string;
}

// Static definitions of resorts
const RESORT_LOCATIONS = [
    { id: 'copper', name: 'Copper Mountain', totalLifts: 24, lat: 39.5021, lon: -106.1510 },
    { id: 'breck', name: 'Breckenridge', totalLifts: 35, lat: 39.4817, lon: -106.0384 },
    { id: 'abasin', name: 'Arapahoe Basin', totalLifts: 9, lat: 39.6425, lon: -105.8719 },
    { id: 'keystone', name: 'Keystone', totalLifts: 20, lat: 39.6084, lon: -105.9436 },
    { id: 'vail', name: 'Vail', totalLifts: 31, lat: 39.6403, lon: -106.3742 },
    { id: 'winterpark', name: 'Winter Park', totalLifts: 23, lat: 39.8868, lon: -105.7625 },
    { id: 'steamboat', name: 'Steamboat', totalLifts: 18, lat: 40.4848, lon: -106.8317 },
    { id: 'eldora', name: 'Eldora', totalLifts: 12, lat: 39.9382, lon: -105.5835 },
    { id: 'skicooper', name: 'Ski Cooper', totalLifts: 5, lat: 39.3627, lon: -106.3020 },
    { id: 'aspen', name: 'Aspen Snowmass', totalLifts: 40, lat: 39.1911, lon: -106.8175 },
    { id: 'telluride', name: 'Telluride', totalLifts: 19, lat: 37.9375, lon: -107.8123 },
    { id: 'beavercreek', name: 'Beaver Creek', totalLifts: 25, lat: 39.6042, lon: -106.5165 },
    { id: 'monarch', name: 'Monarch Mountain', totalLifts: 7, lat: 38.5458, lon: -106.3258 },
];

export const getResorts = async (): Promise<Resort[]> => {
    // 1. Fetch weather for all locations in one batch request
    const weatherData = await fetchResortWeather(
        RESORT_LOCATIONS.map(r => ({ lat: r.lat, lon: r.lon }))
    );

    // 2. Merge static data with dynamic weather data
    return RESORT_LOCATIONS.map((resort, index) => {
        const localWeather = weatherData[index];

        // Generate mock lift data (random for now, since Open-Meteo doesn't provide this)
        // In a real app, you might scrape this or leave it null
        const mockLiftsOpen = Math.floor(Math.random() * resort.totalLifts);

        return {
            ...resort,
            liftsOpen: mockLiftsOpen,
            // Open-Meteo returns daily arrays. Index 0 is "today".
            snow24h: localWeather?.daily?.snowfall_sum?.[0] || 0,
            temp: localWeather?.current?.temperature_2m,
            // We could add a description helper here if you want text descriptions
        };
    });
};
