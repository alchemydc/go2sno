import { RoadConditionService, AvalancheService } from './types';
import * as cdot from './cdot';
import * as avalanche from './avalanche';

import * as caltrans from './caltrans';

// Colorado implementations (real services)
class ColoradoRoadService implements RoadConditionService {
    async getIncidents() {
        return cdot.getIncidents();
    }

    async getRoadConditions() {
        return cdot.getRoadConditions();
    }
}

class CaltransRoadService implements RoadConditionService {
    async getIncidents() {
        return caltrans.getIncidents();
    }
    async getRoadConditions() {
        return caltrans.getRoadConditions();
    }
}

class ColoradoAvalancheService implements AvalancheService {
    async getAvalancheForecast(destination: string) {
        return avalanche.getAvalancheForecast(destination);
    }
}

// Stub implementations for unsupported regions
class StubRoadService implements RoadConditionService {
    async getIncidents() {
        return [];
    }

    async getRoadConditions() {
        return [];
    }
}

class StubAvalancheService implements AvalancheService {
    async getAvalancheForecast(destination: string) {
        return null;
    }
}

export function getRoadService(regionId: string): RoadConditionService {
    if (regionId === 'co') {
        return new ColoradoRoadService();
    }
    if (regionId === 'canv') {
        return new CaltransRoadService();
    }
    return new StubRoadService();
}

export function getAvalancheService(regionId: string): AvalancheService {
    if (regionId === 'co') {
        return new ColoradoAvalancheService();
    }
    return new StubAvalancheService();
}
