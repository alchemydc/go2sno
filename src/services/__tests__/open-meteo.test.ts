import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { fetchResortWeather, getWeatherDescription } from '../open-meteo';

global.fetch = vi.fn();

describe('Open-Meteo Service', () => {
    beforeEach(() => {
        (global.fetch as Mock).mockClear();
    });

    describe('getWeatherDescription', () => {
        it('should return correct description for known codes', () => {
            expect(getWeatherDescription(0)).toBe('Clear sky');
            expect(getWeatherDescription(71)).toBe('Slight Snow');
        });

        it('should return Unknown for unknown codes', () => {
            expect(getWeatherDescription(999)).toBe('Unknown');
        });
    });

    describe('fetchResortWeather', () => {
        const mockLocations = [
            { lat: 40.0, lon: -105.0 },
            { lat: 39.0, lon: -106.0 }
        ];

        const mockResponse = [
            {
                latitude: 40.0,
                longitude: -105.0,
                current: { temperature_2m: 30, weather_code: 0 },
                daily: { snowfall_sum: [0] }
            },
            {
                latitude: 39.0,
                longitude: -106.0,
                current: { temperature_2m: 20, weather_code: 71 },
                daily: { snowfall_sum: [5] }
            }
        ];

        it('should fetch and return weather data array', async () => {
            (global.fetch as Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            const result = await fetchResortWeather(mockLocations);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(2);
            expect(result[0].current.temperature_2m).toBe(30);
            expect(result[1].daily.snowfall_sum[0]).toBe(5);
        });

        it('should handle single object response (one location)', async () => {
            const singleResponse = mockResponse[0];
            (global.fetch as Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => singleResponse
            });

            const result = await fetchResortWeather([mockLocations[0]]);

            expect(result).toHaveLength(1);
            expect(result[0].latitude).toBe(40.0);
        });

        it('should return empty array on failure', async () => {
            (global.fetch as Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            const result = await fetchResortWeather(mockLocations);

            expect(result).toEqual([]);
        });

        it('should return empty array on network error', async () => {
            (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

            const result = await fetchResortWeather(mockLocations);

            expect(result).toEqual([]);
        });
    });
});
