import { ResortStatus } from '../../types/domain';

export interface ISnowReportProvider {
    /**
     * Unique identifier for the provider (e.g., 'epic-mix', 'ikon', 'open-meteo')
     */
    name: string;

    /**
     * Fetch status for a given resort.
     * Returns null if the provider does not support this resort or fails.
     */
    getStatus(resortId: string): Promise<ResortStatus | null>;
}

export interface ISnowReportManager {
    getResortStatus(resortId: string): Promise<ResortStatus>;
}
