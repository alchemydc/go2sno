
import { NextResponse } from 'next/server';
import { parseVailStatus } from '@/lib/scrapers/vail-resorts';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic'; // Disable static optimization for this route

export async function GET() {
    const RESORT_URL = 'https://www.parkcitymountain.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx';

    logger.info('API: Fetching Park City status', { url: RESORT_URL });

    try {
        const response = await fetch(RESORT_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            logger.error('API: Failed to fetch upstream', { status: response.status });
            return NextResponse.json({ error: 'Failed to fetch resort data' }, { status: 502 });
        }

        const html = await response.text();
        logger.debug('API: Received HTML', { length: html.length });

        const PARK_CITY_PARKS = [
            "Little Kings",
            "Pick Axe",
            "Transitions Terrain Park",
            "3 Kings",
            "Half Pipe",
            "Mini Pipe",
            "Pick 'N Shovel"
        ];

        const result = parseVailStatus(html, { parkNames: PARK_CITY_PARKS });
        const lifts = result.lifts;

        // Park City website counts 'Scheduled' (3) as 'Open' in their summary stats
        const openCount = Object.values(lifts).filter(s => s === 'open' || s === 'scheduled').length;
        const totalCount = Object.keys(lifts).length;

        logger.info('API: Park City Status parsed', { open: openCount, total: totalCount });

        return NextResponse.json({
            resort: 'Park City',
            timestamp: new Date().toISOString(),
            lifts: lifts,
            summary: {
                open: openCount,
                total: totalCount,
                percentOpen: totalCount > 0 ? Math.round((openCount / totalCount) * 100) : 0,
                parks: result.parks
            },
            debug: result.debug // return debug info to client for troubleshooting
        });

    } catch (error) {
        logger.error('API: Internal Error', { error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
