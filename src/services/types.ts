export interface RoadConditionService {
    getIncidents(): Promise<any[]>;
    getRoadConditions(): Promise<any[]>;
}

export interface AvalancheService {
    getAvalancheForecast(destination: string): Promise<any | null>;
}
