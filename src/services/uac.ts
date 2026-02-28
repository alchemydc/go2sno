import { IAvalancheService } from './interfaces';
import { AvalancheForecast } from '../types/domain';
import { logger } from '../utils/logger';

export class UtahAvalancheService implements IAvalancheService {
    async getForecast(destinationId: string): Promise<AvalancheForecast | null> {
        logger.debug('UtahAvalancheService: fetching forecast (stub)', { destinationId });
        return null;
    }
}
