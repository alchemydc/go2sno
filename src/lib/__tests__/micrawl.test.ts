import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeUrl } from '../micrawl';

// Mock unstable_cache to just return the original function
vi.mock('next/cache', () => ({
    unstable_cache: (fn: any) => fn,
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('scrapeUrl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return HTML when micrawl succeeds with valid data', async () => {
        const mockHtml = '<html><body>Success</body></html>';
        const mockResponse = {
            status: 'success',
            data: {
                page: {
                    contents: [
                        { format: 'markdown', body: 'markdown content' },
                        { format: 'html', body: mockHtml },
                    ]
                }
            }
        };

        // Micrawl returns NDJSON
        const ndjson = [
            JSON.stringify({ status: 'progress' }),
            JSON.stringify(mockResponse)
        ].join('\n');

        fetchMock.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(ndjson),
        });

        const result = await scrapeUrl('https://example.com');

        expect(result.success).toBe(true);
        expect(result.html).toBe(mockHtml);
        expect(fetchMock).toHaveBeenCalledWith('https://my.micrawl.org/scrape', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"outputFormats":["html"]'),
        }));
    });

    it('should return error when micrawl API fails', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
        });

        const result = await scrapeUrl('https://example.com');

        expect(result.success).toBe(false);
        expect(result.error).toContain('500');
    });

    it('should return error when no HTML content is found in response', async () => {
        const mockResponse = {
            status: 'success',
            data: {
                page: {
                    contents: [
                        { format: 'markdown', body: 'markdown content' }
                        // Missing HTML
                    ]
                }
            }
        };
        const ndjson = JSON.stringify(mockResponse);

        fetchMock.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(ndjson),
        });

        const result = await scrapeUrl('https://example.com');

        expect(result.success).toBe(false);
        expect(result.error).toContain('No HTML content found');
    });

    it('should handle exception during fetch', async () => {
        fetchMock.mockRejectedValue(new Error('Network error'));

        const result = await scrapeUrl('https://example.com');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
    });
});
