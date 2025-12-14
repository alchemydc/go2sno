import { fetchResortWeather } from './open-meteo';
import { getRegion } from '../config/regions';
import { logger } from '../utils/logger';
import { EPIC_RESORT_MAP } from '../config/epic-resorts';
import { IKON_RESORT_MAP } from '../config/ikon-resorts';

export interface Resort {
    id: string;
    name: string;
    snow24h: number; // in inches
    totalLifts: number;
    lat: number;
    lon: number;
    temp?: number;
    weatherDesc?: string;
    affiliation?: 'epic' | 'ikon';
}

// Static definitions of resorts
const RESORT_LOCATIONS = [
    // Colorado
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
    { id: 'crestedbutte', name: 'Crested Butte', totalLifts: 15, lat: 38.8697, lon: -106.9878 },

    // Utah
    { id: 'parkcity', name: 'Park City', totalLifts: 41, lat: 40.6514, lon: -111.5080 },
    { id: 'deervalley', name: 'Deer Valley', totalLifts: 21, lat: 40.6374, lon: -111.4783 },
    { id: 'alta', name: 'Alta', totalLifts: 6, lat: 40.5885, lon: -111.6381 },
    { id: 'snowbird', name: 'Snowbird', totalLifts: 11, lat: 40.5836, lon: -111.6575 },
    { id: 'brighton', name: 'Brighton', totalLifts: 7, lat: 40.6009, lon: -111.5835 },
    { id: 'solitude', name: 'Solitude', totalLifts: 8, lat: 40.6196, lon: -111.5919 },

    // Tahoe
    { id: 'heavenly', name: 'Heavenly', totalLifts: 28, lat: 38.9353, lon: -119.9400 },
    { id: 'palisades', name: 'Palisades Tahoe', totalLifts: 42, lat: 39.1970, lon: -120.2356 },
    { id: 'alpinemeadows', name: 'Alpine Meadows', totalLifts: 13, lat: 39.1644, lon: -120.2384 },
    { id: 'sugarbowl', name: 'Sugar Bowl', totalLifts: 12, lat: 39.3090, lon: -120.3340 },
    { id: 'homewood', name: 'Homewood', totalLifts: 8, lat: 39.0779, lon: -120.1601 },
    { id: 'northstar', name: 'Northstar', totalLifts: 20, lat: 39.2730, lon: -120.1192 },
    { id: 'kirkwood', name: 'Kirkwood', totalLifts: 15, lat: 38.6810, lon: -120.0659 },
    { id: 'mammoth', name: 'Mammoth Mountain', totalLifts: 25, lat: 37.6485, lon: -118.9721 },

    // PNW
    { id: 'crystal', name: 'Crystal Mountain', totalLifts: 11, lat: 46.9282, lon: -121.5045 },
    { id: 'snoqualmie', name: 'The Summit at Snoqualmie', totalLifts: 24, lat: 47.4239, lon: -121.4132 },
    { id: 'stevens', name: 'Stevens Pass', totalLifts: 10, lat: 47.7441, lon: -121.0890 },
    { id: 'bachelor', name: 'Mt. Bachelor', totalLifts: 12, lat: 43.9774, lon: -121.6885 },
    { id: 'mthood', name: 'Mt. Hood Meadows', totalLifts: 12, lat: 45.3344, lon: -121.6663 },
    { id: 'whitepass', name: 'White Pass', totalLifts: 8, lat: 46.6375, lon: -121.3912 },
    { id: 'missionridge', name: 'Mission Ridge', totalLifts: 6, lat: 47.2917, lon: -120.3980 },
    { id: 'whistler', name: 'Whistler Blackcomb', totalLifts: 37, lat: 50.1163, lon: -122.9574 },
    { id: 'cypress', name: 'Cypress Mountain', totalLifts: 9, lat: 49.3959, lon: -123.2045 },
    { id: 'sunpeaks', name: 'Sun Peaks', totalLifts: 13, lat: 50.8845, lon: -119.8864 },
    { id: 'revelstoke', name: 'Revelstoke', totalLifts: 7, lat: 50.9585, lon: -118.1633 },
    { id: 'red', name: 'RED Mountain', totalLifts: 8, lat: 49.1026, lon: -117.8188 },
    { id: 'panorama', name: 'Panorama', totalLifts: 10, lat: 50.4856, lon: -116.1425 },
];

export const getResorts = async (regionId: string = 'co'): Promise<Resort[]> => {
    logger.debug('Getting resorts for region:', { regionId });

    try {
        // 1. Get region definition to check which resorts belong to it
        const region = getRegion(regionId);

        if (!region) {
            logger.error('Region not found', { regionId });
            return [];
        }

        // 2. Filter resorts
        const filteredResorts = RESORT_LOCATIONS.filter(r => region.resortIds.includes(r.id));

        logger.debug(`Found ${filteredResorts.length} resorts for region ${regionId}`);

        if (filteredResorts.length === 0) {
            logger.warn(`No resorts found for region ${regionId} in resort service`);
            return [];
        }

        // 3. Fetch weather for filtered locations
        const weatherData = await fetchResortWeather(
            filteredResorts.map(r => ({ lat: r.lat, lon: r.lon }))
        );

        // 4. Merge static data with dynamic weather data and determine affiliation
        return filteredResorts.map((resort, index) => {
            const localWeather = weatherData[index];

            let affiliation: 'epic' | 'ikon' | undefined;
            if (EPIC_RESORT_MAP[resort.id]) {
                affiliation = 'epic';
            } else if (IKON_RESORT_MAP[resort.id]) {
                affiliation = 'ikon';
            }

            logger.debug('Resort processed', { id: resort.id, affiliation });

            return {
                ...resort,
                // Open-Meteo returns daily arrays. Index 0 is "today".
                snow24h: localWeather?.daily?.snowfall_sum?.[0] || 0,
                temp: localWeather?.current?.temperature_2m,
                affiliation
            };
        });

    } catch (error) {
        logger.error("Error in getResorts", { error, regionId });
        // Return empty or throw? Original didn't throw but filteredResorts map logic would fail if not reached.
        // We'll return empty to be safe
        return [];
    }
};
