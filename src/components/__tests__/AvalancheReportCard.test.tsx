import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AvalancheReportCard } from '../AvalancheReportCard';
import * as factoryService from '../../services/factory';

vi.mock('../../services/factory');

// Mock useRegion
vi.mock('../../context/RegionContext', () => ({
    useRegion: () => ({
        selectedRegion: {
            id: 'co',
            name: 'Colorado',
            resortIds: []
        },
        setRegionId: vi.fn()
    })
}));

describe('AvalancheReportCard', () => {
    const mockGetForecast = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();

        vi.mocked(factoryService.getAvalancheService).mockReturnValue({
            getForecast: mockGetForecast
        });
    });

    it('should render loading state initially', () => {
        mockGetForecast.mockImplementation(
            () => new Promise(() => { }) // Never resolves
        );

        render(<AvalancheReportCard destination="frisco" />);

        expect(screen.getByText(/loading avalanche report/i)).toBeInTheDocument();
    });

    it('should render forecast data correctly', async () => {
        const mockForecast = {
            zoneId: 'test-zone',
            zoneName: 'Vail & Summit County',
            dangerRating: 3,
            dangerRatingDisplay: 'Considerable',
            summary: 'Avalanche conditions are considerable today.',
            issueDate: '2025-12-05',
            url: 'https://avalanche.state.co.us/forecasts/test'
        };

        mockGetForecast.mockResolvedValue(mockForecast);

        render(<AvalancheReportCard destination="frisco" />);

        await waitFor(() => {
            expect(screen.getByText('Avalanche Report')).toBeInTheDocument();
            expect(screen.getByText('Vail & Summit County')).toBeInTheDocument();
            expect(screen.getByText('CONSIDERABLE')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
        });
    });

    it('should render nothing if forecast is null', async () => {
        mockGetForecast.mockResolvedValue(null);

        const { container } = render(<AvalancheReportCard destination="frisco" />);

        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        });
    });
});
