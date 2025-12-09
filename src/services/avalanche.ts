import { logger } from '../utils/logger';

export interface AvalancheForecast {
    zoneId: string;
    zoneName: string;
    dangerRating: number; // 1-5
    dangerRatingDescription: string; // Low, Moderate, Considerable, High, Extreme
    summary: string;
    issueDate: string;
    url: string;
}

export const getAvalancheForecast = async (destination: string): Promise<AvalancheForecast | null> => {
    try {
        const response = await fetch(`/api/avalanche?destination=${encodeURIComponent(destination)}`);

        if (!response.ok) {
            logger.warn(`Failed to fetch avalanche forecast: ${response.statusText}`);
            return null;
        }

        return await response.json();
    } catch (e) {
        logger.error('Error fetching avalanche forecast:', e);
        return null;
    }
};

