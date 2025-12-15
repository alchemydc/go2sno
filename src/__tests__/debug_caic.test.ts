import { describe, it } from 'vitest';
import { CaicClient } from '../services/caic/client';

describe('CAIC Debug', () => {
    it('should find forecast for eldora', async () => {
        // Logic from route.ts mimics finding zone for Eldora
        const dest = 'eldora';
        const destKey = dest.toLowerCase().replace(/\s+/g, '');
        const CO_DESTINATION_TO_ZONE: Record<string, string> = {
            eldora: 'front-range',
        };
        const zoneSlug = CO_DESTINATION_TO_ZONE[destKey];

        const client = new CaicClient();
        const today = new Date().toISOString();

        console.log(`Checking forecast for ${dest} (zone: ${zoneSlug})...`);

        const forecast = await client.getForecastByZoneSlug(zoneSlug, today);

        if (forecast) {
            console.log('FOUND FORECAST:', forecast.areaId);
            console.log('Title:', forecast.title);
            console.log('Ratings:', JSON.stringify(forecast.dangerRatings, null, 2));
        } else {
            console.log('FORECAST NOT FOUND');
            throw new Error('Forecast should be found for Eldora');
        }
    });
});
