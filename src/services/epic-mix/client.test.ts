
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
});
