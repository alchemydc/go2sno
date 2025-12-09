import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return NextResponse.json({ error: `Failed to fetch external URL: ${res.status}` }, { status: res.status });
        }

        const contentType = res.headers.get('content-type') || 'application/xml';
        const data = await res.text();

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 's-maxage=60, stale-while-revalidate'
            }
        });
    } catch (error) {
        logger.error('Proxy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
