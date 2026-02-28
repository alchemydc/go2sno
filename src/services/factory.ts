import { IRoadService, IAvalancheService } from './interfaces';
import { getRegion } from '../config/regions';
import { logger } from '../utils/logger';

import { CdotRoadService } from './cdot';
import { CaltransRoadService } from './caltrans';
import { UdotRoadService } from './udot';
import { ColoradoAvalancheService } from './avalanche';
import { UtahAvalancheService } from './uac';
import { SierraAvalancheService } from './sac';

// Stub implementations for unsupported providers or fallbacks
class StubRoadService implements IRoadService {
    async getIncidents() { return []; }
    async getConditions() { return []; }
    async getCameras() { return []; }
}

class StubAvalancheService implements IAvalancheService {
    async getForecast() { return null; }
}

export function getRoadService(regionId: string): IRoadService {
    const region = getRegion(regionId);
    const provider = region.providers.road;

    logger.debug(`Factory: Getting road service for region ${regionId}`, { provider });

    switch (provider) {
        case 'cdot':
            return new CdotRoadService();
        case 'caltrans':
            return new CaltransRoadService(regionId);
        case 'udot':
            return new UdotRoadService();
        case 'stub':
        default:
            return new StubRoadService();
    }
}

export function getAvalancheService(regionId: string): IAvalancheService {
    const region = getRegion(regionId);
    const provider = region.providers.avalanche;

    logger.debug(`Factory: Getting avalanche service for region ${regionId}`, { provider });

    switch (provider) {
        case 'caic':
            return new ColoradoAvalancheService();
        case 'uac':
            return new UtahAvalancheService();
        case 'sac':
            return new SierraAvalancheService();
        case 'stub':
        default:
            return new StubAvalancheService();
    }
}

