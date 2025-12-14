import { describe, it, expect } from 'vitest';
import { getRegion } from '../config/regions';
import { getResorts } from '../services/resorts';
import { IKON_RESORT_MAP } from '../config/ikon-resorts';
import { EPIC_RESORT_MAP } from '../config/epic-resorts';

describe('Japan Region Configuration', () => {
    it('should be retrievable by ID', () => {
        const japan = getRegion('japan');
        expect(japan).toBeDefined();
        expect(japan.name).toBe('Japan');
        // Validate map center is roughly between Honshu/Hokkaido
        expect(japan.center[0]).toBeGreaterThan(130);
        expect(japan.center[0]).toBeLessThan(146);
    });

    it('should have Niseko resorts split out', () => {
        const japan = getRegion('japan');
        const ids = japan.resortIds;
        expect(ids).toContain('annupuri');
        expect(ids).toContain('hirafu');
        expect(ids).toContain('hanazono');
        expect(ids).toContain('village');
        expect(ids).toContain('rusutsu');
    });

    it('should service config', () => {
        const japan = getRegion('japan');
        expect(japan.services.weather).toBe(true);
        expect(japan.services.roads).toBe(false);
    });
});

describe('Japan Resorts Data', () => {
    it('should fetch Japan resorts correctly', async () => {
        const resorts = await getResorts('japan');
        expect(resorts.length).toBeGreaterThan(5);

        const hirafu = resorts.find(r => r.id === 'hirafu');
        expect(hirafu).toBeDefined();
        expect(hirafu?.affiliation).toBe('ikon');
        expect(hirafu?.lat).toBeCloseTo(42.86, 1);

        const hakuba = resorts.find(r => r.id === 'hakuba');
        expect(hakuba).toBeDefined();
        expect(hakuba?.affiliation).toBe('epic');

        const rusutsu = resorts.find(r => r.id === 'rusutsu');
        expect(rusutsu).toBeDefined();
        expect(rusutsu?.affiliation).toBeUndefined(); // Independent
    });

    it('should have correct ID mappings', () => {
        expect(IKON_RESORT_MAP['annupuri'].ikonId).toBe(84);
        expect(IKON_RESORT_MAP['village'].ikonId).toBe(87);
        expect(IKON_RESORT_MAP['zao'].ikonId).toBe(253);
        // Placeholder check
        expect(EPIC_RESORT_MAP['hakuba'].epicId).toBe('hakuba');
    });
});
