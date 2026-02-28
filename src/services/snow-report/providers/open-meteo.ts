import { ISnowReportProvider } from '../types';
import { ResortStatus } from '../../../types/domain';
import { logger } from '../../../utils/logger';
import { fetchResortWeather, getWeatherDescription } from '../../open-meteo';
import { RESORT_LOCATION_MAP } from '../../resorts';

export class OpenMeteoProvider implements ISnowReportProvider {
    name = 'open-meteo';

    async getStatus(resortId: string): Promise<ResortStatus | null> {
        try {
            // Direct lookup from static map - no need to call getResorts()
            const resort = RESORT_LOCATION_MAP.get(resortId);

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
                    calculatedSnow24h: localWeather.daily.snowfall_sum[0] || 0,
                    weatherDesc: getWeatherDescription(localWeather.current.weather_code)
                },
                source: 'open-meteo-fallback'
            };
        } catch (error) {
            logger.error('OpenMeteoProvider: Failed to fetch', { resortId, error });
            return null;
        }
    }
}
