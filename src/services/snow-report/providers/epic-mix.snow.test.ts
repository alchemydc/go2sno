import { describe, it, expect, vi } from 'vitest';
import { EpicMixProvider } from './epic-mix';
import { epicMixClient } from '../../epic-mix/client';

vi.mock('../../epic-mix/client');

describe('EpicMixProvider - Snow Data', () => {
    it('should fetch and parse snowfall from daily-stats', async () => {
        const mockMapData = {
            lifts: [{ id: 1, name: 'Lift 1', openingStatus: 'OPEN', type: 'LIFT', liftType: 'CHAIR' }],
            terrainParks: []
        };

        const mockDailyStats = {
            dailyStats: {
                hours: { open: '7:00 AM', close: '6:00 PM' },
                lifts: { open: '14', total: '44' },
                runs: { open: '18', total: '348' },
                snowfall: '7in',
                temp: { hi: { f: '22°F', c: '22°F' }, lo: { f: '12°F', c: '12°F' } }
            }
        };

        vi.mocked(epicMixClient.getResortStatus).mockResolvedValue(mockMapData);
        vi.mocked(epicMixClient.getResortDailyStats).mockResolvedValue(mockDailyStats);

        const provider = new EpicMixProvider();
        const result = await provider.getStatus('vail');

        expect(result).not.toBeNull();
        expect(result!.weather.reportedSnow24h).toBe(7);
        expect(result!.weather.snow24h).toBe(0); // Manager sets this later
    });

    it('should parse fractional snowfall amounts', async () => {
        const mockMapData = {
            lifts: [],
            terrainParks: []
        };

        const mockDailyStats = {
            dailyStats: {
                hours: { open: '7:00 AM', close: '6:00 PM' },
                lifts: { open: '0', total: '44' },
                runs: { open: '0', total: '348' },
                snowfall: '3.5in',
                temp: { hi: { f: '22°F', c: '22°F' }, lo: { f: '12°F', c: '12°F' } }
            }
        };

        vi.mocked(epicMixClient.getResortStatus).mockResolvedValue(mockMapData);
        vi.mocked(epicMixClient.getResortDailyStats).mockResolvedValue(mockDailyStats);

        const provider = new EpicMixProvider();
        const result = await provider.getStatus('breck');

        expect(result!.weather.reportedSnow24h).toBe(3.5);
    });

    it('should handle zero snowfall', async () => {
        const mockMapData = {
            lifts: [],
            terrainParks: []
        };

        const mockDailyStats = {
            dailyStats: {
                hours: { open: '7:00 AM', close: '6:00 PM' },
                lifts: { open: '0', total: '44' },
                runs: { open: '0', total: '348' },
                snowfall: '0in',
                temp: { hi: { f: '22°F', c: '22°F' }, lo: { f: '12°F', c: '12°F' } }
            }
        };

        vi.mocked(epicMixClient.getResortStatus).mockResolvedValue(mockMapData);
        vi.mocked(epicMixClient.getResortDailyStats).mockResolvedValue(mockDailyStats);

        const provider = new EpicMixProvider();
        const result = await provider.getStatus('keystone');

        expect(result!.weather.reportedSnow24h).toBe(0);
    });

    it('should return undefined reportedSnow24h when daily-stats fails', async () => {
        const mockMapData = {
            lifts: [],
            terrainParks: []
        };

        vi.mocked(epicMixClient.getResortStatus).mockResolvedValue(mockMapData);
        vi.mocked(epicMixClient.getResortDailyStats).mockRejectedValue(new Error('401 Unauthorized'));

        const provider = new EpicMixProvider();
        const result = await provider.getStatus('vail');

        expect(result!.weather.reportedSnow24h).toBeUndefined();
    });

    it('should return undefined reportedSnow24h when snowfall field is missing', async () => {
        const mockMapData = {
            lifts: [],
            terrainParks: []
        };

        const mockDailyStats = {
            dailyStats: {
                hours: { open: '7:00 AM', close: '6:00 PM' },
                lifts: { open: '0', total: '44' },
                runs: { open: '0', total: '348' },
                temp: { hi: { f: '22°F', c: '22°F' }, lo: { f: '12°F', c: '12°F' } }
            }
        } as any;

        vi.mocked(epicMixClient.getResortStatus).mockResolvedValue(mockMapData);
        vi.mocked(epicMixClient.getResortDailyStats).mockResolvedValue(mockDailyStats);

        const provider = new EpicMixProvider();
        const result = await provider.getStatus('vail');

        expect(result!.weather.reportedSnow24h).toBeUndefined();
    });
});
