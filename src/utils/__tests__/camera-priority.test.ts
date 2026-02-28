import { describe, it, expect } from 'vitest';
import { prioritizeCameras } from '../camera-priority';
import { Camera, Incident, RoadCondition } from '../../types/domain';

describe('prioritizeCameras', () => {
    const mockCameras: Camera[] = [
        {
            id: 'cam1',
            name: 'Camera 1 (Far)',
            location: {
                lat: 40.0,
                lon: -105.0
            },
            url: 'url1',
            type: 'image',
            regionId: 'co'
        },
        {
            id: 'cam2',
            name: 'Camera 2 (Near Incident)',
            location: {
                lat: 39.5,
                lon: -106.0
            },
            url: 'url2',
            type: 'image',
            regionId: 'co'
        },
        {
            id: 'cam3',
            name: 'Camera 3 (Near Condition)',
            location: {
                lat: 39.0,
                lon: -107.0
            },
            url: 'url3',
            type: 'image',
            regionId: 'co'
        }
    ];

    const mockIncidents: Incident[] = [
        {
            id: 'inc1',
            type: 'Accident',
            description: 'Crash',
            startTime: 'now',
            location: {
                lat: 39.501,
                lon: -106.001
            },
            routeName: 'I-70'
        }
    ];

    const mockConditions: RoadCondition[] = [
        {
            routeName: 'I-70',
            status: 'Icy',
            description: 'Icy conditions',
            location: {
                lat: 39.001,
                lon: -107.001
            }
        }
    ];

    it('should prioritize cameras near incidents highest', () => {
        const result = prioritizeCameras(mockCameras, mockIncidents, []);
        expect(result[0].id).toBe('cam2');
    });

    it('should prioritize cameras near road conditions second', () => {
        const result = prioritizeCameras(mockCameras, [], mockConditions);
        expect(result[0].id).toBe('cam3');
    });

    it('should rank incident cameras above condition cameras', () => {
        const result = prioritizeCameras(mockCameras, mockIncidents, mockConditions);
        // Cam2 (Incident, score += 10 + dist) > Cam3 (Condition, score += 5 + dist) > Cam1 (0)
        expect(result[0].id).toBe('cam2');
        expect(result[1].id).toBe('cam3');
        expect(result[2].id).toBe('cam1');
    });

    it('should handle empty lists gracefully', () => {
        const result = prioritizeCameras([], [], []);
        expect(result).toHaveLength(0);
    });

    it('should prioritize cameras with relevant keywords when no incidents exist', () => {
        const cameras = [
            { ...mockCameras[0], id: 'c1', name: 'Random Road Cam' },
            { ...mockCameras[0], id: 'c2', name: 'Fremont Pass Cam', location: { lat: 40, lon: -105 } }, // +10 (CO specific)
            { ...mockCameras[0], id: 'c3', name: 'Eisenhower Tunnel Cam', location: { lat: 40, lon: -105 } } // +20 (CO specific + Generic Tunnel)
        ];

        // Test with CO region
        const result = prioritizeCameras(cameras, [], [], 'co');

        expect(result[0].id).toBe('c3'); // Tunnel (+20)
        expect(result[1].id).toBe('c2'); // Pass (+10)
        expect(result[2].id).toBe('c1'); // Random (0)
    });

    it('should deduplicate cameras with the same name', () => {
        const cameras = [
            { ...mockCameras[0], id: 'c1', name: 'Duplicate Cam' },
            { ...mockCameras[0], id: 'c2', name: 'Duplicate Cam' },
            { ...mockCameras[0], id: 'c3', name: 'Unique Cam' }
        ];

        const result = prioritizeCameras(cameras, [], [], 'co');

        expect(result).toHaveLength(2);
        expect(result.map(c => c.name)).toContain('Duplicate Cam');
        expect(result.map(c => c.name)).toContain('Unique Cam');
    });

    it('should use region specific keywords', () => {
        const cameras = [
            { ...mockCameras[0], id: 'ut1', name: 'Cottonwood Canyon' }, // UT specific (+20)
            { ...mockCameras[0], id: 'ut2', name: 'Random Cam' }
        ];

        // Use UT region
        const result = prioritizeCameras(cameras, [], [], 'ut');
        expect(result[0].id).toBe('ut1');
    });
});
