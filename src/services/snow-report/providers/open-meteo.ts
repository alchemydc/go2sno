import { ISnowReportProvider } from '../types';
import { ResortStatus } from '../../../types/domain';
import { logger } from '../../../utils/logger';
import { fetchResortWeather } from '../../open-meteo';
import { getResorts } from '../../resorts';

export class OpenMeteoProvider implements ISnowReportProvider {
    name = 'open-meteo';

    async getStatus(resortId: string): Promise<ResortStatus | null> {
        // We need lat/lon for the resort. 
        // Ideally ResortStatusManager passes context, but for now we look it up.
        // This is inefficient (fetches all resorts to find one), but acceptable for MVP refactor.
        // Optimization: Cache resort locations map.

        try {
            // Find resort in static list (checking all regions or just knowing it)
            // A better approach: The Manager should probably provide the Resort entity or coords.
            // For now, let's use the static list from resorts.ts.
            const allResorts = await getResorts('co'); // Default to CO for lookup or fetch all?
            // Actually getResorts filters by region. We need a global lookup.
            // Let's rely on the definition in regions config or similar? 
            // The `RESORT_LOCATIONS` in `src/services/resorts.ts` is not exported directly.

            // Allow checking other regions if not found in CO
            let resort = allResorts.find(r => r.id === resortId);
            if (!resort) {
                const tahoe = await getResorts('tahoe');
                resort = tahoe.find(r => r.id === resortId);
            }
            if (!resort) {
                const utah = await getResorts('ut');
                resort = utah.find(r => r.id === resortId);
            }

            if (!resort) {
                logger.warn('OpenMeteoProvider: Resort location not found', { resortId });
                return null;
            }

            const weatherData = await fetchResortWeather([{ lat: resort.lat, lon: resort.lon }]);
            const localWeather = weatherData[0];

            if (!localWeather) return null;

            return {
                resortId,
                timestamp: new Date().toISOString(),
                summary: {
                    openLifts: 0,
                    totalLifts: resort.totalLifts,
                    percentOpen: 0,
                    openParks: 0,
                    totalParks: 0
                },
                lifts: {},
                weather: {
                    tempCurrent: localWeather.current.temperature_2m,
                    snow24h: localWeather.daily.snowfall_sum[0] || 0,
                    weatherDesc: 'Partly Cloudy' // Placeholder or derived from code
                },
                source: 'open-meteo-fallback'
            };
        } catch (error) {
            logger.error('OpenMeteoProvider: Failed to fetch', { resortId, error });
            return null;
        }
    }
}
