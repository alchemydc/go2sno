import { NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

export async function GET(request: Request) {
    const apiKey = process.env.COTRIP_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'COTRIP_API_KEY is not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';

    try {
        const res = await fetch(`https://data.cotrip.org/api/v1/incidents?apiKey=${apiKey}&limit=${limit}`);

        if (!res.ok) {
            throw new Error(`COtrip API error: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        logger.error('Error fetching incidents:', error);
        return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
    }
}
