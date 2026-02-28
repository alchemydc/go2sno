import { NextResponse } from 'next/server';
import { logger } from '../../../../utils/logger';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
        return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 });
    }

    const apiKey = process.env.TOMTOM_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        // Redact key in logs
        const redactedUrl = `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=***&traffic=true`;
        logger.debug('Fetching route from TomTom:', { url: redactedUrl });

        const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=${apiKey}&traffic=true`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('TomTom API error response:', { status: response.status, body: errorText });
            return NextResponse.json({
                error: `TomTom API error: ${response.status}`,
                details: errorText
            }, { status: response.status });
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const summary = route.summary;
            const points = route.legs[0].points;
            const coordinates = points.map((point: any) => [point.longitude, point.latitude]);

            return NextResponse.json({
                travelTimeInSeconds: summary.travelTimeInSeconds,
                trafficDelayInSeconds: summary.trafficDelayInSeconds,
                lengthInMeters: summary.lengthInMeters,
                coordinates: coordinates
            });
        } else {
            logger.warn('TomTom returned no routes for:', { origin, destination });
            return NextResponse.json({ error: 'No route found' }, { status: 404 });
        }
    } catch (error) {
        logger.error('Route API handler exception:', error);
        return NextResponse.json({ error: 'Failed to fetch route data' }, { status: 500 });
    }
}
