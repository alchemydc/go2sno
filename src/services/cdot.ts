import { logger } from '../utils/logger';
import { IRoadService } from './interfaces';
import { Camera, Incident, RoadCondition } from '../types/domain';

export class CdotRoadService implements IRoadService {
  async getIncidents(): Promise<Incident[]> {
    logger.debug('CdotRoadService: fetching incidents');
    try {
      const res = await fetch('/api/v1/roads/incidents?region=co');
      if (!res.ok) throw new Error('Failed to fetch incidents');
      const incidents = await res.json();
      logger.debug(`CdotRoadService: found ${incidents.length} incidents`);
      return incidents;
    } catch (error) {
      logger.error('CdotRoadService: Error fetching incidents', { error });
      return [];
    }
  }

  async getConditions(): Promise<RoadCondition[]> {
    logger.debug('CdotRoadService: fetching road conditions');
    try {
      const res = await fetch('/api/v1/roads/conditions?region=co');
      if (!res.ok) throw new Error('Failed to fetch road conditions');
      const conditions = await res.json();
      logger.debug(`CdotRoadService: found ${conditions.length} conditions`);
      return conditions;
    } catch (error) {
      logger.error('CdotRoadService: Error fetching road conditions', { error });
      return [];
    }
  }

  async getCameras(filterRoute?: string): Promise<Camera[]> {
    logger.debug('CdotRoadService: fetching cameras', { filterRoute });
    try {
      // Logic for filtering by route could be passed as generic filter param if API supports it
      const res = await fetch('/api/v1/roads/cameras?region=co');
      if (!res.ok) throw new Error('Failed to fetch cameras');
      const cameras = await res.json();

      logger.debug(`CdotRoadService: found ${cameras.length} cameras`);
      return cameras;
    } catch (error) {
      logger.error('CdotRoadService: Error fetching cameras', { error });
      return [];
    }
  }
}

// Deprecated legacy exports for backward compatibility during refactor
// (Can be removed once factory.ts is updated)
export const getIncidents = async () => new CdotRoadService().getIncidents();
export const getRoadConditions = async () => new CdotRoadService().getConditions();
export const getStreamingCameras = async () => new CdotRoadService().getCameras();

// Re-export specific legacy types if needed by other components temporarily,
// OR essentially just remove them if we are confident.
// Given the errors "Import declaration conflicts with local declaration", we must remove the local ones.
// The code below the class was the original file content which is now duplicated.
// I am replacing everything from line 100 onwards (after the class) with just the compatibility exports.

