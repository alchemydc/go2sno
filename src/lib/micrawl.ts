import { unstable_cache } from 'next/cache';
import { logger } from '@/utils/logger';

export interface ScrapeResult {
  success: boolean;
  html?: string;
  error?: string;
  debug?: any;
}

const MICRAWL_API_URL = process.env.MICRAWL_API_URL || 'https://my.micrawl.org/scrape';

// Internal scraping function that performs the actual fetch
async function _scrapeUrl(url: string): Promise<ScrapeResult> {
  const startTime = Date.now();
  logger.info('Micrawl: Starting scrape', { url });

  try {
    const response = await fetch(MICRAWL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        outputFormats: ['html'],
        captureTextOnly: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      logger.error('Micrawl: API error', { status, url });
      return { success: false, error: `Micrawl API returned ${status}` };
    }

    // Micrawl returns NDJSON (Newline Delimited JSON).
    // We expect a "success" status line with data.
    const text = await response.text();
    const lines = text.trim().split('\n');

    let htmlContent: string | undefined;
    let jobData: any;

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.status === 'success' && json.data && json.data.page) {
          // Found the success payload
          const contents = json.data.page.contents;
          if (Array.isArray(contents)) {
            const htmlPart = contents.find((c: any) => c.format === 'html');
            if (htmlPart) {
              htmlContent = htmlPart.body;
            }
          }
          jobData = json;
        }
      } catch (e) {
        // Ignore parse errors for intermediate lines
      }
    }

    const duration = Date.now() - startTime;

    if (htmlContent) {
      logger.info('Micrawl: Scrape successful', { url, duration, htmlLength: htmlContent.length });
      return {
        success: true,
        html: htmlContent,
        debug: {
          micrawlJobId: jobData?.jobId,
          duration,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      logger.warn('Micrawl: No HTML content found in response', { url, duration });
      return { success: false, error: 'No HTML content found in Micrawl response' };
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Micrawl: Exception during scrape', { url, error, duration });
    return { success: false, error: String(error) };
  }
}

// Export a cached version of the scraper
// We include the URL in the cache key parts.
// Revalidate set to 300 seconds (5 minutes).
export const scrapeUrl = unstable_cache(
  async (url: string) => _scrapeUrl(url),
  ['micrawl-scrape-v1'], // Cache key prefix
  {
    revalidate: 300,
    tags: ['resort-status']
  }
);
