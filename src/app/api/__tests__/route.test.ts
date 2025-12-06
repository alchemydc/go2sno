import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route/route';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, init) => ({
            json: async () => data,
            status: init?.status || 200,
            ok: init?.status ? init.status < 400 : true
        }))
    }
}));

describe('/api/route', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.TOMTOM_API_KEY = 'test-api-key';
    });

    it('should return 400 if origin is missing', async () => {
        const request = new Request('http://localhost/api/route?destination=39.5,-106.0');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Missing origin or destination' },
            { status: 400 }
        );
    });

    it('should return 400 if destination is missing', async () => {
        const request = new Request('http://localhost/api/route?origin=40.0,-105.2');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Missing origin or destination' },
            { status: 400 }
        );
    });

    it('should return 500 if API key is not configured', async () => {
        delete process.env.TOMTOM_API_KEY;

        const request = new Request('http://localhost/api/route?origin=40.0,-105.2&destination=39.5,-106.0');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    });

    it('should fetch and return route data successfully', async () => {
        const mockTomTomResponse = {
            routes: [{
                summary: {
                    travelTimeInSeconds: 3600,
                    trafficDelayInSeconds: 300,
                    lengthInMeters: 100000
                },
                legs: [{
                    points: [
                        { latitude: 40.0, longitude: -105.2 },
                        { latitude: 39.5, longitude: -106.0 }
                    ]
                }]
            }]
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockTomTomResponse
        });

        const request = new Request('http://localhost/api/route?origin=40.0,-105.2&destination=39.5,-106.0');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith({
            travelTimeInSeconds: 3600,
            trafficDelayInSeconds: 300,
            lengthInMeters: 100000,
            coordinates: [[-105.2, 40.0], [-106.0, 39.5]]
        });
    });

    it('should return 404 if no route is found', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ routes: [] })
        });

        const request = new Request('http://localhost/api/route?origin=40.0,-105.2&destination=39.5,-106.0');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'No route found' },
            { status: 404 }
        );
    });

    it('should return 500 on TomTom API error', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const request = new Request('http://localhost/api/route?origin=40.0,-105.2&destination=39.5,-106.0');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Failed to fetch route data' },
            { status: 500 }
        );
    });
});
