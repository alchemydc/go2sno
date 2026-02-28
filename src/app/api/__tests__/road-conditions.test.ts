import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../v1/roads/conditions/route';
import { NextResponse } from 'next/server';

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data: any, init: any) => ({
            json: async () => data,
            status: init?.status || 200,
            ok: init?.status ? init.status < 400 : true
        }))
    }
}));

describe('/api/v1/roads/conditions', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.COTRIP_API_KEY = 'test-api-key';
    });

    it('should return empty array if API key is not configured for CO', async () => {
        delete process.env.COTRIP_API_KEY;

        const request = new Request('http://localhost/api/v1/roads/conditions?region=co');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith([]);
    });

    it('should fetch and return normalized road conditions data', async () => {
        const mockRawData = {
            features: [
                {
                    id: '1',
                    type: 'Feature',
                    properties: {
                        routeName: 'I-70',
                        primaryLatitude: 39.5,
                        primaryLongitude: -105.5,
                        currentConditions: [{ conditionDescription: 'Icy' }]
                    }
                }
            ]
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockRawData
        });

        const request = new Request('http://localhost/api/v1/roads/conditions?region=co');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith([{
            id: '1',
            type: 'RoadCondition',
            location: { lat: 39.5, lon: -105.5 },
            routeName: 'I-70',
            status: 'Icy',
            description: 'Icy',
            regionId: 'co',
            provider: 'cdot'
        }]);
    });

    it('should return empty array on COtrip API error', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Service Unavailable'
        });

        const request = new Request('http://localhost/api/v1/roads/conditions?region=co');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith([]);
    });

    it('should return empty array on network error', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const request = new Request('http://localhost/api/v1/roads/conditions?region=co');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith([]);
    });
});
