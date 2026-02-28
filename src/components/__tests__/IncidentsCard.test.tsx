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
                type: 'Accident',
                description: 'Test incident detected',
                startTime: '2025-12-05T10:00:00Z',
                location: { lat: 39, lon: -105 },
                routeName: 'I-70'
            }
        ];

        render(<IncidentsCard incidents={mockIncidents} conditions={[]} loading={false} />);

        expect(screen.getByText('Accident')).toBeInTheDocument();
        expect(screen.getByText('Test incident detected')).toBeInTheDocument();
    });

    it('should render road conditions', () => {
        const mockConditions = [
            {
                id: '1',
                type: 'RoadCondition',
                status: 'Icy',
                description: 'Icy conditions',
                location: { lat: 39.5, lon: -105.5 },
                routeName: 'I-70'
            }
        ];

        render(<IncidentsCard incidents={[]} conditions={mockConditions} loading={false} />);

        expect(screen.getByText('I-70')).toBeInTheDocument();
        expect(screen.getByText('Icy conditions')).toBeInTheDocument();
    });
});
