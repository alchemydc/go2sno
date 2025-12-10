import { Camera, Incident, RoadCondition } from '../services/cdot';
import pointToLineDistance from '@turf/point-to-line-distance';
import distance from '@turf/distance';
import { point } from '@turf/helpers';

/**
 * Prioritizes cameras based on proximity to incidents and adverse road conditions.
 * Cameras closer to "interesting" events get a higher score.
 */
export const prioritizeCameras = (
    cameras: Camera[],
    incidents: Incident[],
    conditions: RoadCondition[]
): Camera[] => {
    if (!cameras.length) return [];

    // Helper to get coordinates from an incident
    const getIncidentPoint = (incident: Incident) => {
        let coords: number[];
        if (incident.geometry.type === 'MultiPoint') {
            coords = (incident.geometry.coordinates as number[][])[0];
        } else if (incident.geometry.type === 'Point') {
            coords = incident.geometry.coordinates as number[];
        } else {
            return null;
        }
        return point(coords);
    };

    // Helper to check if a condition is "adverse" (snow, ice, etc)
    const isAdverseCondition = (condition: RoadCondition): boolean => {
        const desc = condition.properties.currentConditions?.[0]?.conditionDescription?.toLowerCase() || '';
        return desc.includes('snow') || desc.includes('ice') || desc.includes('icy') || desc.includes('wet') || desc.includes('closed');
    };

    const scoredCameras = cameras.map(camera => {
        let score = 0;
        if (!camera.latitude || !camera.longitude) return { camera, score: -1 };

        const camPoint = point([camera.longitude, camera.latitude]);

        // 1. Check proximity to Incidents (+10 per incident within 2 miles)
        incidents.forEach(incident => {
            const incPoint = getIncidentPoint(incident);
            if (incPoint) {
                const d = distance(camPoint, incPoint, { units: 'miles' });
                if (d <= 2) {
                    score += 10;
                    // Bonus for closer proximity
                    if (d <= 0.5) score += 5;
                }
            }
        });

        // 2. Check proximity to Adverse Road Conditions (+5 per condition within 5 miles)
        conditions.forEach(condition => {
            if (isAdverseCondition(condition)) {
                const condPoint = point([condition.properties.primaryLongitude, condition.properties.primaryLatitude]);
                const d = distance(camPoint, condPoint, { units: 'miles' });
                if (d <= 5) {
                    score += 5;
                }
            }
        });

        // 3. Keep original order as tie-breaker (assumes original order has some geographic logic)
        return { camera, score };
    });

    // Sort descending by score
    scoredCameras.sort((a, b) => b.score - a.score);

    return scoredCameras.map(item => item.camera);
};
