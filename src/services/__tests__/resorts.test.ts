import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { getResorts } from '../resorts';
import { fetchResortWeather } from '../open-meteo';

// Mock dependencies
vi.mock('../open-meteo', () => ({
    fetchResortWeather: vi.fn()
}));

vi.mock('../utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        warn: vi.fn()
    }
}));

describe('Resort Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock response for weather
        (fetchResortWeather as Mock).mockResolvedValue(
            Array(20).fill({ daily: { snowfall_sum: [5] }, current: { temperature_2m: 20 } })
        );
    });

    it('should filter resorts by region (Colorado)', async () => {
        const resorts = await getResorts('co');

        // Matches the number of CO resorts in resorts.ts
        expect(resorts.length).toBeGreaterThan(0);
        expect(resorts.find(r => r.id === 'copper')).toBeDefined();
        expect(resorts.find(r => r.id === 'parkcity')).toBeUndefined();

        // Check that weather was called
        expect(fetchResortWeather).toHaveBeenCalledTimes(1);
    });

    it('should filter resorts by region (Utah)', async () => {
        const resorts = await getResorts('ut');

        // Matches the number of UT resorts in resorts.ts
        expect(resorts.length).toBeGreaterThan(0);
        expect(resorts.find(r => r.id === 'parkcity')).toBeDefined();
        expect(resorts.find(r => r.id === 'copper')).toBeUndefined();
    });

    it('should correctly merge weather data', async () => {
        const resorts = await getResorts('co');

        expect(resorts[0].snow24h).toBe(5);
        expect(resorts[0].temp).toBe(20);

        expect(resorts[1].snow24h).toBe(5);
        expect(resorts[1].temp).toBe(20);
    });
});
