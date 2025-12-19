import { describe, it, expect } from 'vitest';
import { getRegion } from '../config/regions';
import { getResorts } from '../services/resorts';

describe('SoCal Region Configuration', () => {
    it('should be retrievable by ID', () => {
        const region = getRegion('socal');
        expect(region).toBeDefined();
        expect(region.id).toBe('socal');
        expect(region.name).toBe('Southern California');
    });

    it('should have correct locations defined', () => {
        const region = getRegion('socal');
        const locationIds = region.locations.map(l => l.id);
        expect(locationIds).toContain('ventura');
        expect(locationIds).toContain('santabarbara');
        expect(locationIds).toContain('santamonica');
        expect(locationIds).toContain('hollywood');
        expect(locationIds).toContain('sandiego');
        expect(locationIds).toContain('mammoth');
        expect(locationIds).toContain('bigbear');
        expect(locationIds).toContain('baldy');
    });

    it('should have correct provider settings', () => {
        const region = getRegion('socal');
        expect(region.providers.road).toBe('caltrans');
        expect(region.services.roads).toBe(true);
    });
});

describe('SoCal Resorts Service', () => {
    it('should return SoCal resorts when requested', async () => {
        const resorts = await getResorts('socal');
        const resortIds = resorts.map(r => r.id);

        expect(resortIds).toContain('mammoth');
        expect(resortIds).toContain('bigbear');
        expect(resortIds).toContain('baldy');
    });

    it('should include correct coordinates for resorts', async () => {
        const resorts = await getResorts('socal');
        const mammoth = resorts.find(r => r.id === 'mammoth');

        expect(mammoth).toBeDefined();
        expect(mammoth?.lat).toBe(37.6485);
        expect(mammoth?.lon).toBe(-118.9721);
    });
});
