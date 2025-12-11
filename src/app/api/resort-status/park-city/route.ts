import { NextResponse } from 'next/server';
import { parseVailStatus } from '@/lib/scrapers/vail-resorts';
import { logger } from '@/utils/logger';
import { scrapeUrl } from '@/lib/micrawl';

export const dynamic = 'force-dynamic'; // Disable static optimization for this route

export async function GET() {
    const RESORT_URL = 'https://www.parkcitymountain.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx';

    logger.info('API: Fetching Park City status via Micrawl', { url: RESORT_URL });

    try {
        const scrapeResult = await scrapeUrl(RESORT_URL);

        if (!scrapeResult.success || !scrapeResult.html) {
            logger.error('API: Micrawl failed', { error: scrapeResult.error, debug: scrapeResult.debug });
            return NextResponse.json({
                error: 'Failed to fetch resort data',
                details: scrapeResult.error,
                debug: scrapeResult.debug
            }, { status: 502 });
        }

        const html = scrapeResult.html;
        logger.debug('API: Received HTML from Micrawl', { length: html.length });

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
            debug: { ...result.debug, micrawl: scrapeResult.debug } // return debug info to client for troubleshooting
        });

    } catch (error) {
        logger.error('API: Internal Error', { error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
