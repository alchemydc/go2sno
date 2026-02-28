import { IAvalancheService } from './interfaces';
import { AvalancheForecast } from '../types/domain';
import { logger } from '../utils/logger';

export class SierraAvalancheService implements IAvalancheService {
    async getForecast(destinationId: string): Promise<AvalancheForecast | null> {
        try {
            logger.debug('SierraAvalancheService: fetching forecast', { destinationId });
            const response = await fetch(`/api/v1/avalanche?region=tahoe&destination=${encodeURIComponent(destinationId)}`);

            if (!response.ok) {
                logger.warn(`Failed to fetch SAC avalanche forecast: ${response.statusText}`);
                return null;
            }

            return await response.json();
        } catch (e) {
            logger.error('Error fetching SAC avalanche forecast:', e);
            return null;
        }
    }
}
