import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvalancheForecast } from '../avalanche';

describe('avalanche service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('getAvalancheForecast', () => {
        it('should return forecast data on successful fetch', async () => {
            const mockForecast = {
                zoneId: 'test-zone',
                zoneName: 'Test Zone',
                dangerRating: 3,
                dangerRatingDescription: 'Considerable',
                summary: 'Test summary',
                issueDate: '2025-12-05',
                url: 'https://example.com'
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockForecast
            });

            const result = await getAvalancheForecast('frisco');

            expect(result).toEqual(mockForecast);
            expect(global.fetch).toHaveBeenCalledWith('/api/avalanche?destination=frisco');
        });

        it('should return null on API error', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                statusText: 'Not Found'
            });

            const result = await getAvalancheForecast('invalid');

            expect(result).toBeNull();
        });

        it('should return null on network error', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await getAvalancheForecast('frisco');

            expect(result).toBeNull();
        });
    });
});
