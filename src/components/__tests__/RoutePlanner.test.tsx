import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RoutePlanner } from '../RoutePlanner';

vi.mock('maplibre-gl');

describe('RoutePlanner', () => {
    const mockOnDestinationChange = vi.fn();
    const mockOnFromChange = vi.fn();
    const mockOnRouteUpdate = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch = vi.fn();
    });

    it('should render from and to selects', () => {
        render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
            />
        );

        expect(screen.getByText('Route Planner')).toBeInTheDocument();
        expect(screen.getByText('From')).toBeInTheDocument();
        expect(screen.getByText('To')).toBeInTheDocument();

        // Should have two select dropdowns
        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(2);
    });

    it('should call onFromChange when from selection changes', () => {
        render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
            />
        );

        const selects = screen.getAllByRole('combobox');
        const fromSelect = selects[0]; // First select is "From"
        fireEvent.change(fromSelect, { target: { value: 'denver' } });

        expect(mockOnFromChange).toHaveBeenCalledWith('denver');
    });

    it('should call onDestinationChange when to selection changes', () => {
        render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
            />
        );

        const selects = screen.getAllByRole('combobox');
        const toSelect = selects[1]; // Second select is "To"
        fireEvent.change(toSelect, { target: { value: 'vail' } });

        expect(mockOnDestinationChange).toHaveBeenCalledWith('vail');
    });

    it('should fetch and display route stats', async () => {
        const mockRouteData = {
            travelTimeInSeconds: 5400, // 1h 30m
            trafficDelayInSeconds: 600, // 10m
            coordinates: [[-105.27, 40.01], [-106.09, 39.57]]
        };

        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => mockRouteData
        } as Response);

        render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('1h 30m')).toBeInTheDocument();
            expect(screen.getByText('+10m')).toBeInTheDocument();
        });
    });

    it('should handle API errors gracefully', async () => {
        vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

        render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
            />
        );

        // Error state appears after the fetch fails
        await waitFor(() => {
            const errorElements = screen.getAllByText('Error');
            expect(errorElements.length).toBeGreaterThan(0);
        }, { timeout: 3000 });
    });

    it('should render incidents on map', () => {
        const mockIncidents = [
            {
                id: '1',
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-105, 39] },
                properties: {
                    type: 'Accident',
                    startTime: '2025-12-05T10:00:00Z',
                    travelerInformationMessage: 'Test incident',
                    routeName: 'I-70'
                }
            }
        ];

        const { container } = render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
                incidents={mockIncidents}
            />
        );

        // Map container should be rendered
        expect(container.querySelector('[style*="height: 400px"]')).toBeTruthy();
    });

    it('should render road conditions on map', () => {
        const mockConditions = [
            {
                id: '1',
                type: 'Feature',
                properties: {
                    type: 'RoadCondition',
                    routeName: 'I-70',
                    primaryLatitude: 39.5,
                    primaryLongitude: -105.5,
                    currentConditions: [
                        { conditionDescription: 'Icy' }
                    ]
                }
            }
        ];

        const { container } = render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
                conditions={mockConditions}
            />
        );

        // Map container should be rendered
        expect(container.querySelector('[style*="height: 400px"]')).toBeTruthy();
    });

    it('should display loading state initially', () => {
        render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
            />
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should call onRouteUpdate when route data is fetched', async () => {
        const mockRouteData = {
            travelTimeInSeconds: 3600,
            trafficDelayInSeconds: 300,
            coordinates: [[-105.27, 40.01], [-106.09, 39.57]]
        };

        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => mockRouteData
        } as Response);

        render(
            <RoutePlanner
                destination="frisco"
                onDestinationChange={mockOnDestinationChange}
                from="boulder"
                onFromChange={mockOnFromChange}
                onRouteUpdate={mockOnRouteUpdate}
            />
        );

        await waitFor(() => {
            expect(mockOnRouteUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'Feature',
                    geometry: expect.objectContaining({
                        type: 'LineString',
                        coordinates: mockRouteData.coordinates
                    })
                })
            );
        });
    });
});
