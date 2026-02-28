import { describe, it, expect } from 'vitest';
import { getRegion } from '../config/regions';
import { getResorts } from '../services/resorts';
import { IKON_RESORT_MAP } from '../config/ikon-resorts';

describe('New Zealand Region Configuration', () => {
    it('should be retrievable by ID', () => {
        const nz = getRegion('nz');
        expect(nz).toBeDefined();
        expect(nz.name).toBe('New Zealand');
        // Validate map center is in South Island
        expect(nz.center[1]).toBeLessThan(-40);
        expect(nz.center[0]).toBeGreaterThan(160);
    });

    it('should have correct resorts', () => {
        const nz = getRegion('nz');
        const ids = nz.resortIds;
        expect(ids).toContain('coronet');
        expect(ids).toContain('remarkables');
        expect(ids).toContain('mthutt');
        expect(ids).toContain('cardrona');
        expect(ids).toContain('treblecone');
    });
});

describe('NZ Resorts Data', () => {
    it('should fetch NZ resorts correctly', async () => {
        const resorts = await getResorts('nz');
        expect(resorts.length).toBe(5);

        const coronet = resorts.find(r => r.id === 'coronet');
        expect(coronet).toBeDefined();
        expect(coronet?.affiliation).toBe('ikon');
        expect(coronet?.lat).toBeCloseTo(-44.92, 1);

        const cardrona = resorts.find(r => r.id === 'cardrona');
        expect(cardrona).toBeDefined();
        expect(cardrona?.affiliation).toBeUndefined(); // Independent
    });

    it('should have correct ID mappings', () => {
        expect(IKON_RESORT_MAP['coronet'].ikonId).toBe(179);
        expect(IKON_RESORT_MAP['remarkables'].ikonId).toBe(180);
        expect(IKON_RESORT_MAP['mthutt'].ikonId).toBe(181);
    });
});
