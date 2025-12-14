import { Camera, Incident, RoadCondition } from '../types/domain';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import { getRegion } from '../config/regions';

/**
 * Prioritizes cameras based on proximity to incidents and adverse road conditions.
 * Cameras closer to problems get a higher score.
 */
export function prioritizeCameras(
    cameras: Camera[],
    incidents: Incident[],
    conditions: RoadCondition[],
    regionId: string = 'co' // Default to CO if not provided
): Camera[] {
    const region = getRegion(regionId);
    const regionKeywords = region?.cameraKeywords || {};

    // Generic keywords valid everywhere
    const genericKeywords: Record<string, number> = {
        'tunnel': 10,
        'pass': 10,
        'summit': 5
    };

    // If no alerts, return original order (or random/default)
    // If no alerts, we still want to sort by relevance (keywords)
    // if (incidents.length === 0 && conditions.length === 0) {
    //     return cameras;
    // }

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

        // Score based on keywords
        const name = camera.name.toLowerCase();

        // Check Region Specific Keywords
        for (const [keyword, bonus] of Object.entries(regionKeywords)) {
            if (name.includes(keyword)) {
                score += bonus;
            }
        }

        // Check Generic Keywords
        for (const [keyword, bonus] of Object.entries(genericKeywords)) {
            // Apply generic bonus only if not already heavily boosted by region guidelines??
            // For simplicity, we'll just add them. If "tunnel" is in both (e.g. CO has it at 20, generic has it at 10), it might double count?
            // User requested: "prioritizing "tunnel" and "pass" is safe to do for all regions."
            // But if we put "tunnel: 20" in CO config, and generic has "tunnel: 10", it gets +30.
            // Let's rely on region config being the primary source of truth for "Specific" ones, and generic as a fallback/baseline.
            // To avoid double counting, we can check if keyword is in regionKeywords.
            if (!regionKeywords[keyword] && name.includes(keyword)) {
                score += bonus;
            }
        }

        return { camera, score };
    });

    // Sort descending by score
    scoredCameras.sort((a, b) => b.score - a.score);

    // Deduplicate by name (keep highest scored one, which effectively means first execution if scores tied, but we sorted already)
    const seenNames = new Set<string>();
    const uniqueCameras: Camera[] = [];

    for (const item of scoredCameras) {
        if (!seenNames.has(item.camera.name)) {
            seenNames.add(item.camera.name);
            uniqueCameras.push(item.camera);
        }
    }

    return uniqueCameras;
}
