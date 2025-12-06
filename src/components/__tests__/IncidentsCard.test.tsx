import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentsCard } from '../IncidentsCard';

describe('IncidentsCard', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should render loading state', () => {
        render(<IncidentsCard incidents={[]} conditions={[]} loading={true} />);

        expect(screen.getByText(/loading alerts/i)).toBeInTheDocument();
    });

    it('should render empty state when no incidents or conditions', () => {
        render(<IncidentsCard incidents={[]} conditions={[]} loading={false} />);

        expect(screen.getByText('Travel Alerts')).toBeInTheDocument();
        expect(screen.getByText(/no active alerts/i)).toBeInTheDocument();
    });

    it('should render incidents', () => {
        const mockIncidents = [
            {
                id: '1',
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-105, 39] },
                properties: {
                    type: 'Accident',
                    startTime: '2025-12-05T10:00:00Z',
                    travelerInformationMessage: 'Vehicle accident on I-70',
                    routeName: 'I-70'
                }
            }
        ];

        render(<IncidentsCard incidents={mockIncidents} conditions={[]} loading={false} />);

        expect(screen.getByText('Accident')).toBeInTheDocument();
        expect(screen.getByText('Vehicle accident on I-70')).toBeInTheDocument();
    });

    it('should render road conditions', () => {
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
                        { conditionDescription: 'Icy conditions' }
                    ]
                }
            }
        ];

        render(<IncidentsCard incidents={[]} conditions={mockConditions} loading={false} />);

        expect(screen.getByText('I-70')).toBeInTheDocument();
        expect(screen.getByText('Icy conditions')).toBeInTheDocument();
    });
});
