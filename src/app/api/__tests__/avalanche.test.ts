import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../v1/avalanche/route';
import { NextResponse } from 'next/server';

// Mock the AvalancheOrgClient (now used for all regions including CO)
const mockGetForecastByCenter = vi.fn();
const mockGetForecastByZoneName = vi.fn();
const mockGetForecastByCoordinates = vi.fn();

vi.mock('../../../services/sac/client', () => ({
    AvalancheOrgClient: class {
        getForecastByCenter(...args: any[]) {
            return mockGetForecastByCenter(...args);
        }
        getForecastByZoneName(...args: any[]) {
            return mockGetForecastByZoneName(...args);
        }
        getForecastByCoordinates(...args: any[]) {
            return mockGetForecastByCoordinates(...args);
        }
    },
    SacClient: class {
        getForecastByCenter(...args: any[]) {
            return mockGetForecastByCenter(...args);
        }
        getForecastByZoneName(...args: any[]) {
            return mockGetForecastByZoneName(...args);
        }
        getForecastByCoordinates(...args: any[]) {
            return mockGetForecastByCoordinates(...args);
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
        mockGetForecastByCoordinates.mockResolvedValue(null);

        const request = new Request('http://localhost/api/avalanche?destination=frisco');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Not found' },
            { status: 404 }
        );
    });

    it('should return 500 on API error', async () => {
        mockGetForecastByCoordinates.mockRejectedValue(new Error('API error'));

        const request = new Request('http://localhost/api/avalanche?destination=frisco');

        await GET(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    });

    it('should use coordinate-based lookup for CO destinations', async () => {
        mockGetForecastByCoordinates.mockResolvedValue({
            name: 'CAIC zone',
            center_id: 'CAIC',
            danger: 'considerable',
            danger_level: 3,
            travel_advice: 'Dangerous avalanche conditions. Careful snowpack evaluation essential.',
            link: 'https://avalanche.state.co.us/',
            start_date: '2026-02-28T23:30:00',
        });

        const request = new Request('http://localhost/api/avalanche?destination=aspen');
        await GET(request);

        // Aspen coordinates: [-106.8175, 39.1911]
        expect(mockGetForecastByCoordinates).toHaveBeenCalledWith('CAIC', -106.8175, 39.1911);
        expect(NextResponse.json).toHaveBeenCalledWith({
            zoneId: 'CAIC-aspen',
            zoneName: 'Aspen',
            dangerRating: 3,
            dangerRatingDisplay: 'Considerable',
            summary: 'Dangerous avalanche conditions. Careful snowpack evaluation essential.',
            issueDate: '2026-02-28T23:30:00',
            url: 'https://avalanche.state.co.us/',
            provider: 'caic',
        });
    });

    it('should proxy gateway cities to nearby resort coordinates', async () => {
        mockGetForecastByCoordinates.mockResolvedValue({
            name: 'CAIC zone',
            center_id: 'CAIC',
            danger: 'moderate',
            danger_level: 2,
            travel_advice: 'Heightened avalanche conditions.',
            link: 'https://avalanche.state.co.us/',
            start_date: '2026-02-28T23:30:00',
        });

        const request = new Request('http://localhost/api/avalanche?destination=denver');
        await GET(request);

        // Denver proxies to Eldora coordinates: [-105.5835, 39.9382]
        expect(mockGetForecastByCoordinates).toHaveBeenCalledWith('CAIC', -105.5835, 39.9382);
    });

    describe('Tahoe region (SAC)', () => {
        it('should return SAC forecast for Tahoe destinations', async () => {
            mockGetForecastByCenter.mockResolvedValue({
                name: 'Central Sierra Nevada',
                center_id: 'SAC',
                danger: 'moderate',
                danger_level: 2,
                travel_advice: 'Heightened avalanche conditions on specific terrain features.',
                link: 'https://www.sierraavalanchecenter.org/forecasts/avalanche/central-sierra-nevada#/central-sierra-nevada/',
                start_date: '2026-02-28T14:33:00',
            });

            const request = new Request('http://localhost/api/avalanche?region=tahoe&destination=heavenly');
            await GET(request);

            expect(mockGetForecastByCenter).toHaveBeenCalledWith('SAC');
            expect(NextResponse.json).toHaveBeenCalledWith({
                zoneId: 'SAC',
                zoneName: 'Central Sierra Nevada',
                dangerRating: 2,
                dangerRatingDisplay: 'Moderate',
                summary: 'Heightened avalanche conditions on specific terrain features.',
                issueDate: '2026-02-28T14:33:00',
                url: 'https://www.sierraavalanchecenter.org/forecasts/avalanche/central-sierra-nevada#/central-sierra-nevada/',
                provider: 'sac',
            });
        });

        it('should route Mammoth to ESAC', async () => {
            mockGetForecastByCenter.mockResolvedValue({
                name: 'Eastside Region',
                center_id: 'ESAC',
                danger: 'considerable',
                danger_level: 3,
                travel_advice: 'Evaluate snow and terrain carefully.',
                link: 'https://www.esavalanche.org/forecasts#/eastside-region',
                start_date: '2026-02-28T15:00:00',
            });

            const request = new Request('http://localhost/api/avalanche?region=tahoe&destination=mammoth');
            await GET(request);

            expect(mockGetForecastByCenter).toHaveBeenCalledWith('ESAC');
            expect(NextResponse.json).toHaveBeenCalledWith({
                zoneId: 'ESAC',
                zoneName: 'Eastside Region',
                dangerRating: 3,
                dangerRatingDisplay: 'Considerable',
                summary: 'Evaluate snow and terrain carefully.',
                issueDate: '2026-02-28T15:00:00',
                url: 'https://www.esavalanche.org/forecasts#/eastside-region',
                provider: 'sac',
            });
        });

        it('should return 404 when SAC returns null', async () => {
            mockGetForecastByCenter.mockResolvedValue(null);

            const request = new Request('http://localhost/api/avalanche?region=tahoe&destination=heavenly');
            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: 'Not found' },
                { status: 404 }
            );
        });
    });

    describe('Utah region (UAC)', () => {
        it('should return UAC Salt Lake forecast for Utah destinations', async () => {
            mockGetForecastByZoneName.mockResolvedValue({
                name: 'Salt Lake',
                center_id: 'UAC',
                danger: 'considerable',
                danger_level: 3,
                travel_advice: 'Dangerous avalanche conditions. Careful snowpack evaluation essential.',
                link: 'https://utahavalanchecenter.org/forecast/salt-lake',
                start_date: '2026-02-28T14:30:00',
            });

            const request = new Request('http://localhost/api/avalanche?region=ut&destination=alta');
            await GET(request);

            expect(mockGetForecastByZoneName).toHaveBeenCalledWith('UAC', 'Salt Lake');
            expect(NextResponse.json).toHaveBeenCalledWith({
                zoneId: 'UAC-salt-lake',
                zoneName: 'Salt Lake',
                dangerRating: 3,
                dangerRatingDisplay: 'Considerable',
                summary: 'Dangerous avalanche conditions. Careful snowpack evaluation essential.',
                issueDate: '2026-02-28T14:30:00',
                url: 'https://utahavalanchecenter.org/forecast/salt-lake',
                provider: 'uac',
            });
        });

        it('should map all Wasatch resorts to Salt Lake zone', async () => {
            mockGetForecastByZoneName.mockResolvedValue({
                name: 'Salt Lake',
                center_id: 'UAC',
                danger: 'moderate',
                danger_level: 2,
                travel_advice: 'Evaluate terrain carefully.',
                link: 'https://utahavalanchecenter.org/forecast/salt-lake',
                start_date: '2026-02-28T14:30:00',
            });

            for (const dest of ['snowbird', 'brighton', 'solitude', 'parkcity', 'deervalley', 'slc']) {
                vi.mocked(NextResponse.json).mockClear();
                const request = new Request(`http://localhost/api/avalanche?region=ut&destination=${dest}`);
                await GET(request);
                expect(mockGetForecastByZoneName).toHaveBeenCalledWith('UAC', 'Salt Lake');
            }
        });

        it('should return 404 when UAC returns null', async () => {
            mockGetForecastByZoneName.mockResolvedValue(null);

            const request = new Request('http://localhost/api/avalanche?region=ut&destination=alta');
            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: 'Not found' },
                { status: 404 }
            );
        });
    });
});
