import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIncidents, getRoadConditions, getStreamingCameras } from '../cdot';

describe('cdot service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // getCameras is deprecated - use getStreamingCameras instead (requires region check)



    describe('getIncidents', () => {
        it('should fetch incidents from API and map to domain objects', async () => {
            const mockIncidents = {
                features: [
                    {
                        id: '1',
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [-105, 39] },
                        properties: {
                            type: 'Accident',
                            startTime: '2025-12-05T10:00:00Z',
                            travelerInformationMessage: 'Test incident',
                            routeName: 'I-70'
                        }
                    }
                ]
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockIncidents
            });

            const result = await getIncidents();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: '1',
                type: 'Accident',
                description: 'Test incident',
                startTime: '2025-12-05T10:00:00Z',
                location: { lat: 39, lon: -105 },
                routeName: 'I-70'
            });
            expect(global.fetch).toHaveBeenCalledWith('/api/incidents');
        });

        it('should return empty array on error', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await getIncidents();

            expect(result).toEqual([]);
        });
    });

    describe('getRoadConditions', () => {
        it('should fetch road conditions from API and map to domain objects', async () => {
            const mockConditions = {
                features: [
                    {
                        id: '1',
                        type: 'Feature',
                        properties: {
                            type: 'RoadCondition',
                            routeName: 'I-70',
                            primaryLatitude: 39.5,
                            primaryLongitude: -105.5,
                            currentConditions: [
                                { conditionDescription: 'Icy' }
                            ]
                        }
                    }
                ]
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockConditions
            });

            const result = await getRoadConditions();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                location: { lat: 39.5, lon: -105.5 },
                routeName: 'I-70',
                status: 'Icy',
                description: 'Icy'
            });
            expect(global.fetch).toHaveBeenCalledWith('/api/road-conditions');
        });

        it('should return empty array on error', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await getRoadConditions();

            expect(result).toEqual([]);
        });
    });

    describe('getStreamingCameras', () => {
        it('should fetch and parse cameras with WMP views', async () => {
            const mockCamerasData = [
                {
                    id: 123,
                    name: 'Test Camera 1',
                    public: true,
                    active: true,
                    location: {
                        latitude: 39.5,
                        longitude: -105.5
                    },
                    views: [
                        {
                            type: 'WMP',
                            url: 'https://publicstreamer1.cotrip.org/rtplive/test/playlist.m3u8',
                            videoPreviewUrl: 'https://cocam.carsprogram.org/Snapshots/test.png'
                        }
                    ]
                },
                {
                    id: 456,
                    name: 'Test Camera 2',
                    public: true,
                    active: true,
                    location: {
                        latitude: 40.0,
                        longitude: -106.0
                    },
                    views: [
                        {
                            type: 'STILL_IMAGE',
                            url: 'https://example.com/image.jpg'
                        },
                        {
                            type: 'WMP',
                            url: 'https://publicstreamer2.cotrip.org/rtplive/test2/playlist.m3u8',
                            videoPreviewUrl: 'https://cocam.carsprogram.org/Snapshots/test2.png'
                        }
                    ]
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockCamerasData
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

        it('should filter out cameras without WMP views', async () => {
            const mockCamerasData = [
                {
                    id: 123,
                    name: 'Camera with WMP',
                    public: true,
                    active: true,
                    location: { latitude: 39.5, longitude: -105.5 },
                    views: [
                        {
                            type: 'WMP',
                            url: 'https://publicstreamer1.cotrip.org/test.m3u8',
                            videoPreviewUrl: 'https://example.com/thumb.png'
                        }
                    ]
                },
                {
                    id: 456,
                    name: 'Camera without WMP',
                    public: true,
                    active: true,
                    location: { latitude: 40.0, longitude: -106.0 },
                    views: [
                        {
                            type: 'STILL_IMAGE',
                            url: 'https://example.com/image.jpg'
                        }
                    ]
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockCamerasData
            });

            const result = await getStreamingCameras();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('123');
        });

        it('should filter out inactive or non-public cameras', async () => {
            const mockCamerasData = [
                {
                    id: 123,
                    name: 'Active Public Camera',
                    public: true,
                    active: true,
                    location: { latitude: 39.5, longitude: -105.5 },
                    views: [{ type: 'WMP', url: 'https://example.com/test.m3u8' }]
                },
                {
                    id: 456,
                    name: 'Inactive Camera',
                    public: true,
                    active: false,
                    location: { latitude: 40.0, longitude: -106.0 },
                    views: [{ type: 'WMP', url: 'https://example.com/test2.m3u8' }]
                },
                {
                    id: 789,
                    name: 'Private Camera',
                    public: false,
                    active: true,
                    location: { latitude: 41.0, longitude: -107.0 },
                    views: [{ type: 'WMP', url: 'https://example.com/test3.m3u8' }]
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockCamerasData
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
