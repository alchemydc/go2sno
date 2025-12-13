import { ISnowReportProvider } from '../types';
import { ResortStatus } from '../../../types/domain';
import { logger } from '../../../utils/logger';

export class IkonApiProvider implements ISnowReportProvider {
    name = 'ikon-api';

    async getStatus(resortId: string): Promise<ResortStatus | null> {
        // Stub: In the future, check if resortId is an Ikon resort and fetch from API
        logger.debug('IkonApiProvider: checking status (stub)', { resortId });
        return null;
    }
}
