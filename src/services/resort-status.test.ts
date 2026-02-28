
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getResortStatus } from './resort-status';
import { epicMixClient } from './epic-mix/client';
import * as micrawl from '@/lib/micrawl';
import * as openMeteo from './open-meteo';

// Mock dependencies
vi.mock('./epic-mix/client');
vi.mock('@/lib/micrawl');
vi.mock('./open-meteo');

describe('ResortStatus Service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Default mock for fetchResortWeather to prevent crashes in getResorts
        (openMeteo.fetchResortWeather as any).mockResolvedValue(
            Array(50).fill({
                current: { temperature_2m: 30, is_day: 1, weather_code: 0 },
                daily: { temperature_2m_max: [40], temperature_2m_min: [20], snowfall_sum: [0] }
            })
        );
    });

    it('should fetch status from Epic Mix for configured resort', async () => {
        const mockStatus = {
            lifts: [{ name: 'Lift A', openingStatus: 'OPEN' }],
            terrainParks: [{ name: '3 Kings', openingStatus: 'OPEN' }]
        };
        const mockWeather = {
            currentWeather: { currentTempStandard: 30 },
            dailyForecast: [{ daySnowfall: 1, nightSnowfall: 1 }]
        };

        (epicMixClient.getResortStatus as any).mockResolvedValue(mockStatus);
        (epicMixClient.getResortWeather as any).mockResolvedValue(mockWeather);

        const result = await getResortStatus('parkcity');

        expect(epicMixClient.getResortStatus).toHaveBeenCalledWith('14'); // check ID mapping
        expect(result.source).toBe('epic-mix');
        expect(result.lifts['Lift A']).toBe('open');
        expect(result.summary.parks.open).toBe(1);
    });

    it('should correctly filter terrain parks for Park City', async () => {
        const mockStatus = {
            lifts: [],
            terrainParks: [
                { name: '3 Kings', openingStatus: 'OPEN' }, // In list
                { name: 'Random Park', openingStatus: 'OPEN' } // Not in list
            ]
        };
        const mockWeather = { currentWeather: { currentTempStandard: 0 }, dailyForecast: [{ daySnowfall: 0, nightSnowfall: 0 }] };

        (epicMixClient.getResortStatus as any).mockResolvedValue(mockStatus);
        (epicMixClient.getResortWeather as any).mockResolvedValue(mockWeather);

        const result = await getResortStatus('parkcity');

        expect(result.summary.parks.open).toBe(2); // Both parks should be counted now (dynamic discovery)
        expect(result.summary.parks.total).toBe(2);

        // Verify details are populated
        expect(result.summary.parks.details).toEqual({
            '3 Kings': 'open',
            'Random Park': 'open'
        });
    });

    it('should fallback to micrawl for Park City upon Epic Mix failure', async () => {
        (epicMixClient.getResortStatus as any).mockRejectedValue(new Error('API fail'));

        const mockScrape = { success: true, html: '<script>var TerrainStatusFeed = { Lifts: [{Name:"ScrapedLift", Status:1}] };</script>' };
        (micrawl.scrapeUrl as any).mockResolvedValue(mockScrape);
        // Ensure weather fetch succeeds for fallback
        (openMeteo.fetchResortWeather as any).mockResolvedValue([{ current: { temperature_2m: 20 }, daily: { snowfall_sum: [5] } }]);

        const result = await getResortStatus('parkcity');

        expect(result.source).toBe('micrawl');
        expect(result.lifts['ScrapedLift']).toBe('open');
    });

    it('should return safe default for unconfigured resort', async () => {
        const result = await getResortStatus('unknown-resort');
        // If unknown, even weather provider fails (location unknown), so 'none' implies error/not found
        // The service returns source: 'error' if all failed or 'none' if Manager returns fallback
        // Manager returns 'none' source if ultimate failure.
        // Facade maps it.
        expect(result.source).toBe('none');
        expect(result.summary.total).toBe(0);
    });

    it('should work for a non-Park City configured resort (e.g. Breck)', async () => {
        // Breck has empty park list, so should include all returned parks
        const mockStatus = {
            lifts: [{ name: 'Imperial', openingStatus: 'OPEN' }],
            terrainParks: [{ name: 'Freeway', openingStatus: 'OPEN' }]
        };
        const mockWeather = { currentWeather: { currentTempStandard: 10 }, dailyForecast: [{ daySnowfall: 2, nightSnowfall: 2 }] };

        (epicMixClient.getResortStatus as any).mockResolvedValue(mockStatus);
        (epicMixClient.getResortWeather as any).mockResolvedValue(mockWeather);

        const result = await getResortStatus('breck');

        expect(epicMixClient.getResortStatus).toHaveBeenCalledWith('4'); // Breck ID
        expect(result.lifts['Imperial']).toBe('open');
        expect(result.summary.parks.open).toBe(1); // Should be included as Breck has no filter
    });
});
