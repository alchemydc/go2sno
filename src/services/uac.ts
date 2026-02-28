import { IAvalancheService } from './interfaces';
import { AvalancheForecast } from '../types/domain';
import { logger } from '../utils/logger';

export class UtahAvalancheService implements IAvalancheService {
    async getForecast(destinationId: string): Promise<AvalancheForecast | null> {
        try {
            logger.debug('UtahAvalancheService: fetching forecast', { destinationId });
            const response = await fetch(`/api/v1/avalanche?region=ut&destination=${encodeURIComponent(destinationId)}`);

            if (!response.ok) {
                logger.warn(`Failed to fetch UAC avalanche forecast: ${response.statusText}`);
                return null;
            }

            return await response.json();
        } catch (e) {
            logger.error('Error fetching UAC avalanche forecast:', e);
            return null;
        }
    }
}
