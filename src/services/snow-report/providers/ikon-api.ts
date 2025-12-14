
import { ISnowReportProvider } from '../types';
import { ResortStatus } from '../../../types/domain';
import { logger } from '../../../utils/logger';
import { ikonClient } from '../../ikon/client';
import { IKON_RESORT_MAP } from '../../../config/ikon-resorts';

export class IkonApiProvider implements ISnowReportProvider {
    name = 'ikon-api';

    async getStatus(resortId: string): Promise<ResortStatus | null> {
        const config = IKON_RESORT_MAP[resortId];
        if (!config) {
            // logger.debug('IkonApiProvider: Resort not configured for Ikon', { resortId });
            return null;
        }

        logger.debug('IkonApiProvider: Fetching status', { resortId, ikonId: config.ikonId });

        try {
            const data = await ikonClient.getResortStatus(config.ikonId);

            // Normalize Lifts
            const lifts: ResortStatus['lifts'] = {};
            let openLiftsCount = 0;
            const totalLiftsCount = data.lifts.length;

            data.lifts.forEach(lift => {
                const name = lift.Name.trim();
                const rawStatus = lift.Status;
                let status: 'open' | 'closed' | 'hold' | 'scheduled' = 'closed';

                // Ikon statuses: "Open", "Closed", "Scheduled", "Hold", "Wind Hold", "Weather Hold"
                if (rawStatus === 'Open') {
                    status = 'open';
                } else if (rawStatus === 'Scheduled') {
                    status = 'scheduled';
                } else if (rawStatus.includes('Hold')) {
                    status = 'hold';
                } else {
                    status = 'closed';
                }

                lifts[name] = status;
                if (status === 'open' || status === 'scheduled') {
                    openLiftsCount++;
                }
            });

            // Normalize Parks
            // Ikon returns parks as trails with TrailIcon="Park"
            let openParksCount = 0;
            const totalParksCount = data.terrainParks.length;
            const parkDetails: Record<string, string> = {};

            data.terrainParks.forEach(park => {
                const name = park.Name;
                const isOpen = park.Status === 'Open';

                if (isOpen) {
                    openParksCount++;
                }
                parkDetails[name] = isOpen ? 'open' : 'closed';
            });

            if (totalLiftsCount === 0) {
                logger.warn('IkonApiProvider: No detailed lift data found, attempting aggregate summary fallback', { resortId });

                const summaryData = await ikonClient.getResortSummary(config.ikonId);
                if (summaryData) {
                    logger.info('IkonApiProvider: Found aggregate summary data', { resortId });
                    return {
                        resortId,
                        timestamp: new Date().toISOString(),
                        summary: {
                            openLifts: summaryData.TotalOpenLifts || 0,
                            totalLifts: summaryData.TotalLifts || 0,
                            percentOpen: summaryData.TotalLifts > 0 ? Math.round((summaryData.TotalOpenLifts / summaryData.TotalLifts) * 100) : 0,
                            openParks: 0, // Not available in summary feed
                            totalParks: 0,
                            details: {}
                        },
                        lifts: {}, // No detailed list available
                        weather: {
                            tempCurrent: 0,
                            snow24h: 0
                        },
                        source: 'ikon-api-summary'
                    };
                }

                logger.warn('IkonApiProvider: No summary data found either, returning null', { resortId });
                return null;
            }

            logger.debug('IkonApiProvider: Normalization complete', {
                resortId,
                openLifts: openLiftsCount,
                openParks: openParksCount
            });

            return {
                resortId,
                timestamp: new Date().toISOString(),
                summary: {
                    openLifts: openLiftsCount,
                    totalLifts: totalLiftsCount,
                    percentOpen: totalLiftsCount > 0 ? Math.round((openLiftsCount / totalLiftsCount) * 100) : 0,
                    openParks: openParksCount,
                    totalParks: totalParksCount,
                    details: parkDetails
                },
                lifts,
                weather: {
                    tempCurrent: 0, // Filled by Weather Provider
                    snow24h: 0 // Filled by Weather or separate call
                },
                source: 'ikon-api'
            };

        } catch (error) {
            logger.error('IkonApiProvider: Failed to fetch status', { resortId, error });
            return null;
        }
    }
}
