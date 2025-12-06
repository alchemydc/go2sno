import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeather } from '../weather';

describe('weather service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('getWeather', () => {
        it('should fetch weather data successfully', async () => {
            const mockPointsData = {
                properties: {
                    forecast: 'https://api.weather.gov/gridpoints/BOU/52,73/forecast'
                }
            };

            const mockForecastData = {
                properties: {
                    periods: [
                        {
                            temperature: 32,
                            shortForecast: 'Partly Cloudy',
                            windSpeed: '10 mph',
                            icon: 'https://example.com/icon.png'
                        }
                    ]
                }
            };

            global.fetch = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPointsData
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockForecastData
                });

            const result = await getWeather(39.5, -106.0);

            expect(result).toEqual({
                temperature: 32,
                shortForecast: 'Partly Cloudy',
                windSpeed: '10 mph',
                icon: 'https://example.com/icon.png'
            });
        });

        it('should return default values on error', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await getWeather(39.5, -106.0);

            expect(result).toEqual({
                temperature: NaN,
                shortForecast: 'Unavailable',
                windSpeed: 'N/A',
                icon: ''
            });
        });
    });
});
