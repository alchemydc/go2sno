import { ISnowReportProvider } from '../types';
import { ResortStatus } from '../../../types/domain';
import { logger } from '../../../utils/logger';
import { scrapeUrl } from '../../../lib/micrawl';
import { parseVailStatus } from '../../../lib/scrapers/vail-resorts';
import { EPIC_RESORT_MAP } from '../../../config/epic-resorts';

// Configuration for scraper fallbacks
const SCRAPER_CONFIG: Record<string, string> = {
    'parkcity': 'https://www.parkcitymountain.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx'
    // Add others if needed
};

export class MicrawlProvider implements ISnowReportProvider {
    name = 'micrawl';

    async getStatus(resortId: string): Promise<ResortStatus | null> {
        const url = SCRAPER_CONFIG[resortId];
        if (!url) return null; // No scraper config for this resort

        logger.debug('MicrawlProvider: fetching status via scraper', { resortId, url });

        try {
            const scrapeResult = await scrapeUrl(url);

            if (!scrapeResult.success || !scrapeResult.html) {
                logger.warn('MicrawlProvider: Scrape failed', { error: scrapeResult.error });
                return null;
            }

            // For now, we assume it's a Vail resort if in this config list using parseVailStatus
            // If we support non-vail scrapers, we'd need a strategy selector here.

            const epicConfig = EPIC_RESORT_MAP[resortId];
            const parkNames = epicConfig ? epicConfig.parkNames : [];

            const { lifts, parks } = parseVailStatus(scrapeResult.html, { parkNames });

            // Calculate summaries
            const liftValues = Object.values(lifts);
            const openLiftsCount = liftValues.filter(s => s === 'open' || s === 'scheduled').length; // Scheduled counts as open for summary match
            const totalLiftsCount = liftValues.length;

            return {
                resortId,
                timestamp: new Date().toISOString(),
                summary: {
                    openLifts: openLiftsCount,
                    totalLifts: totalLiftsCount,
                    percentOpen: totalLiftsCount > 0 ? Math.round((openLiftsCount / totalLiftsCount) * 100) : 0,
                    openParks: parks.open,
                    totalParks: parks.total
                },
                lifts,
                weather: { tempCurrent: 0, snow24h: 0 }, // Filled by Manager via Weather Provider
                source: 'micrawl'
            };

        } catch (error) {
            logger.error('MicrawlProvider: Error during scrape', { resortId, error });
            return null;
        }
    }
}
