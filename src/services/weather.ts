import { logger } from '../utils/logger';

export interface WeatherForecast {
    temperature: number;
    shortForecast: string;
    windSpeed: string;
    icon: string;
}

export const getWeather = async (lat: number, lon: number): Promise<WeatherForecast> => {
    try {
        // 1. Get grid points
        const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
        const pointsData = await pointsRes.json();
        const forecastUrl = pointsData.properties.forecast;

        // 2. Get forecast
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();
        const current = forecastData.properties.periods[0];

        return {
            temperature: current.temperature,
            shortForecast: current.shortForecast,
            windSpeed: current.windSpeed,
            icon: current.icon,
        };
    } catch (error) {
        logger.error('Error fetching weather:', error);
        return {
            temperature: NaN,
            shortForecast: 'Unavailable',
            windSpeed: 'N/A',
            icon: '',
        };
    }
};

