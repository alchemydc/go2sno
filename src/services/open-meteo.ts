import { logger } from '../utils/logger';

export interface OpenMeteoResponse {
    latitude: number;
    longitude: number;
    current: {
        time: string;
        interval: number;
        temperature_2m: number;
        wind_speed_10m: number;
        weather_code: number;
    };
    daily: {
        time: string[];
        snowfall_sum: number[]; // 24h snowfall total in inches
    };
}

// Helper to interpret WMO Weather Codes
export const getWeatherDescription = (code: number): string => {
    // Simplified WMO code map
    const codes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
        61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
        71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
        77: 'Snow grains',
        80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
        85: 'Slight Snow Showers', 86: 'Heavy Snow Showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy Thunderstorm with hail'
    };
    return codes[code] || 'Unknown';
};

export const fetchResortWeather = async (
    locations: { lat: number; lon: number }[]
): Promise<OpenMeteoResponse[]> => {
    try {
        const lats = locations.map(l => l.lat).join(',');
        const lons = locations.map(l => l.lon).join(',');

        const params = new URLSearchParams({
            latitude: lats,
            longitude: lons,
            current: 'temperature_2m,wind_speed_10m,weather_code',
            daily: 'snowfall_sum', // Get daily snowfall totals
            temperature_unit: 'fahrenheit',
            wind_speed_unit: 'mph',
            precipitation_unit: 'inch',
            timezone: 'auto',
            forecast_days: '1' // We only need today for the dashboard
        });

        const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
        
        logger.debug('Fetching weather from Open-Meteo', { url });

        const response = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins
        
        logger.debug('Open-Meteo response status:', { status: response.status, ok: response.ok });

        if (!response.ok) {
            throw new Error(`Open-Meteo API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        logger.debug('Open-Meteo response data:', { dataLength: Array.isArray(data) ? data.length : 1 });

        // Open-Meteo returns a single object if 1 location, or an array if multiple.
        // We ensure we always return an array.
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        logger.error('Error fetching resort weather:', error);
        return [];
    }
};
