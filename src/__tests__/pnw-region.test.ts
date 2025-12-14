import { describe, it, expect } from 'vitest';
import { getRegion } from '../config/regions';
import { getResorts } from '../services/resorts';
import { IKON_RESORT_MAP } from '../config/ikon-resorts';
import { EPIC_RESORT_MAP } from '../config/epic-resorts';

describe('PNW Region Configuration', () => {
    it('should be retrievable by ID', () => {
        const pnw = getRegion('pnw');
        expect(pnw).toBeDefined();
        expect(pnw.name).toContain('Pacific Northwest');
        expect(pnw.cameraKeywords).toBeDefined();
        expect(pnw.cameraKeywords?.['snoqualmie']).toBe(20);
    });

    it('should have correct resort count', () => {
        const pnw = getRegion('pnw');
        expect(pnw.resortIds.length).toBeGreaterThan(10);
        expect(pnw.resortIds).toContain('whistler');
        expect(pnw.resortIds).toContain('crystal');
        expect(pnw.resortIds).toContain('mthood');
    });

    it('should have properly mapped services', () => {
        const pnw = getRegion('pnw');
        expect(pnw.services.weather).toBe(true);
        // Roads and Avalanche currently stubbed/false
        expect(pnw.services.roads).toBe(false);
        expect(pnw.providers.road).toBe('stub');
    });
});

describe('PNW Resorts Data', () => {
    it('should fetch PNW resorts correctly', async () => {
        const resorts = await getResorts('pnw');
        expect(resorts.length).toBeGreaterThan(0);

        const whistler = resorts.find(r => r.id === 'whistler');
        expect(whistler).toBeDefined();
        expect(whistler?.affiliation).toBe('epic');

        const crystal = resorts.find(r => r.id === 'crystal');
        expect(crystal).toBeDefined();
        expect(crystal?.affiliation).toBe('ikon');

        const mthood = resorts.find(r => r.id === 'mthood');
        expect(mthood).toBeDefined();
        expect(mthood?.affiliation).toBeUndefined(); // Independent
    });

    it('should have correct ID mappings', () => {
        expect(IKON_RESORT_MAP['crystal'].ikonId).toBe(80);
        expect(IKON_RESORT_MAP['snoqualmie'].ikonId).toBe(79);
        expect(EPIC_RESORT_MAP['whistler'].epicId).toBe('19');
        expect(EPIC_RESORT_MAP['stevens'].epicId).toBe('17');
    });
});
