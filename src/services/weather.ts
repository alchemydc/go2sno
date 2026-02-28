import { logger } from '../utils/logger';

export interface WeatherForecast {
    temperature: number;
    shortForecast: string;
    windSpeed: string;
    icon: string;
}

export const getWeather = async (lat: number, lon: number): Promise<WeatherForecast> => {
    try {
        const res = await fetch(`/api/v1/weather?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error('Failed to fetch weather');
        return await res.json();
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

