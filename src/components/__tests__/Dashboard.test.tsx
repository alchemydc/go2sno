import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import * as weatherService from '../../services/weather';
import * as factoryService from '../../services/factory';
import * as resortsService from '../../services/resorts';
import * as avalancheService from '../../services/avalanche';

vi.mock('../../services/weather');
vi.mock('../../services/resorts');
vi.mock('../../services/avalanche');
vi.mock('maplibre-gl');
vi.mock('../../services/factory');

// Mock useRegion
vi.mock('../../context/RegionContext', () => ({
    useRegion: () => ({
        selectedRegion: {
            id: 'co',
            name: 'Colorado',
            locations: [
                { id: 'denver', name: 'Denver', type: 'gateway', coordinates: '39.7,-104.9' },
                { id: 'vail', name: 'Vail', type: 'resort', coordinates: '39.6,-106.3' }
            ],
            resortIds: ['vail']
        },
        setRegionId: vi.fn()
    })
}));

vi.mock('@turf/point-to-line-distance', () => ({
    default: () => 0.5 // Always return 0.5 miles, within the 1 mile threshold
}));
vi.mock('@turf/helpers', () => ({
    point: (coords: any) => coords,
    lineString: (coords: any) => coords
}));

// Mock RoutePlanner to simulate user interaction
vi.mock('../RoutePlanner', () => ({
    RoutePlanner: ({ onDestinationChange, onRouteUpdate, onFromChange }: any) => {
        return (
            <div data-testid="route-planner">
                <button onClick={() => {
                    onFromChange('denver');
                    onDestinationChange('vail');
                    onRouteUpdate({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [[-104.9, 39.7], [-106.3, 39.6]]
                        }
                    });
                }}>Select Route</button>
            </div>
        );
    }
}));

describe('Dashboard', () => {
    // Create queryable spies for the service methods
    const mockGetIncidents = vi.fn();
    const mockGetConditions = vi.fn();
    const mockGetCameras = vi.fn();
    const mockGetForecast = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();

        // Setup the mock road service
        vi.mocked(factoryService.getRoadService).mockReturnValue({
            getIncidents: mockGetIncidents,
            getConditions: mockGetConditions,
            getCameras: mockGetCameras
        });

        // Setup the mock avalanche service
        vi.mocked(factoryService.getAvalancheService).mockReturnValue({
            getForecast: mockGetForecast
        });

        vi.mocked(weatherService.getWeather).mockResolvedValue({
            temperature: 32,
            shortForecast: 'Partly Cloudy',
            windSpeed: '10 mph',
            icon: 'https://example.com/icon.png'
        });

        // Default empty responses
        mockGetIncidents.mockResolvedValue([]);
        mockGetConditions.mockResolvedValue([]);

        // Return 5 cameras to trigger the "View All" button
        const mockCameras = Array.from({ length: 5 }, (_, i) => ({
            id: `cam-${i}`,
            name: `Camera ${i}`,
            url: 'http://test.com',
            thumbnailUrl: 'http://test.com',
            location: { lat: 39.6, lon: -106.0 },
            regionId: 'co'
        }));
        mockGetCameras.mockResolvedValue(mockCameras);

        mockGetForecast.mockResolvedValue(null);

        vi.mocked(resortsService.getResorts).mockResolvedValue([
            { id: 'vail', name: 'Vail', snow24h: 5, totalLifts: 31, lat: 39.6, lon: -106.3 }
        ]);
    });

    it('should render main components', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('go2sno')).toBeInTheDocument();
            expect(screen.getByTestId('route-planner')).toBeInTheDocument();
        });
    });

    it('should show View All Cameras button and open overlay', async () => {
        render(<Dashboard />);

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByTestId('route-planner')).toBeInTheDocument();
        });

        // Trigger route selection
        fireEvent.click(screen.getByText('Select Route'));

        // Wait for cameras to load and "View All" button to appear
        await waitFor(() => {
            expect(screen.getByText(/View All 5 Cameras/)).toBeInTheDocument();
        });

        // Click "View All"
        fireEvent.click(screen.getByText(/View All 5 Cameras/));

        // Expect Overlay
        await waitFor(() => {
            expect(screen.getByText('All Route Cameras')).toBeInTheDocument();
            expect(screen.getByText(/Showing 5 cameras/)).toBeInTheDocument();
        });

        // Close Overlay
        fireEvent.click(screen.getByText('← Back to Dashboard'));

        // Expect Overlay Gone
        await waitFor(() => {
            expect(screen.queryByText('All Route Cameras')).not.toBeInTheDocument();
        });
    });

    it('should fetch resorts on region selection without route', async () => {
        render(<Dashboard />);

        // Wait for resorts to be fetched immediately upon load (mocked region selection)
        await waitFor(() => {
            expect(resortsService.getResorts).toHaveBeenCalledWith('co');
        });
    });

    it('should NOT fetch road data until route is selected', async () => {
        render(<Dashboard />);

        // Wait for initial render
        await waitFor(() => {
            expect(screen.getByText('go2sno')).toBeInTheDocument();
        });

        // Assert calls did NOT happen yet
        expect(mockGetIncidents).not.toHaveBeenCalled();
        expect(mockGetConditions).not.toHaveBeenCalled();
        // Cameras are fetched via priority/filtering logic now which might happen earlier if implemented differently,
        // but in Dashboard they depend on destination which is set by route planner simulation
        expect(mockGetCameras).not.toHaveBeenCalled();

        // Now trigger route selection
        fireEvent.click(screen.getByText('Select Route'));

        // Now they should be called
        await waitFor(() => {
            expect(mockGetIncidents).toHaveBeenCalled();
            expect(mockGetConditions).toHaveBeenCalled();
            expect(mockGetCameras).toHaveBeenCalled();
        });
    });

    it('should set destination when a resort is clicked', async () => {
        render(<Dashboard />);

        // Wait for resorts to load (Vail is in the mock)
        await waitFor(() => {
            expect(screen.getByText('Vail')).toBeInTheDocument();
        });

        // Click on Vail
        fireEvent.click(screen.getByText('Vail'));

        // Verify that the route planner update logic is triggered
        // We can check if getIncidents/getConditions is called, as that happens when destination is set
        await waitFor(() => {
            expect(mockGetIncidents).toHaveBeenCalled();
        });
    });
});
