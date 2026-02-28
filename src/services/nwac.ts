import { IAvalancheService } from './interfaces';
import { AvalancheForecast } from '../types/domain';
import { logger } from '../utils/logger';

export class NorthwestAvalancheService implements IAvalancheService {
    async getForecast(destinationId: string): Promise<AvalancheForecast | null> {
        try {
            logger.debug('NorthwestAvalancheService: fetching forecast', { destinationId });
            const response = await fetch(`/api/v1/avalanche?region=pnw&destination=${encodeURIComponent(destinationId)}`);

            if (!response.ok) {
                logger.warn(`Failed to fetch PNW avalanche forecast: ${response.statusText}`);
                return null;
            }

            return await response.json();
        } catch (e) {
            logger.error('Error fetching PNW avalanche forecast:', e);
            return null;
        }
    }
}
