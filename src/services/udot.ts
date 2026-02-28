import { IRoadService } from './interfaces';
import { Camera, Incident, RoadCondition } from '../types/domain';
import { logger } from '../utils/logger';

export class UdotRoadService implements IRoadService {
    async getIncidents(): Promise<Incident[]> {
        logger.debug('UdotRoadService: fetching incidents (stub)');
        return [];
    }

    async getConditions(): Promise<RoadCondition[]> {
        logger.debug('UdotRoadService: fetching road conditions (stub)');
        return [];
    }

    async getCameras(filterRoute?: string): Promise<Camera[]> {
        logger.debug('UdotRoadService: fetching cameras (stub)', { filterRoute });
        return [];
    }
}
