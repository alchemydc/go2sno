import { ISnowReportProvider } from '../types';
import { ResortStatus } from '../../../types/domain';
import { logger } from '../../../utils/logger';
import { epicMixClient } from '../../epic-mix/client';
import { EPIC_RESORT_MAP } from '../../../config/epic-resorts';

export class EpicMixProvider implements ISnowReportProvider {
    name = 'epic-mix';

    async getStatus(resortId: string): Promise<ResortStatus | null> {
        const config = EPIC_RESORT_MAP[resortId];
        if (!config) return null;

        logger.debug('EpicMixProvider: fetching status', { resortId, epicId: config.epicId });

        try {
            // Fetch Status only (weather handled separately or merged later)
            const statusData = await epicMixClient.getResortStatus(config.epicId);

            // Normalize Lifts
            const lifts: ResortStatus['lifts'] = {};
            let openLiftsCount = 0;
            const totalLiftsCount = statusData.lifts.length;

            statusData.lifts.forEach(lift => {
                const name = lift.name.trim();
                let status: 'open' | 'closed' | 'hold' | 'scheduled' = 'closed';

                switch (lift.openingStatus) {
                    case "OPEN": status = 'open'; break;
                    case "ON_HOLD": status = 'hold'; break;
                    case "SCHEDULED": status = 'scheduled'; break;
                    default: status = 'closed'; break;
                }

                lifts[name] = status;
                if (status === 'open' || status === 'scheduled') {
                    openLiftsCount++;
                }
            });

            // Normalize Parks
            let openParksCount = 0;
            let totalParksCount = 0;

            // Filter park names if config has specific list
            const hasParkFilter = config.parkNames.length > 0;
            const knownParks = new Set(config.parkNames);

            statusData.terrainParks.forEach(park => {
                const name = park.name.trim();
                if (!hasParkFilter || knownParks.has(name)) {
                    if (park.openingStatus === 'OPEN') openParksCount++;
                    totalParksCount++;
                }
            });

            return {
                resortId,
                timestamp: new Date().toISOString(),
                summary: {
                    openLifts: openLiftsCount,
                    totalLifts: totalLiftsCount,
                    percentOpen: totalLiftsCount > 0 ? Math.round((openLiftsCount / totalLiftsCount) * 100) : 0,
                    openParks: openParksCount,
                    totalParks: totalParksCount
                },
                lifts,
                weather: {
                    tempCurrent: 0, // Filled by Weather Provider
                    snow24h: 0 // Filled by Weather or separate call
                },
                source: 'epic-mix'
            };

        } catch (error) {
            logger.error('EpicMixProvider: Failed to fetch', { resortId, error });
            return null;
        }
    }
}
