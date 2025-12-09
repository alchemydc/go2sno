import { NextResponse } from 'next/server';
import { CaicClient } from '../../../services/caic/client';
import { AvalancheForecast as CaicAvalancheForecast } from '../../../services/caic/types';
import { logger } from '../../../utils/logger';

// Mapping of destinations to CAIC zone slugs
const DESTINATION_TO_ZONE_SLUG: Record<string, string> = {
    boulder: 'front-range',
    denver: 'front-range',
    winterpark: 'front-range',
    eldora: 'front-range',

    frisco: 'vail-and-summit-county',
    breck: 'vail-and-summit-county',
    keystone: 'vail-and-summit-county',
    copper: 'vail-and-summit-county',
    vail: 'vail-and-summit-county',
    beavercreek: 'vail-and-summit-county',
    arapahoebasin: 'vail-and-summit-county',

    leadville: 'sawatch',
    monarch: 'sawatch',
    skicooper: 'sawatch',
    aspen: 'aspen',
    crestedbutte: 'gunnison',
    telluride: 'northern-san-juan',
    silverton: 'northern-san-juan',
    wolfcreek: 'southern-san-juan',
    steamboat: 'steamboat-and-flat-tops',
};

const RATING_MAP: Record<string, number> = {
    'low': 1,
    'moderate': 2,
    'considerable': 3,
    'high': 4,
    'extreme': 5,
    'no rating': 0
};

// Initialize client outside handler to reuse if possible (though Next.js creates new instances usually)
const client = new CaicClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination');

    if (!destination) {
        return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    // Normalize destination
    const destKey = destination.toLowerCase().replace(/\s+/g, '');

    // Find zone slug
    const zoneSlug = DESTINATION_TO_ZONE_SLUG[destKey] || 'vail-and-summit-county';
    const today = new Date().toISOString();

    try {
        const forecast = await client.getForecastByZoneSlug(zoneSlug, today);

        if (!forecast) {
            return NextResponse.json({
                error: `No forecast found for zone: ${zoneSlug}`
            }, { status: 404 });
        }

        // Extract danger rating
        const todayRatings = forecast.dangerRatings?.days?.[0];
        let maxRating = 0;
        let maxRatingDesc = 'No Rating';

        if (todayRatings) {
            const ratings = [todayRatings.alp, todayRatings.tln, todayRatings.btl];
            ratings.forEach(r => {
                const val = RATING_MAP[r.toLowerCase()] || 0;
                if (val > maxRating) {
                    maxRating = val;
                    maxRatingDesc = r;
                }
            });
        }

        // Extract summary
        const summary = forecast.avalancheSummary?.days?.[0]?.content || 'No summary available.';

        // Format zone name for display (convert slug to title case)
        const zoneName = zoneSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/And/g, '&');

        const result = {
            zoneId: forecast.areaId,
            zoneName: zoneName,
            dangerRating: maxRating,
            dangerRatingDescription: maxRatingDesc,
            summary: summary,
            issueDate: forecast.issueDateTime,
            url: `https://avalanche.state.co.us/forecasts/backcountry-avalanche/${zoneSlug}`
        };

        return NextResponse.json(result);

    } catch (e: any) {
        logger.error('Failed to fetch CAIC forecast:', e);
        return NextResponse.json({ error: 'Failed to fetch forecast', details: e.message, stack: e.stack }, { status: 500 });
    }
}
