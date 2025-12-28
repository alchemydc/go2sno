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
            // Preserve reported snow from primary provider
            const reportedSnow24h = primaryStatus.weather.reportedSnow24h;
            const calculatedSnow24h = weatherStatus?.weather?.snow24h;

            // Merge weather data
            if (weatherStatus?.weather) {
                primaryStatus.weather = {
                    ...weatherStatus.weather, // Start with Open-Meteo data
                    ...primaryStatus.weather, // Override with provider data
                    reportedSnow24h, // Explicitly preserve reported
                    calculatedSnow24h, // Explicitly set calculated from Open-Meteo
                    // Prioritize reported snow for display
                    snow24h: reportedSnow24h !== undefined ? reportedSnow24h : (calculatedSnow24h || 0)
                };
            }

            // Verbose logging for debugging
            logger.debug('ResortStatusManager: Snow data merged', {
                resortId,
                reportedSnow24h: primaryStatus.weather.reportedSnow24h,
                calculatedSnow24h: primaryStatus.weather.calculatedSnow24h,
                displaySnow24h: primaryStatus.weather.snow24h,
                source: primaryStatus.source
            });

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
