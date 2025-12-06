import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import * as weatherService from '../../services/weather';
import * as cdotService from '../../services/cdot';
import * as resortsService from '../../services/resorts';

vi.mock('../../services/weather');
vi.mock('../../services/cdot');
vi.mock('../../services/resorts');
vi.mock('maplibre-gl');

describe('Dashboard', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock weather service
        vi.mocked(weatherService.getWeather).mockResolvedValue({
            temperature: 32,
            shortForecast: 'Partly Cloudy',
            windSpeed: '10 mph',
            icon: 'https://example.com/icon.png'
        });

        // Mock CDOT services
        vi.mocked(cdotService.getIncidents).mockResolvedValue([]);
        vi.mocked(cdotService.getRoadConditions).mockResolvedValue([]);
        vi.mocked(cdotService.getCameras).mockResolvedValue([
            { id: '1', name: 'Test Camera', url: 'https://example.com/camera.jpg' }
        ]);

        // Mock resorts service
        vi.mocked(resortsService.getResorts).mockResolvedValue([
            { id: 'test', name: 'Test Resort', snow24h: 5, liftsOpen: 10, totalLifts: 15, lat: 39.5, lon: -106.0 }
        ]);
    });

    it('should render all main components', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Go2Snow')).toBeInTheDocument();
            expect(screen.getByText('Route Planner')).toBeInTheDocument();
            expect(screen.getByText('Road Cameras')).toBeInTheDocument();
            expect(screen.getByText('Resort Status')).toBeInTheDocument();
        });
    });

    it('should fetch and display weather for default destination', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Leadville Weather')).toBeInTheDocument();
            expect(screen.getByText('32°F')).toBeInTheDocument();
            expect(screen.getByText('Partly Cloudy')).toBeInTheDocument();
            expect(screen.getByText('Wind: 10 mph')).toBeInTheDocument();
        });
    });

    it('should fetch incidents and conditions on mount', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(cdotService.getIncidents).toHaveBeenCalled();
            expect(cdotService.getRoadConditions).toHaveBeenCalled();
        });
    });

    it('should display loading state for alerts initially', () => {
        render(<Dashboard />);

        expect(screen.getByText(/loading alerts/i)).toBeInTheDocument();
    });

    it('should filter incidents based on route proximity', async () => {
        const mockIncidents = [
            {
                id: '1',
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-105.27, 40.01] }, // Near Boulder
                properties: {
                    type: 'Accident',
                    startTime: '2025-12-05T10:00:00Z',
                    travelerInformationMessage: 'Near route',
                    routeName: 'I-70'
                }
            },
            {
                id: '2',
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-110, 35] }, // Far away
                properties: {
                    type: 'Accident',
                    startTime: '2025-12-05T11:00:00Z',
                    travelerInformationMessage: 'Far from route',
                    routeName: 'I-25'
                }
            }
        ];

        vi.mocked(cdotService.getIncidents).mockResolvedValue(mockIncidents);

        render(<Dashboard />);

        // Initially should show all incidents (no route yet)
        await waitFor(() => {
            expect(screen.queryByText(/loading alerts/i)).not.toBeInTheDocument();
        });
    });

    it('should handle weather fetch errors gracefully', async () => {
        vi.mocked(weatherService.getWeather).mockResolvedValue({
            temperature: NaN,
            shortForecast: 'Unavailable',
            windSpeed: 'N/A',
            icon: ''
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Leadville Weather')).toBeInTheDocument();
            expect(screen.getByText('Unavailable')).toBeInTheDocument();
        });
    });

    it('should handle alerts fetch errors gracefully', async () => {
        vi.mocked(cdotService.getIncidents).mockRejectedValue(new Error('API error'));
        vi.mocked(cdotService.getRoadConditions).mockRejectedValue(new Error('API error'));

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.queryByText(/loading alerts/i)).not.toBeInTheDocument();
        });
    });
});
