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
        it('should return forecast for valid zone slug (Vail)', async () => {
            const mockResponse = [
                {
                    type: 'avalancheforecast',
                    // Updated December 14, 2025 - new aggregate ID for Vail/Summit/Front Range
                    areaId: '06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7',
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
            expect(result?.areaId).toBe('06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7');
        });

        it('should return forecast for valid zone slug (Front Range)', async () => {
            const mockResponse = [
                {
                    type: 'avalancheforecast',
                    areaId: '06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7',
                    dangerRating: 2
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.getForecastByZoneSlug('front-range', '2025-12-05');

            expect(result).not.toBeNull();
            expect(result?.areaId).toBe('06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7');
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
