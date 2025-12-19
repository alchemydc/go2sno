import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CaltransRoadService } from '../caltrans';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock window.location for URL construction mechanism in services if needed
const mockWindow = {
    location: {
        origin: 'http://localhost:3000'
    }
};
vi.stubGlobal('window', mockWindow);

describe('CaltransRoadService', () => {
    beforeEach(() => {
        fetchMock.mockReset();
    });

    it('should default to "tahoe" region if not provided', async () => {
        const service = new CaltransRoadService();
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        await service.getIncidents();

        expect(fetchMock).toHaveBeenCalledWith('/api/v1/roads/incidents?region=tahoe');
    });

    it('should use provided regionId in getIncidents', async () => {
        const service = new CaltransRoadService('socal');
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        await service.getIncidents();

        expect(fetchMock).toHaveBeenCalledWith('/api/v1/roads/incidents?region=socal');
    });

    it('should use provided regionId in getConditions', async () => {
        const service = new CaltransRoadService('socal');
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        await service.getConditions();

        const callUrl = new URL(fetchMock.mock.calls[0][0]);
        expect(callUrl.pathname).toBe('/api/v1/roads/conditions');
        expect(callUrl.searchParams.get('region')).toBe('socal');
    });

    it('should use provided regionId in getCameras', async () => {
        const service = new CaltransRoadService('socal');
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        await service.getCameras();

        const callUrl = new URL(fetchMock.mock.calls[0][0]);
        expect(callUrl.pathname).toBe('/api/v1/roads/cameras');
        expect(callUrl.searchParams.get('region')).toBe('socal');
    });
});
