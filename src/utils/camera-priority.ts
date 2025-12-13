import { Camera, Incident, RoadCondition } from '../types/domain';
import distance from '@turf/distance';
import { point } from '@turf/helpers';

/**
 * Prioritizes cameras based on proximity to incidents and adverse road conditions.
 * Cameras closer to problems get a higher score.
 */
export function prioritizeCameras(
    cameras: Camera[],
    incidents: Incident[],
    conditions: RoadCondition[]
): Camera[] {
    // If no alerts, return original order (or random/default)
    if (incidents.length === 0 && conditions.length === 0) {
        return cameras;
    }

    const scoredCameras = cameras.map(camera => {
        let score = 0;
        if (!camera.location?.lat || !camera.location?.lon) return { camera, score: -1 };

        const camPoint = point([camera.location.lon, camera.location.lat]);

        // Score based on proximity to Incidents
        incidents.forEach(incident => {
            // Check for valid location
            if (!incident.location?.lat || !incident.location?.lon) return;

            const incPoint = point([incident.location.lon, incident.location.lat]);
            const d = distance(camPoint, incPoint, { units: 'miles' });

            if (d < 0.5) score += 100;
            else if (d < 1) score += 50;
            else if (d < 2) score += 20;
            else if (d < 5) score += 5;
            else if (d < 10) score += 1;
        });

        // Score based on proximity to Conditions
        conditions.forEach(condition => {
            // Only prioritize if condition is not "Dry" or "Good"
            const status = condition.status.toLowerCase();
            if (status.includes('dry') || status.includes('good')) return;

            if (!condition.location?.lat || !condition.location?.lon) return;

            const condPoint = point([condition.location.lon, condition.location.lat]);
            const d = distance(camPoint, condPoint, { units: 'miles' });

            if (d < 0.5) score += 50;
            else if (d < 1) score += 25;
            else if (d < 2) score += 10;
        });

        return { camera, score };
    });

    // Sort descending by score
    scoredCameras.sort((a, b) => b.score - a.score);

    return scoredCameras.map(item => item.camera);
}
