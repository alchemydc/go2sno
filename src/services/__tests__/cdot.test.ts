import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIncidents, getRoadConditions, getStreamingCameras } from '../cdot';

describe('cdot service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // getCameras is deprecated - use getStreamingCameras instead (requires region check)



    describe('getIncidents', () => {
        it('should fetch incidents from API and map to domain objects', async () => {
            const mockIncidents = [
                {
                    id: '1',
                    type: 'Accident',
                    description: 'Test incident',
                    startTime: '2025-12-05T10:00:00Z',
                    location: { lat: 39, lon: -105 },
                    routeName: 'I-70',
                    regionId: 'co',
                    provider: 'cdot'
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockIncidents
            });

            const result = await getIncidents();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockIncidents[0]);
            expect(global.fetch).toHaveBeenCalledWith('/api/v1/roads/incidents?region=co');
        });

        // ...
        describe('getRoadConditions', () => {
            it('should fetch road conditions from API and map to domain objects', async () => {
                const mockConditions = [
                    {
                        id: '1',
                        type: 'RoadCondition',
                        location: { lat: 39.5, lon: -105.5 },
                        routeName: 'I-70',
                        status: 'Icy',
                        description: 'Icy',
                        regionId: 'co',
                        provider: 'cdot'
                    }
                ];

                global.fetch = vi.fn().mockResolvedValue({
                    ok: true,
                    json: async () => mockConditions
                });

                const result = await getRoadConditions();

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(mockConditions[0]);
                expect(global.fetch).toHaveBeenCalledWith('/api/v1/roads/conditions?region=co');
            });

            it('should return empty array on error', async () => {
                global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
                const result = await getRoadConditions();
                expect(result).toEqual([]);
            });
        });

        describe('getStreamingCameras', () => {
            it('should fetch and parse cameras with WMP views', async () => {
                global.fetch = vi.fn().mockResolvedValue({
                    ok: true,
                    json: async () => ([
                        {
                            id: '123',
                            name: 'Test Camera 1',
                            url: 'https://publicstreamer1.cotrip.org/rtplive/test/playlist.m3u8',
                            thumbnailUrl: 'https://cocam.carsprogram.org/Snapshots/test.png',
                            type: 'stream',
                            location: { lat: 39.5, lon: -105.5 },
                            regionId: 'co'
                        },
                        {
                            id: '456',
                            name: 'Test Camera 2',
                            url: 'https://publicstreamer2.cotrip.org/rtplive/test2/playlist.m3u8',
                            thumbnailUrl: 'https://cocam.carsprogram.org/Snapshots/test2.png',
                            type: 'stream',
                            location: { lat: 40.0, lon: -106.0 },
                            regionId: 'co'
                        }
                    ])
                });

                const result = await getStreamingCameras();

                expect(result).toHaveLength(2);
                expect(result[0]).toEqual({
                    id: '123',
                    name: 'Test Camera 1',
                    url: 'https://publicstreamer1.cotrip.org/rtplive/test/playlist.m3u8',
                    thumbnailUrl: 'https://cocam.carsprogram.org/Snapshots/test.png',
                    type: 'stream',
                    location: {
                        lat: 39.5,
                        lon: -105.5
                    },
                    regionId: 'co'
                });
                expect(result[1]).toEqual({
                    id: '456',
                    name: 'Test Camera 2',
                    url: 'https://publicstreamer2.cotrip.org/rtplive/test2/playlist.m3u8',
                    thumbnailUrl: 'https://cocam.carsprogram.org/Snapshots/test2.png',
                    type: 'stream',
                    location: {
                        lat: 40.0,
                        lon: -106.0
                    },
                    regionId: 'co'
                });
            });

            it('should fetch cameras from API', async () => {
                global.fetch = vi.fn().mockResolvedValue({
                    ok: true,
                    json: async () => ([
                        {
                            id: '123',
                            name: 'Test Camera 1',
                            url: 'https://publicstreamer1.cotrip.org/rtplive/test/playlist.m3u8',
                            thumbnailUrl: 'https://cocam.carsprogram.org/Snapshots/test.png',
                            type: 'stream',
                            location: { lat: 39.5, lon: -105.5 },
                            regionId: 'co'
                        }
                    ])
                });

                const result = await getStreamingCameras();

                expect(result).toHaveLength(1);
                expect(result[0].id).toBe('123');
            });

            it('should return empty array on fetch error', async () => {
                global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

                const result = await getStreamingCameras();

                expect(result).toEqual([]);
            });

            it('should return empty array when API returns non-ok response', async () => {
                global.fetch = vi.fn().mockResolvedValue({
                    ok: false,
                    statusText: 'Internal Server Error'
                });

                const result = await getStreamingCameras();

                expect(result).toEqual([]);
            });
        });
    });
});
