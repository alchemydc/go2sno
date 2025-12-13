import { ResortStatus, Camera, Incident, RoadCondition, AvalancheForecast } from '../types/domain';

export interface IRoadService {
    /**
     * Get active incidents (accidents, closures, etc.)
     */
    getIncidents(): Promise<Incident[]>;

    /**
     * Get general road conditions (icy, snow packed, etc.)
     */
    getConditions(): Promise<RoadCondition[]>;

    /**
     * Get traffic cameras for the region. 
     * @param filterRoute Optional route ID/Name to filter by
     */
    getCameras(filterRoute?: string): Promise<Camera[]>;
}

export interface IAvalancheService {
    /**
     * Get avalanche forecast for a specific destination/geolocation
     * @param destinationId User-selected destination (e.g., 'vail', 'parkcity') or lat/lon string
     */
    getForecast(destinationId: string): Promise<AvalancheForecast | null>;
}

export interface IResortStatusService {
    /**
     * Get unified status for a resort.
     * Implementations should handle fallback logic (API -> Scraper -> Weather).
     */
    getStatus(resortId: string): Promise<ResortStatus>;
}
