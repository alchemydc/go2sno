import { logger } from '../utils/logger';
import { IAvalancheService } from './interfaces';
import { AvalancheForecast } from '../types/domain';

export class ColoradoAvalancheService implements IAvalancheService {
    async getForecast(destinationId: string): Promise<AvalancheForecast | null> {
        // The destinationId here might be a resort ID (vail) or a town (frisco)
        // The API route currently handles the mapping.
        try {
            logger.debug('ColoradoAvalancheService: fetching forecast', { destinationId });
            // Defaulting region to 'co' for this specific service implementation (ColoradoAvalancheService)
            const response = await fetch(`/api/v1/avalanche?region=co&destination=${encodeURIComponent(destinationId)}`);

            if (!response.ok) {
                logger.warn(`Failed to fetch avalanche forecast: ${response.statusText}`);
                return null;
            }

            return await response.json();
        } catch (e) {
            logger.error('Error fetching avalanche forecast:', e);
            return null;
        }
    }
}

// Legacy export for compatibility
export const getAvalancheForecast = async (destination: string) =>
    new ColoradoAvalancheService().getForecast(destination);


