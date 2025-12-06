import { describe, it, expect } from 'vitest';
import { getResorts } from '../resorts';

describe('resorts service', () => {
    describe('getResorts', () => {
        it('should return list of resorts with correct structure', async () => {
            const resorts = await getResorts();

            expect(resorts).toBeInstanceOf(Array);
            expect(resorts.length).toBeGreaterThan(0);

            // Check first resort has required fields
            const firstResort = resorts[0];
            expect(firstResort).toHaveProperty('id');
            expect(firstResort).toHaveProperty('name');
            expect(firstResort).toHaveProperty('snow24h');
            expect(firstResort).toHaveProperty('liftsOpen');
            expect(firstResort).toHaveProperty('totalLifts');
            expect(firstResort).toHaveProperty('lat');
            expect(firstResort).toHaveProperty('lon');
        });

        it('should include specific resorts', async () => {
            const resorts = await getResorts();
            const resortNames = resorts.map(r => r.name);

            expect(resortNames).toContain('Copper Mountain');
            expect(resortNames).toContain('Breckenridge');
            expect(resortNames).toContain('Vail');
        });

        it('should have valid numeric values', async () => {
            const resorts = await getResorts();

            resorts.forEach(resort => {
                expect(typeof resort.snow24h).toBe('number');
                expect(typeof resort.liftsOpen).toBe('number');
                expect(typeof resort.totalLifts).toBe('number');
                expect(typeof resort.lat).toBe('number');
                expect(typeof resort.lon).toBe('number');
            });
        });
    });
});
