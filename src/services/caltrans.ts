import { logger } from '../utils/logger';
import { IRoadService } from './interfaces';
import { Camera, Incident, RoadCondition } from '../types/domain';

export class CaltransRoadService implements IRoadService {
    async getIncidents(): Promise<Incident[]> {
        logger.debug('CaltransRoadService: fetching incidents');
        try {
            const res = await fetch('/api/v1/roads/incidents?region=tahoe');
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const incidents = await res.json();
            logger.debug(`CaltransRoadService: found ${incidents.length} incidents`);
            return incidents;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching incidents', { error });
            return [];
        }
    }

    async getConditions(districts?: string[]): Promise<RoadCondition[]> {
        logger.debug('CaltransRoadService: fetching road conditions');
        const url = new URL('/api/v1/roads/conditions', window.location.origin);
        url.searchParams.set('region', 'tahoe');
        if (districts && districts.length > 0) {
            url.searchParams.set('districts', districts.join(','));
        }

        try {
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const conditions = await res.json();
            logger.debug(`CaltransRoadService: found ${conditions.length} conditions`);
            return conditions;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching conditions', { error });
            return [];
        }
    }

    async getCameras(filterRoute?: string): Promise<Camera[]> {
        logger.debug('CaltransRoadService: fetching cameras', { filterRoute });
        const url = new URL('/api/v1/roads/cameras', window.location.origin);
        url.searchParams.set('region', 'tahoe');
        // Default districts logic is now in backend if not provided? 
        // Or we pass them here. Backend defaults to 3,9,10.
        // Legacy code forced 3,9,10. Let's rely on backend defaults 
        // unless explicit 'districts' arg is added to getCameras signature (it isn't in interface).

        try {
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const cameras = await res.json();
            logger.debug(`CaltransRoadService: found ${cameras.length} cameras`);
            return cameras;
        } catch (error) {
            logger.error('CaltransRoadService: Error fetching cameras', { error });
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
