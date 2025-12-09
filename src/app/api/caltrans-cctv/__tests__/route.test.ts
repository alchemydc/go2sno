import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/caltrans-cctv', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and transform camera data from default districts', async () => {
        // Mock successful responses from D3, D9, D10
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            cctv: {
                                index: '1',
                                location: {
                                    district: '3',
                                    locationName: 'Hwy 80 at Blue Canyon',
                                    latitude: '39.2834',
                                    longitude: '-120.70311',
                                },
                                inService: 'true',
                                imageData: {
                                    streamingVideoURL: 'https://example.com/stream.m3u8',
                                    static: {
                                        currentImageURL: 'https://example.com/static.jpg',
                                        currentImageUpdateFrequency: '60',
                                    },
                                },
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            });

        const request = new Request('http://localhost:3000/api/caltrans-cctv');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            id: 'd3-1',
            name: 'Hwy 80 at Blue Canyon',
            url: 'https://example.com/stream.m3u8',
            thumbnailUrl: 'https://example.com/static.jpg',
            latitude: 39.2834,
            longitude: -120.70311,
        });
    });

    it('should support custom districts parameter', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }),
        });

        const request = new Request('http://localhost:3000/api/caltrans-cctv?districts=3');
        await GET(request);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
            'https://cwwp2.dot.ca.gov/data/d3/cctv/cctvStatusD03.json',
            expect.any(Object)
        );
    });

    it('should filter out cameras not in service', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            cctv: {
                                index: '1',
                                location: {
                                    locationName: 'Camera 1',
                                    latitude: '39.0',
                                    longitude: '-120.0',
                                },
                                inService: 'true',
                                imageData: {
                                    streamingVideoURL: '',
                                    static: {
                                        currentImageURL: 'url1.jpg',
                                        currentImageUpdateFrequency: '60',
                                    },
                                },
                            },
                        },
                        {
                            cctv: {
                                index: '2',
                                location: {
                                    locationName: 'Camera 2',
                                    latitude: '39.1',
                                    longitude: '-120.1',
                                },
                                inService: 'false',
                                imageData: {
                                    streamingVideoURL: '',
                                    static: {
                                        currentImageURL: 'url2.jpg',
                                        currentImageUpdateFrequency: '60',
                                    },
                                },
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

        const request = new Request('http://localhost:3000/api/caltrans-cctv');
        const response = await GET(request);
        const data = await response.json();

        expect(data).toHaveLength(1);
        expect(data[0].name).toBe('Camera 1');
    });

    it('should prioritize HLS stream over static image', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            cctv: {
                                index: '1',
                                location: {
                                    locationName: 'Test Camera',
                                    latitude: '39.0',
                                    longitude: '-120.0',
                                },
                                inService: 'true',
                                imageData: {
                                    streamingVideoURL: 'stream.m3u8',
                                    static: {
                                        currentImageURL: 'static.jpg',
                                        currentImageUpdateFrequency: '60',
                                    },
                                },
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

        const request = new Request('http://localhost:3000/api/caltrans-cctv');
        const response = await GET(request);
        const data = await response.json();

        expect(data[0].url).toBe('stream.m3u8');
        expect(data[0].thumbnailUrl).toBe('static.jpg');
    });

    it('should handle API errors gracefully', async () => {
        // All three districts fail
        mockFetch
            .mockRejectedValue(new Error('Network error'))
            .mockRejectedValue(new Error('Network error'))
            .mockRejectedValue(new Error('Network error'));

        const request = new Request('http://localhost:3000/api/caltrans-cctv');
        const response = await GET(request);
        const data = await response.json();

        // API route catches errors and returns empty array with 200
        expect(response.status).toBe(200);
        expect(data).toEqual([]);
    });

    it('should continue with other districts if one fails', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('D3 failed'))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            cctv: {
                                index: '1',
                                location: {
                                    district: '9',
                                    locationName: 'D9 Camera',
                                    latitude: '39.0',
                                    longitude: '-120.0',
                                },
                                inService: 'true',
                                imageData: {
                                    streamingVideoURL: '',
                                    static: {
                                        currentImageURL: 'url.jpg',
                                        currentImageUpdateFrequency: '60',
                                    },
                                },
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            });

        const request = new Request('http://localhost:3000/api/caltrans-cctv');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
        expect(data[0].id).toBe('d9-1');
    });
});
