import { describe, it, expect } from 'vitest';
import { getRegion } from '../config/regions';
import { getResorts } from '../services/resorts';
import { IKON_RESORT_MAP } from '../config/ikon-resorts';
import { EPIC_RESORT_MAP } from '../config/epic-resorts';

describe('US East Region Configuration', () => {
    it('should be retrievable by ID', () => {
        const region = getRegion('us-east');
        expect(region).toBeDefined();
        expect(region.name).toBe('East Coast');
        // Validate map center
        expect(region.center[1]).toBe(42.0);
        expect(region.center[0]).toBe(-74.0);
    });

    it('should have correct resorts list', () => {
        const region = getRegion('us-east');
        const ids = region.resortIds;
        expect(ids).toContain('stowe');
        expect(ids).toContain('killington');
        expect(ids).toContain('hunter');
        expect(ids).toContain('snowshoe');
        expect(ids.length).toBeGreaterThan(15);
    });
});

describe('US East Resorts Data', () => {
    it('should fetch US East resorts correctly', async () => {
        const resorts = await getResorts('us-east');
        expect(resorts.length).toBeGreaterThan(15);

        const stowe = resorts.find(r => r.id === 'stowe');
        expect(stowe).toBeDefined();
        expect(stowe?.affiliation).toBe('epic');

        const killington = resorts.find(r => r.id === 'killington');
        expect(killington).toBeDefined();
        expect(killington?.affiliation).toBe('ikon');

        const jaypeak = resorts.find(r => r.id === 'jaypeak');
        expect(jaypeak).toBeDefined();
        expect(jaypeak?.affiliation).toBeUndefined(); // Independent
    });

    it('should have correct ID mappings', () => {
        expect(EPIC_RESORT_MAP['stowe'].epicId).toBe('18');
        expect(EPIC_RESORT_MAP['okemo'].epicId).toBe('13');
        expect(IKON_RESORT_MAP['killington'].ikonId).toBe(69);
        expect(IKON_RESORT_MAP['sugarloaf'].ikonId).toBe(72);
        expect(IKON_RESORT_MAP['camelback'].ikonId).toBe(177);
    });
});
