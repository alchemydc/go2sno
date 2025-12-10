import { describe, it, expect } from 'vitest';
import { prioritizeCameras } from '../camera-priority';
import { Camera, Incident, RoadCondition } from '../../services/cdot';

describe('prioritizeCameras', () => {
    const mockCameras: Camera[] = [
        {
            id: 'cam1',
            name: 'Camera 1 (Far)',
            latitude: 40.0,
            longitude: -105.0,
            url: 'url1'
        },
        {
            id: 'cam2',
            name: 'Camera 2 (Near Incident)',
            latitude: 39.5,
            longitude: -106.0,
            url: 'url2'
        },
        {
            id: 'cam3',
            name: 'Camera 3 (Near Condition)',
            latitude: 39.0,
            longitude: -107.0,
            url: 'url3'
        }
    ];

    const mockIncidents: Incident[] = [
        {
            id: 'inc1',
            type: 'Accident',
            properties: {
                type: 'Accident',
                startTime: 'now',
                travelerInformationMessage: 'Crash',
                routeName: 'I-70'
            },
            geometry: {
                type: 'Point',
                coordinates: [-106.001, 39.501] // Very close to cam2
            }
        }
    ];

    const mockConditions: RoadCondition[] = [
        {
            id: 'cond1',
            type: 'RoadCondition',
            properties: {
                type: 'RoadCondition',
                routeName: 'I-70',
                primaryLatitude: 39.001,
                primaryLongitude: -107.001, // Very close to cam3
                currentConditions: [{ conditionDescription: 'Icy' }]
            }
        }
    ];

    it('should prioritize cameras near incidents highest', () => {
        const result = prioritizeCameras(mockCameras, mockIncidents, []);
        expect(result[0].id).toBe('cam2');
        // Cam1 and Cam3 have same score (0), stable sort or order might vary if not handled
        // But Cam2 must be first.
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
});
