import { describe, it, expect, vi } from 'vitest';
import { CaicClient } from '../services/caic/client';

describe('CAIC Debug', () => {
    it('should find forecast for eldora', async () => {
        // Mock fetch for deterministic testing
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{
                type: 'avalancheforecast',
                areaId: '06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7',
                title: 'Front Range Avalanche Forecast',
                dangerRatings: [],
                publicName: 'Front Range'
            }]
        });

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
            // If we are mocking, this should never happen unless logic is broken
            throw new Error('Forecast should be found for Eldora');
        }

        expect(forecast).toBeDefined();
        expect(forecast?.areaId).toBe('06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7');
    });
});
