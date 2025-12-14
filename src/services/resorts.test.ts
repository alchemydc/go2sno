
import { getResorts } from './resorts';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('./open-meteo', () => ({
    fetchResortWeather: vi.fn().mockResolvedValue([
        { daily: { snowfall_sum: [0] }, current: { temperature_2m: 30 } }
    ])
}));

vi.mock('../config/regions', () => ({
    getRegion: vi.fn((id) => {
        if (id === 'co') return { resortIds: ['winterpark', 'breck', 'abasin'] };
        return null;
    })
}));

// Mock config maps
vi.mock('../config/epic-resorts', () => ({
    EPIC_RESORT_MAP: { 'breck': { epicId: '1', parkNames: [] } }
}));

vi.mock('../config/ikon-resorts', () => ({
    IKON_RESORT_MAP: { 'winterpark': { ikonId: 5 } }
}));

describe('Resort Service', () => {
    it('should correctly assign affiliation to resorts', async () => {
        const resorts = await getResorts('co');

        const winterpark = resorts.find(r => r.id === 'winterpark');
        const breck = resorts.find(r => r.id === 'breck');
        const abasin = resorts.find(r => r.id === 'abasin');

        expect(winterpark).toBeDefined();
        expect(winterpark?.affiliation).toBe('ikon');

        expect(breck).toBeDefined();
        expect(breck?.affiliation).toBe('epic');

        expect(abasin).toBeDefined();
        // A-Basin is neither Epic nor Ikon in this mock scenario
        expect(abasin?.affiliation).toBeUndefined();
    });
});
