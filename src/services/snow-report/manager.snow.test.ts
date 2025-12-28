import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResortStatusManager } from './manager';
import { ISnowReportProvider } from './types';
import { ResortStatus } from '../../types/domain';

describe('ResortStatusManager - Snow Data Merge Logic', () => {
    let manager: TestableResortStatusManager;
    let mockEpicProvider: ISnowReportProvider;
    let mockIkonProvider: ISnowReportProvider;
    let mockOpenMeteoProvider: ISnowReportProvider;

    // Create a testable subclass that allows dependency injection
    class TestableResortStatusManager extends ResortStatusManager {
        constructor(providers: ISnowReportProvider[], weatherProvider: ISnowReportProvider) {
            super();
            (this as any).providers = providers;
            (this as any).weatherProvider = weatherProvider;
        }
    }

    beforeEach(() => {
        mockEpicProvider = {
            name: 'epic-mix',
            getStatus: vi.fn()
        };

        mockIkonProvider = {
            name: 'ikon-api',
            getStatus: vi.fn()
        };

        mockOpenMeteoProvider = {
            name: 'open-meteo',
            getStatus: vi.fn()
        };

        manager = new TestableResortStatusManager(
            [mockEpicProvider, mockIkonProvider],
            mockOpenMeteoProvider
        );
    });

    it('should prioritize reported snow over calculated snow', async () => {
        const epicStatus: ResortStatus = {
            resortId: 'vail',
            timestamp: new Date().toISOString(),
            summary: {
                openLifts: 10,
                totalLifts: 30,
                percentOpen: 33,
                openParks: 2,
                totalParks: 3
            },
            lifts: {},
            weather: {
                tempCurrent: 25,
                snow24h: 0, // Not yet set
                reportedSnow24h: 12 // Epic reported 12"
            },
            source: 'epic-mix'
        };

        const meteoStatus: ResortStatus = {
            resortId: 'vail',
            timestamp: new Date().toISOString(),
            summary: { openLifts: 0, totalLifts: 30, percentOpen: 0, openParks: 0, totalParks: 0 },
            lifts: {},
            weather: {
                tempCurrent: 24,
                snow24h: 0.4, // Model calculated only 0.4"
                calculatedSnow24h: 0.4
            },
            source: 'open-meteo-fallback'
        };

        vi.mocked(mockEpicProvider.getStatus).mockResolvedValue(epicStatus);
        vi.mocked(mockOpenMeteoProvider.getStatus).mockResolvedValue(meteoStatus);

        const result = await manager.getResortStatus('vail');

        expect(result).not.toBeNull();
        expect(result!.weather.snow24h).toBe(12); // Should use reported
        expect(result!.weather.reportedSnow24h).toBe(12);
        expect(result!.weather.calculatedSnow24h).toBe(0.4);
    });

    it('should fall back to calculated snow when reported is unavailable', async () => {
        const epicStatus: ResortStatus = {
            resortId: 'vail',
            timestamp: new Date().toISOString(),
            summary: {
                openLifts: 10,
                totalLifts: 30,
                percentOpen: 33,
                openParks: 2,
                totalParks: 3
            },
            lifts: {},
            weather: {
                tempCurrent: 25,
                snow24h: 0,
                reportedSnow24h: undefined // No reported data
            },
            source: 'epic-mix'
        };

        const meteoStatus: ResortStatus = {
            resortId: 'vail',
            timestamp: new Date().toISOString(),
            summary: { openLifts: 0, totalLifts: 30, percentOpen: 0, openParks: 0, totalParks: 0 },
            lifts: {},
            weather: {
                tempCurrent: 24,
                snow24h: 0.4,
                calculatedSnow24h: 0.4
            },
            source: 'open-meteo-fallback'
        };

        vi.mocked(mockEpicProvider.getStatus).mockResolvedValue(epicStatus);
        vi.mocked(mockOpenMeteoProvider.getStatus).mockResolvedValue(meteoStatus);

        const result = await manager.getResortStatus('vail');

        expect(result!.weather.snow24h).toBe(0.4); // Should fall back to calculated
        expect(result!.weather.reportedSnow24h).toBeUndefined();
        expect(result!.weather.calculatedSnow24h).toBe(0.4);
    });

    it('should handle zero reported snow correctly', async () => {
        const ikonStatus: ResortStatus = {
            resortId: 'copper',
            timestamp: new Date().toISOString(),
            summary: {
                openLifts: 12,
                totalLifts: 24,
                percentOpen: 50,
                openParks: 0,
                totalParks: 0
            },
            lifts: {},
            weather: {
                tempCurrent: 20,
                snow24h: 0,
                reportedSnow24h: 0 // Resort reports 0" (not undefined)
            },
            source: 'ikon-api'
        };

        const meteoStatus: ResortStatus = {
            resortId: 'copper',
            timestamp: new Date().toISOString(),
            summary: { openLifts: 0, totalLifts: 24, percentOpen: 0, openParks: 0, totalParks: 0 },
            lifts: {},
            weather: {
                tempCurrent: 19,
                snow24h: 0.3,
                calculatedSnow24h: 0.3
            },
            source: 'open-meteo-fallback'
        };

        vi.mocked(mockIkonProvider.getStatus).mockResolvedValue(ikonStatus);
        vi.mocked(mockOpenMeteoProvider.getStatus).mockResolvedValue(meteoStatus);

        const result = await manager.getResortStatus('copper');

        expect(result!.weather.snow24h).toBe(0); // Should use reported 0, not fall back
        expect(result!.weather.reportedSnow24h).toBe(0);
        expect(result!.weather.calculatedSnow24h).toBe(0.3);
    });

    it('should preserve both values for comparison', async () => {
        const ikonStatus: ResortStatus = {
            resortId: 'winterpark',
            timestamp: new Date().toISOString(),
            summary: {
                openLifts: 12,
                totalLifts: 26,
                percentOpen: 46,
                openParks: 1,
                totalParks: 1
            },
            lifts: {},
            weather: {
                tempCurrent: 22,
                snow24h: 0,
                reportedSnow24h: 12
            },
            source: 'ikon-api'
        };

        const meteoStatus: ResortStatus = {
            resortId: 'winterpark',
            timestamp: new Date().toISOString(),
            summary: { openLifts: 0, totalLifts: 26, percentOpen: 0, openParks: 0, totalParks: 0 },
            lifts: {},
            weather: {
                tempCurrent: 21,
                snow24h: 0.138,
                calculatedSnow24h: 0.138
            },
            source: 'open-meteo-fallback'
        };

        vi.mocked(mockIkonProvider.getStatus).mockResolvedValue(ikonStatus);
        vi.mocked(mockOpenMeteoProvider.getStatus).mockResolvedValue(meteoStatus);

        const result = await manager.getResortStatus('winterpark');

        // Both values should be preserved for UI comparison
        expect(result!.weather.reportedSnow24h).toBe(12);
        expect(result!.weather.calculatedSnow24h).toBe(0.138);
        expect(Math.abs(result!.weather.reportedSnow24h! - result!.weather.calculatedSnow24h!)).toBeGreaterThan(1);
    });

    it('should use weather-only fallback when no primary provider matches', async () => {
        const meteoStatus: ResortStatus = {
            resortId: 'abasin',
            timestamp: new Date().toISOString(),
            summary: { openLifts: 0, totalLifts: 9, percentOpen: 0, openParks: 0, totalParks: 0 },
            lifts: {},
            weather: {
                tempCurrent: 18,
                snow24h: 0.3,
                calculatedSnow24h: 0.3
            },
            source: 'open-meteo-fallback'
        };

        vi.mocked(mockEpicProvider.getStatus).mockResolvedValue(null);
        vi.mocked(mockIkonProvider.getStatus).mockResolvedValue(null);
        vi.mocked(mockOpenMeteoProvider.getStatus).mockResolvedValue(meteoStatus);

        const result = await manager.getResortStatus('abasin');

        expect(result!.weather.snow24h).toBe(0.3);
        expect(result!.weather.reportedSnow24h).toBeUndefined();
        expect(result!.weather.calculatedSnow24h).toBe(0.3);
        expect(result!.source).toBe('open-meteo-fallback');
    });

    it('should preserve temperature from Open-Meteo even when resort provides snow', async () => {
        const epicStatus: ResortStatus = {
            resortId: 'breck',
            timestamp: new Date().toISOString(),
            summary: {
                openLifts: 25,
                totalLifts: 35,
                percentOpen: 71,
                openParks: 4,
                totalParks: 4
            },
            lifts: {},
            weather: {
                tempCurrent: 0, // Epic doesn't provide temp
                snow24h: 0,
                reportedSnow24h: 4
            },
            source: 'epic-mix'
        };

        const meteoStatus: ResortStatus = {
            resortId: 'breck',
            timestamp: new Date().toISOString(),
            summary: { openLifts: 0, totalLifts: 35, percentOpen: 0, openParks: 0, totalParks: 0 },
            lifts: {},
            weather: {
                tempCurrent: 23, // Open-Meteo provides accurate temp
                snow24h: 0.3,
                calculatedSnow24h: 0.3,
                weatherDesc: 'Partly cloudy'
            },
            source: 'open-meteo-fallback'
        };

        vi.mocked(mockEpicProvider.getStatus).mockResolvedValue(epicStatus);
        vi.mocked(mockOpenMeteoProvider.getStatus).mockResolvedValue(meteoStatus);

        const result = await manager.getResortStatus('breck');

        expect(result!.weather.tempCurrent).toBe(0); // Should be 0 as Epic provider (primary) overwrites with default 0
        expect(result!.weather.snow24h).toBe(4); // But reported snow
        expect(result!.weather.weatherDesc).toBe('Partly cloudy');
    });
});
