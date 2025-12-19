import { logger } from '../utils/logger';
import { IRoadService } from './interfaces';
import { Camera, Incident, RoadCondition } from '../types/domain';

export class CaltransRoadService implements IRoadService {
    private regionId: string;

    constructor(regionId: string = 'tahoe') {
        this.regionId = regionId;
    }

    async getIncidents(): Promise<Incident[]> {
        logger.debug('CaltransRoadService: fetching incidents', { regionId: this.regionId });
        try {
            const res = await fetch(`/api/v1/roads/incidents?region=${this.regionId}`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const incidents = await res.json();
            logger.debug(`CaltransRoadService: found ${incidents.length} incidents for region ${this.regionId}`);
            return incidents;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching incidents', { error, regionId: this.regionId });
            return [];
        }
    }

    async getConditions(districts?: string[]): Promise<RoadCondition[]> {
        logger.debug('CaltransRoadService: fetching road conditions', { regionId: this.regionId, districts });
        const url = new URL('/api/v1/roads/conditions', window.location.origin);
        url.searchParams.set('region', this.regionId);
        if (districts && districts.length > 0) {
            url.searchParams.set('districts', districts.join(','));
        }

        try {
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const conditions = await res.json();
            logger.debug(`CaltransRoadService: found ${conditions.length} conditions for region ${this.regionId}`);
            return conditions;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching conditions', { error, regionId: this.regionId });
            return [];
        }
    }

    async getCameras(filterRoute?: string): Promise<Camera[]> {
        logger.debug('CaltransRoadService: fetching cameras', { filterRoute, regionId: this.regionId });
        const url = new URL('/api/v1/roads/cameras', window.location.origin);
        url.searchParams.set('region', this.regionId);

        try {
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const cameras = await res.json();
            logger.debug(`CaltransRoadService: found ${cameras.length} cameras for region ${this.regionId}`);
            return cameras;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching cameras', { error, regionId: this.regionId });
            return [];
        }
    }
}

// Legacy Exports
export const getCameras = async (districts?: string[]) => {
    // Adapter for legacy calls that might pass districts
    // Interface getCameras doesn't take districts, but legacy export did.
    // If we want to support it:
    const url = new URL('/api/v1/roads/cameras', window.location.origin); // Assuming browser context
    url.searchParams.set('region', 'tahoe');
    if (districts) url.searchParams.set('districts', districts.join(','));

    try {
        const res = await fetch(url.toString());
        if (!res.ok) return [];
        return await res.json();
    } catch (e) { return []; }
};

export const getRoadConditions = async (districts?: string[]) => new CaltransRoadService().getConditions(districts);
export const getIncidents = async () => new CaltransRoadService().getIncidents();

export interface RoadWeatherStation {
    id: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
        elevation: number;
    };
    weather: {
        airTemp: number;
        windSpeed: number;
    };
    // ... Simplified
}

export const getRoadWeatherStations = async (districts?: string[]): Promise<RoadWeatherStation[]> => {
    logger.info('Fetching Caltrans road weather stations...');
    const url = new URL('/api/v1/roads/weather-stations', window.location.origin);
    url.searchParams.set('region', 'tahoe');
    if (districts && districts.length > 0) url.searchParams.set('districts', districts.join(','));

    try {
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(res.statusText);
        return await res.json();
    } catch (e) {
        logger.error('Failed to fetch RWIS', e);
        return [];
    }
};
