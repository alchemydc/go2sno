import { ISnowReportManager, ISnowReportProvider } from './types';
import { ResortStatus } from '../../types/domain';
import { logger } from '../../utils/logger';
import { EpicMixProvider } from './providers/epic-mix';
import { IkonApiProvider } from './providers/ikon-api';
import { OpenMeteoProvider } from './providers/open-meteo';
import { MicrawlProvider } from './providers/micrawl';

export class ResortStatusManager implements ISnowReportManager {
    private providers: ISnowReportProvider[];
    private weatherProvider: ISnowReportProvider;

    constructor() {
        this.providers = [
            new EpicMixProvider(),
            new IkonApiProvider(),
            new MicrawlProvider()
        ];
        this.weatherProvider = new OpenMeteoProvider();
    }

    async getResortStatus(resortId: string): Promise<ResortStatus> {
        logger.debug('ResortStatusManager: fetching status', { resortId });

        // 1. Try Primary Providers (Epic, Ikon, etc.)
        let primaryStatus: ResortStatus | null = null;

        for (const provider of this.providers) {
            try {
                const status = await provider.getStatus(resortId);
                if (status) {
                    primaryStatus = status;
                    logger.debug(`ResortStatusManager: Found status from ${provider.name}`, { resortId });
                    break;
                }
            } catch (err) {
                logger.warn(`ResortStatusManager: Provider ${provider.name} failed`, { resortId, error: err });
            }
        }

        // 2. Fetch Weather (Always, to augment or fallback)
        const weatherStatus = await this.weatherProvider.getStatus(resortId);

        // 3. Merge/Reconcile
        if (primaryStatus) {
            // Augment primary with weather if primary lacks it or we want "actual" vs "reported"
            // For MVP, we'll overwite weather with Meteo if available, or keep provider's if Meteo fails
            if (weatherStatus?.weather) {
                primaryStatus.weather = {
                    ...primaryStatus.weather,
                    ...weatherStatus.weather
                };
            }
            return primaryStatus;
        }

        // 4. Fallback if no primary data
        if (weatherStatus) {
            logger.info('ResortStatusManager: Using weather-only fallback', { resortId });
            return weatherStatus;
        }

        // 5. Ultimate failure
        logger.error('ResortStatusManager: All providers failed', { resortId });
        return {
            resortId,
            timestamp: new Date().toISOString(),
            summary: { openLifts: 0, totalLifts: 0, percentOpen: 0, openParks: 0, totalParks: 0 },
            lifts: {},
            weather: { tempCurrent: 0, snow24h: 0 },
            source: 'none'
        };
    }
}

export const resortStatusManager = new ResortStatusManager();
