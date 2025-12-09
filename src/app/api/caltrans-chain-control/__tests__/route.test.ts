import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/caltrans-chain-control', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and transform chain control data from default districts', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            cc: {
                                index: '3-ALP-89-23.6-N-237',
                                location: {
                                    district: '3',
                                    locationName: 'Luther Pass',
                                    route: 'SR-89',
                                    latitude: '38.787944',
                                    longitude: '-119.93968',
                                },
                                inService: 'true',
                                statusData: {
                                    status: 'R-0',
                                    statusDescription: 'No chain controls are in effect at this time.',
                                    statusTimestamp: {
                                        statusDate: '2025-12-08',
                                        statusTime: '18:00:00',
                                    },
                                },
                                recordTimestamp: {
                                    recordDate: '2025-12-08',
                                    recordTime: '18:00:00',
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

        const request = new Request('http://localhost:3000/api/caltrans-chain-control');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            id: '3-ALP-89-23.6-N-237',
            type: 'ChainControl',
            properties: {
                type: 'Chain Control',
                routeName: 'SR-89 Luther Pass',
                primaryLatitude: 38.787944,
                primaryLongitude: -119.93968,
                currentConditions: [
                    {
                        conditionDescription: 'R-0: No chain controls are in effect at this time.',
                    },
                ],
            },
        });
    });

    it('should support custom districts parameter', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }),
        });

        const request = new Request('http://localhost:3000/api/caltrans-chain-control?districts=10');
        await GET(request);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
            'https://cwwp2.dot.ca.gov/data/d10/cc/ccStatusD10.json',
            expect.any(Object)
        );
    });

    it('should filter out locations not in service', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            cc: {
                                index: '1',
                                location: {
                                    locationName: 'Location 1',
                                    route: 'I-80',
                                    latitude: '39.0',
                                    longitude: '-120.0',
                                },
                                inService: 'true',
                                statusData: {
                                    status: 'R-0',
                                    statusDescription: 'No restrictions',
                                    statusTimestamp: {},
                                },
                                recordTimestamp: {},
                            },
                        },
                        {
                            cc: {
                                index: '2',
                                location: {
                                    locationName: 'Location 2',
                                    route: 'I-80',
                                    latitude: '39.1',
                                    longitude: '-120.1',
                                },
                                inService: 'false',
                                statusData: {
                                    status: 'R-1',
                                    statusDescription: 'Chains required',
                                    statusTimestamp: {},
                                },
                                recordTimestamp: {},
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

        const request = new Request('http://localhost:3000/api/caltrans-chain-control');
        const response = await GET(request);
        const data = await response.json();

        expect(data).toHaveLength(1);
        expect(data[0].properties.routeName).toBe('I-80 Location 1');
    });

    it('should handle different chain control statuses', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            cc: {
                                index: '1',
                                location: {
                                    locationName: 'Donner Pass',
                                    route: 'I-80',
                                    latitude: '39.0',
                                    longitude: '-120.0',
                                },
                                inService: 'true',
                                statusData: {
                                    status: 'R-2',
                                    statusDescription: 'Chains required on all vehicles except 4WD',
                                    statusTimestamp: {},
                                },
                                recordTimestamp: {},
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

        const request = new Request('http://localhost:3000/api/caltrans-chain-control');
        const response = await GET(request);
        const data = await response.json();

        expect(data[0].properties.currentConditions[0].conditionDescription).toBe(
            'R-2: Chains required on all vehicles except 4WD'
        );
    });

    it('should handle API errors gracefully', async () => {
        // All three districts fail
        mockFetch
            .mockRejectedValue(new Error('Network error'))
            .mockRejectedValue(new Error('Network error'))
            .mockRejectedValue(new Error('Network error'));

        const request = new Request('http://localhost:3000/api/caltrans-chain-control');
        const response = await GET(request);
        const data = await response.json();

        // API route catches errors and returns empty array with 200
        expect(response.status).toBe(200);
        expect(data).toEqual([]);
    });

    it('should handle failed HTTP responses', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found',
        });

        const request = new Request('http://localhost:3000/api/caltrans-chain-control?districts=3');
        const response = await GET(request);
        const data = await response.json();

        // Should return empty array for failed districts
        expect(response.status).toBe(200);
        expect(data).toEqual([]);
    });
});
