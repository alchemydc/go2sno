import { NextResponse } from 'next/server';
import { CaicClient } from '../../../../services/caic/client';
import { logger } from '../../../../utils/logger';

// Reusing shared map from legacy route or moving to config?
// For now, copying map to keep route isolated and self-contained until full config refactor.
const CO_DESTINATION_TO_ZONE: Record<string, string> = {
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
    'low': 1, 'moderate': 2, 'considerable': 3, 'high': 4, 'extreme': 5, 'no rating': 0
};

const caicClient = new CaicClient();

async function getCoForecast(dest: string) {
    const destKey = dest.toLowerCase().replace(/\s+/g, '');
    const zoneSlug = CO_DESTINATION_TO_ZONE[destKey] || 'vail-and-summit-county';
    const today = new Date().toISOString();

    const forecast = await caicClient.getForecastByZoneSlug(zoneSlug, today);
    if (!forecast) return null;

    // Map to normalized response
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

    const zoneName = zoneSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/And/g, '&');

    return {
        zoneId: forecast.areaId, // or zoneSlug
        zoneName: zoneName,
        dangerRating: maxRating,
        dangerRatingDisplay: maxRatingDesc,
        summary: forecast.avalancheSummary?.days?.[0]?.content || 'No summary available.',
        issueDate: forecast.issueDateTime,
        url: `https://avalanche.state.co.us/forecasts/backcountry-avalanche/${zoneSlug}`,
        provider: 'caic'
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const destination = searchParams.get('destination');

    if (!destination) {
        return NextResponse.json({ error: 'Destination required' }, { status: 400 });
    }

    try {
        let result = null;
        if (region === 'co' || !region) { // Default to CO for backward compat logic
            result = await getCoForecast(destination);
        } else {
            // UT/Tahoe stubs
            // TODO: Integrate UAC / SAC
            result = {
                zoneName: 'Unknown Zone',
                dangerRating: 0,
                dangerRatingDisplay: 'No Data',
                summary: 'Avalanche data not yet available for this region.',
                provider: 'stub'
            };
        }

        if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(result);
    } catch (error) {
        logger.error('Error in v1/avalanche', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
