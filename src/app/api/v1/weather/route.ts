import { NextResponse } from 'next/server';
import { logger } from '../../../../utils/logger';

// Logic ported from src/services/weather.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Missing lat/lon' }, { status: 400 });
    }

    try {
        // NWS API requires User-Agent
        const headers = { 'User-Agent': 'go2sno/1.0 (contact@go2sno.com)' };

        // 1. Get grid points
        const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers });
        if (!pointsRes.ok) throw new Error(`Points API: ${pointsRes.statusText}`);
        const pointsData = await pointsRes.json();
        const forecastUrl = pointsData.properties.forecast;

        // 2. Get forecast
        const forecastRes = await fetch(forecastUrl, { headers });
        if (!forecastRes.ok) throw new Error(`Forecast API: ${forecastRes.statusText}`);
        const forecastData = await forecastRes.json();
        const current = forecastData.properties.periods[0];

        return NextResponse.json({
            temperature: current.temperature,
            shortForecast: current.shortForecast,
            windSpeed: current.windSpeed,
            icon: current.icon,
        });
    } catch (error) {
        logger.error('Error in v1/weather:', error);
        return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
    }
}
