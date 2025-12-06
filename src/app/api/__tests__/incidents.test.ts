import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../incidents/route';
import { NextResponse } from 'next/server';

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, init) => ({
            json: async () => data,
            status: init?.status || 200,
            ok: init?.status ? init.status < 400 : true
        }))
    }
}));

describe('/api/incidents', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.COTRIP_API_KEY = 'test-api-key';
    });

    it('should return 500 if API key is not configured', async () => {
        delete process.env.COTRIP_API_KEY;

        const request = new Request('http://localhost/api/incidents');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'COTRIP_API_KEY is not configured' },
            { status: 500 }
        );
    });

    it('should fetch and return incidents data', async () => {
        const mockData = {
            features: [
                {
                    id: '1',
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [-105, 39] },
                    properties: { type: 'Accident' }
                }
            ]
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const request = new Request('http://localhost/api/incidents');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(mockData);
    });

    it('should use custom limit parameter', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ features: [] })
        });

        const request = new Request('http://localhost/api/incidents?limit=50');

        await GET(request);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('limit=50')
        );
    });

    it('should return 500 on COtrip API error', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Bad Request'
        });

        const request = new Request('http://localhost/api/incidents');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Failed to fetch incidents' },
            { status: 500 }
        );
    });

    it('should return 500 on network error', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const request = new Request('http://localhost/api/incidents');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Failed to fetch incidents' },
            { status: 500 }
        );
    });
});
