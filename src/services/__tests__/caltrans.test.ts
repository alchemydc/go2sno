import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCameras, getRoadConditions, getRoadWeatherStations } from '../caltrans';

describe('caltrans service', () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = mockFetch;
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('getCameras', () => {
        it('should fetch cameras from API route', async () => {
            const mockCameras = [
                {
                    id: 'd3-1',
                    name: 'Test Camera',
                    url: 'https://example.com/stream.m3u8',
                    thumbnailUrl: 'https://example.com/thumb.jpg',
                    latitude: 39.0,
                    longitude: -120.0,
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCameras,
            });

            const cameras = await getCameras();

            expect(cameras).toEqual(mockCameras);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/caltrans-cctv')
            );
        });

        it('should support custom districts parameter', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await getCameras(['3', '9']);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('districts=3%2C9')
            );
        });

        it('should throw error on failed fetch', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(getCameras()).rejects.toThrow('Failed to fetch cameras');
        });

        it('should log camera count', async () => {
            const consoleSpy = vi.spyOn(console, 'log');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: '1' }, { id: '2' }],
            });

            await getCameras();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[INFO] Found 2 Caltrans cameras')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getRoadConditions', () => {
        it('should fetch road conditions from API route', async () => {
            const mockConditions = [
                {
                    id: '1',
                    type: 'ChainControl',
                    properties: {
                        type: 'Chain Control',
                        routeName: 'I-80 Test',
                        primaryLatitude: 39.0,
                        primaryLongitude: -120.0,
                        currentConditions: [
                            { conditionDescription: 'R-0: No restrictions' },
                        ],
                    },
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConditions,
            });

            const conditions = await getRoadConditions();

            expect(conditions).toEqual(mockConditions);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/caltrans-chain-control')
            );
        });

        it('should support custom districts parameter', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await getRoadConditions(['10']);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('districts=10')
            );
        });

        it('should throw error on failed fetch', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Service Unavailable',
            });

            await expect(getRoadConditions()).rejects.toThrow(
                'Failed to fetch road conditions'
            );
        });

        it('should log condition count', async () => {
            const consoleSpy = vi.spyOn(console, 'log');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: '1' }, { id: '2' }, { id: '3' }],
            });

            await getRoadConditions();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[INFO] Found 3 Caltrans road conditions')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getRoadWeatherStations', () => {
        it('should fetch road weather stations from API route', async () => {
            const mockStations = [
                {
                    id: 'rwis-d3-1',
                    name: 'Hwy 80 at Donner Summit',
                    location: {
                        latitude: 39.33906,
                        longitude: -120.34782,
                        route: 'I-80',
                        nearbyPlace: 'Soda Springs',
                        elevation: 7221,
                    },
                    timestamp: {
                        date: '2025-12-08',
                        time: '18:00:00',
                        epoch: 1765245600,
                    },
                    weather: {
                        airTemperature: 32,
                        dewpoint: 28,
                        humidity: 85,
                        visibility: 5000,
                        windSpeed: 10,
                        windDirection: 270,
                        windGust: 15,
                    },
                    surface: {
                        status: 'Ice Warning',
                        temperature: 30,
                        freezePoint: 32,
                        blackIceWarning: true,
                    },
                    precipitation: {
                        isPresent: true,
                        rate: 5,
                        last24Hours: 100,
                    },
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockStations,
            });

            const stations = await getRoadWeatherStations();

            expect(stations).toEqual(mockStations);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/caltrans-rwis')
            );
        });

        it('should support custom districts parameter', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await getRoadWeatherStations(['3', '9']);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('districts=3%2C9')
            );
        });

        it('should handle empty districts array', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await getRoadWeatherStations([]);

            // Should not include districts parameter if array is empty
            expect(mockFetch).toHaveBeenCalledWith(
                expect.not.stringContaining('districts')
            );
        });

        it('should throw error on failed fetch', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Gateway Timeout',
            });

            await expect(getRoadWeatherStations()).rejects.toThrow(
                'Failed to fetch road weather stations'
            );
        });

        it('should log station count', async () => {
            const consoleSpy = vi.spyOn(console, 'log');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => new Array(35).fill({ id: 'test' }),
            });

            await getRoadWeatherStations();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[INFO] Found 35 Caltrans road weather stations')
            );

            consoleSpy.mockRestore();
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network failure'));

            await expect(getRoadWeatherStations()).rejects.toThrow('Network failure');
        });
    });
});
