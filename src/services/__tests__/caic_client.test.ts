import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CaicClient } from '../caic/client';

describe('CaicClient', () => {
    let client: CaicClient;

    beforeEach(() => {
        client = new CaicClient();
        vi.resetAllMocks();
    });

    describe('getForecast', () => {
        it('should fetch and map forecast data', async () => {
            const mockResponse = [
                {
                    type: 'avalancheforecast',
                    areaId: 'test-area-1',
                    dangerRating: 3
                },
                {
                    type: 'regionaldiscussionforecast',
                    areaId: 'test-area-2'
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.getForecast('2025-12-05');

            expect(result).toHaveLength(2);
            expect(result[0].type).toBe('avalancheforecast');
            expect(result[1].type).toBe('regionaldiscussionforecast');
        });
    });

    describe('getForecastByZoneSlug', () => {
        it('should return forecast for valid zone slug', async () => {
            const mockResponse = [
                {
                    type: 'avalancheforecast',
                    // Updated December 6, 2025 - new Vail & Summit County area ID
                    areaId: '65600272998c7d51ab3b86184d15c811ebce93388b3e4f008717a91be3411769',
                    dangerRating: 3
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.getForecastByZoneSlug('vail-and-summit-county', '2025-12-05');

            expect(result).not.toBeNull();
            expect(result?.type).toBe('avalancheforecast');
            // Updated December 6, 2025 - CAIC changed their zone system and area IDs
            expect(result?.areaId).toBe('65600272998c7d51ab3b86184d15c811ebce93388b3e4f008717a91be3411769');
        });

        it('should return null for invalid zone slug', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => []
            });

            const result = await client.getForecastByZoneSlug('invalid-zone', '2025-12-05');

            expect(result).toBeNull();
        });
    });

    describe('getAvalancheObservations', () => {
        it('should paginate and return observations', async () => {
            const mockPage1 = Array(1000).fill({ id: '1', type: 'observation' });
            const mockPage2 = Array(500).fill({ id: '2', type: 'observation' });

            global.fetch = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPage1
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPage2
                });

            const result = await client.getAvalancheObservations('2025-12-01', '2025-12-05');

            expect(result).toHaveLength(1500);
        });
    });
});
