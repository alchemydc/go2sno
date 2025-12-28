
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EpicMixClient, epicMixClient } from './client';

// Helper to create a mock fetch response
function createFetchResponse(data: any, ok: boolean = true, status: number = 200) {
    return {
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        json: () => Promise.resolve(data),
    };
}

describe('EpicMixClient', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch = vi.fn();
    });

    it('should aggregate lifts and filter terrain parks from multiple map objects', async () => {
        const mockMapResponse = [
            {
                lifts: [{ data: { id: 1, name: 'Lift 1', openingStatus: 'OPEN', type: 'LIFT', liftType: 'CHAIR' } }],
                trails: [{ data: { id: 101, name: 'Park 1', trailLevel: 'TERRAIN_PARKS', openingStatus: 'OPEN', type: 'TRAIL', trailType: 'DOWNHILL_SKIING', groomingStatus: '' } }]
            },
            {
                lifts: [{ data: { id: 2, name: 'Lift 2', openingStatus: 'CLOSED', type: 'LIFT', liftType: 'GONDOLA' } }],
                trails: [{ data: { id: 102, name: 'Run 1', trailLevel: 'BLUE_SQUARE', openingStatus: 'OPEN', type: 'TRAIL', trailType: 'DOWNHILL_SKIING', groomingStatus: '' } }]
            }
        ];

        (global.fetch as any).mockResolvedValue(createFetchResponse(mockMapResponse));

        const result = await epicMixClient.getResortStatus('14');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/resorts/14/maps'),
            expect.anything()
        );

        expect(result.lifts).toHaveLength(2);
        expect(result.lifts.map((l: any) => l.name)).toEqual(['Lift 1', 'Lift 2']);

        expect(result.terrainParks).toHaveLength(1);
        expect(result.terrainParks[0].name).toBe('Park 1');
    });

    it('should handle API errors gracefully', async () => {
        (global.fetch as any).mockResolvedValue(createFetchResponse({}, false, 500));

        await expect(epicMixClient.getResortStatus('14')).rejects.toThrow('Epic Mix API error: 500');
    });

    it('should fetch and return weather data', async () => {
        const mockWeatherResponse = {
            mainLocation: {
                currentWeather: { currentTempStandard: 30, weatherShortDescription: 'Sunny' },
                dailyForecast: [{ date: '2025-01-01', daySnowfall: 2, nightSnowfall: 3 }]
            }
        };

        (global.fetch as any).mockResolvedValue(createFetchResponse(mockWeatherResponse));

        const result = await epicMixClient.getResortWeather('14');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/resorts/14/weather'),
            expect.anything()
        );

        expect(result).toEqual(mockWeatherResponse.mainLocation);
    });

    it('should fetch and parse daily stats snowfall data', async () => {
        const mockDailyStats = {
            dailyStats: {
                hours: { open: '7:00 AM', close: '6:00 PM' },
                lifts: { open: '14', total: '44' },
                runs: { open: '18', total: '348' },
                snowfall: '7in',
                temp: { hi: { f: '22°F', c: '22°F' }, lo: { f: '12°F', c: '12°F' } }
            }
        };

        (global.fetch as any).mockResolvedValue(createFetchResponse(mockDailyStats));

        const result = await epicMixClient.getResortDailyStats('14');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/resorts/14/daily-stats'),
            expect.anything()
        );

        expect(result.dailyStats.snowfall).toBe('7in');
    });

    it('should handle daily stats with zero snowfall', async () => {
        const mockDailyStats = {
            dailyStats: {
                hours: { open: '7:00 AM', close: '6:00 PM' },
                lifts: { open: '0', total: '44' },
                runs: { open: '0', total: '348' },
                snowfall: '0in',
                temp: { hi: { f: '22°F', c: '22°F' }, lo: { f: '12°F', c: '12°F' } }
            }
        };

        (global.fetch as any).mockResolvedValue(createFetchResponse(mockDailyStats));

        const result = await epicMixClient.getResortDailyStats('14');
        expect(result.dailyStats.snowfall).toBe('0in');
    });

    it('should handle daily stats API errors', async () => {
        (global.fetch as any).mockResolvedValue(createFetchResponse({}, false, 401));

        await expect(epicMixClient.getResortDailyStats('14')).rejects.toThrow('Epic Mix API error: 401');
    });
});
