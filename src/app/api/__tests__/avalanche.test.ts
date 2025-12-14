import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../v1/avalanche/route';
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
            { error: 'Destination required' },
            { status: 400 }
        );
    });

    // ...

    it('should return 404 if no forecast is found', async () => {
        mockGetForecastByZoneSlug.mockResolvedValue(null);

        const request = new Request('http://localhost/api/avalanche?destination=frisco');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Not found' },
            { status: 404 }
        );
    });

    it('should return 500 on CAIC API error', async () => {
        mockGetForecastByZoneSlug.mockRejectedValue(new Error('API error'));

        const request = new Request('http://localhost/api/avalanche?destination=frisco');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    });

    it('should map destination to correct zone slug', async () => {
        mockGetForecastByZoneSlug.mockResolvedValue({
            type: 'avalancheforecast',
            areaId: 'test-area-id',
            zoneName: 'Test Zone',
            issueDateTime: '2025-12-05T10:00:00Z',
            dangerRatings: { days: [{ alp: 'Considerable', tln: 'Moderate', btl: 'Low' }] },
            avalancheSummary: { days: [{ content: 'Test avalanche summary' }] },
            url: 'https://avalanche.state.co.us/forecasts/backcountry-avalanche/test-area-id'
        });

        const request = new Request('http://localhost/api/avalanche?destination=aspen');
        await GET(request);

        expect(mockGetForecastByZoneSlug).toHaveBeenCalledWith('aspen', expect.any(String));
        expect(NextResponse.json).toHaveBeenCalledWith(
            {
                zoneId: 'test-area-id',
                zoneName: 'Aspen',
                dangerRating: 3, // Considerable
                dangerRatingDisplay: 'Considerable',
                summary: 'Test avalanche summary',
                issueDate: '2025-12-05T10:00:00Z',
                url: 'https://avalanche.state.co.us/forecasts/backcountry-avalanche/aspen',
                provider: 'caic'
            }
        );
    });
});
