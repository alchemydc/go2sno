import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SacClient } from '../sac/client';

const mockMapLayerResponse = {
    type: 'FeatureCollection' as const,
    features: [
        {
            type: 'Feature' as const,
            id: 2458,
            properties: {
                name: 'Central Sierra Nevada',
                center: 'Sierra Avalanche Center',
                center_link: 'https://www.sierraavalanchecenter.org/',
                timezone: 'America/Los_Angeles',
                center_id: 'SAC',
                state: 'CA',
                off_season: false,
                travel_advice: 'Heightened avalanche conditions on specific terrain features.',
                danger: 'moderate',
                danger_level: 2,
                color: '#f4e500',
                stroke: '#484848',
                font_color: '#141B21',
                link: 'https://www.sierraavalanchecenter.org/forecasts/avalanche/central-sierra-nevada#/central-sierra-nevada/',
                start_date: '2026-02-28T14:33:00',
                end_date: '2026-03-01T12:00:00',
                fillOpacity: 0.5,
                fillIncrement: 0.1,
                warning: { product: null },
            },
            geometry: { type: 'MultiPolygon' as const, coordinates: [] },
        },
        {
            type: 'Feature' as const,
            id: 128,
            properties: {
                name: 'Eastside Region',
                center: 'Eastern Sierra Avalanche Center',
                center_link: 'http://www.esavalanche.org/',
                timezone: 'America/Los_Angeles',
                center_id: 'ESAC',
                state: 'CA',
                off_season: false,
                travel_advice: 'Evaluate snow and terrain carefully.',
                danger: 'considerable',
                danger_level: 3,
                color: '#f69730',
                stroke: '#484848',
                font_color: '#141B21',
                link: 'https://www.esavalanche.org/forecasts#/eastside-region',
                start_date: '2026-02-28T15:00:00',
                end_date: '2026-03-01T15:00:00',
                fillOpacity: 0.5,
                fillIncrement: 0.1,
                warning: { product: null },
            },
            geometry: { type: 'Polygon' as const, coordinates: [] },
        },
    ],
};

describe('SacClient', () => {
    let client: SacClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = new SacClient();
    });

    it('should fetch SAC forecast from map-layer endpoint', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockMapLayerResponse,
        });

        const result = await client.getForecastByCenter('SAC');

        expect(result).not.toBeNull();
        expect(result!.name).toBe('Central Sierra Nevada');
        expect(result!.danger).toBe('moderate');
        expect(result!.danger_level).toBe(2);
        expect(result!.travel_advice).toBe('Heightened avalanche conditions on specific terrain features.');
    });

    it('should fetch ESAC forecast for Mammoth area', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockMapLayerResponse,
        });

        const result = await client.getForecastByCenter('ESAC');

        expect(result).not.toBeNull();
        expect(result!.name).toBe('Eastside Region');
        expect(result!.danger_level).toBe(3);
    });

    it('should return null for unknown center_id', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockMapLayerResponse,
        });

        const result = await client.getForecastByCenter('UNKNOWN');
        expect(result).toBeNull();
    });

    it('should cache responses for subsequent calls', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockMapLayerResponse,
        });

        await client.getForecastByCenter('SAC');
        await client.getForecastByCenter('ESAC');

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on API error', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server error',
        });

        await expect(client.getForecastByCenter('SAC')).rejects.toThrow('Avalanche.org API Error');
    });
});
