import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCameras, getTrafficData, getIncidents, getRoadConditions } from '../cdot';

describe('cdot service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('getCameras', () => {
        it('should return list of cameras', async () => {
            const cameras = await getCameras();

            expect(cameras).toBeInstanceOf(Array);
            expect(cameras.length).toBeGreaterThan(0);
            expect(cameras[0]).toHaveProperty('id');
            expect(cameras[0]).toHaveProperty('name');
            expect(cameras[0]).toHaveProperty('url');
        });
    });

    describe('getTrafficData', () => {
        it('should return list of traffic segments', async () => {
            const segments = await getTrafficData();

            expect(segments).toBeInstanceOf(Array);
            expect(segments.length).toBeGreaterThan(0);
            expect(segments[0]).toHaveProperty('id');
            expect(segments[0]).toHaveProperty('name');
            expect(segments[0]).toHaveProperty('status');
            expect(segments[0]).toHaveProperty('travelTime');
        });
    });

    describe('getIncidents', () => {
        it('should fetch incidents from API', async () => {
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

            expect(result).toEqual(mockIncidents.features);
            expect(global.fetch).toHaveBeenCalledWith('/api/incidents');
        });

        it('should return empty array on error', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await getIncidents();

            expect(result).toEqual([]);
        });
    });

    describe('getRoadConditions', () => {
        it('should fetch road conditions from API', async () => {
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

            expect(result).toEqual(mockConditions.features);
            expect(global.fetch).toHaveBeenCalledWith('/api/road-conditions');
        });

        it('should return empty array on error', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await getRoadConditions();

            expect(result).toEqual([]);
        });
    });
});
