import { NextResponse } from 'next/server';

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
        const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=${apiKey}&traffic=true`;
        const response = await fetch(url);
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
            return NextResponse.json({ error: 'No route found' }, { status: 404 });
        }
    } catch (error) {
        console.error('TomTom API error:', error);
        return NextResponse.json({ error: 'Failed to fetch route data' }, { status: 500 });
    }
}
