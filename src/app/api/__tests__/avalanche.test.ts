import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../avalanche/route';
import { NextResponse } from 'next/server';

// Mock the entire caic module before importing
const mockGetForecastByZoneSlug = vi.fn();

vi.mock('../../../services/caic/client', () => ({
    CaicClient: class {
        getForecastByZoneSlug(...args: any[]) {
            return mockGetForecastByZoneSlug(...args);
        }
    }
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, init) => ({
            json: async () => data,
            status: init?.status || 200,
            ok: init?.status ? init.status < 400 : true
        }))
    }
}));

describe('/api/avalanche', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should return 400 if destination is missing', async () => {
        const request = new Request('http://localhost/api/avalanche');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Destination is required' },
            { status: 400 }
        );
    });

    it('should return forecast data for valid destination', async () => {
        const mockForecast = {
            type: 'avalancheforecast',
            areaId: 'test-area-id',
            issueDateTime: '2025-12-05T10:00:00Z',
            dangerRatings: {
                days: [{
                    alp: 'Considerable',
                    tln: 'Moderate',
                    btl: 'Low'
                }]
            },
            avalancheSummary: {
                days: [{
                    content: 'Test avalanche summary'
                }]
            }
        };

        mockGetForecastByZoneSlug.mockResolvedValue(mockForecast);

        const request = new Request('http://localhost/api/avalanche?destination=frisco');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                zoneId: 'test-area-id',
                zoneName: expect.any(String),
                dangerRating: 3, // Considerable
                dangerRatingDescription: 'Considerable',
                summary: 'Test avalanche summary',
                issueDate: '2025-12-05T10:00:00Z',
                url: expect.stringContaining('avalanche.state.co.us')
            })
        );
    });

    it('should return 404 if no forecast is found', async () => {
        mockGetForecastByZoneSlug.mockResolvedValue(null);

        const request = new Request('http://localhost/api/avalanche?destination=frisco');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringContaining('No forecast found') }),
            { status: 404 }
        );
    });

    it('should return 500 on CAIC API error', async () => {
        mockGetForecastByZoneSlug.mockRejectedValue(new Error('API error'));

        const request = new Request('http://localhost/api/avalanche?destination=frisco');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'Failed to fetch forecast' }),
            { status: 500 }
        );
    });

    it('should map destination to correct zone slug', async () => {
        mockGetForecastByZoneSlug.mockResolvedValue({
            type: 'avalancheforecast',
            areaId: 'test',
            issueDateTime: '2025-12-05',
            dangerRatings: { days: [{ alp: 'Low', tln: 'Low', btl: 'Low' }] },
            avalancheSummary: { days: [{ content: 'Test' }] }
        });

        const request = new Request('http://localhost/api/avalanche?destination=aspen');
        await GET(request);

        expect(mockGetForecastByZoneSlug).toHaveBeenCalledWith('aspen', expect.any(String));
    });
});
