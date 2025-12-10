import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ResortList } from '../ResortList';
import * as resortsService from '../../services/resorts';
import { RegionProvider } from '../../context/RegionContext';

vi.mock('../../services/resorts');

// Mock useRegion
vi.mock('../../context/RegionContext', () => ({
    useRegion: () => ({
        selectedRegion: {
            id: 'co',
            name: 'Colorado',
            resortIds: ['copper', 'breck', 'abasin']
        },
        setRegionId: vi.fn()
    })
}));

describe('ResortList', () => {
    const mockResorts = [
        { id: 'copper', name: 'Copper Mountain', snow24h: 5, totalLifts: 24, lat: 39.5, lon: -106.1 },
        { id: 'breck', name: 'Breckenridge', snow24h: 8, totalLifts: 35, lat: 39.4, lon: -106.0 },
        { id: 'abasin', name: 'Arapahoe Basin', snow24h: 3, totalLifts: 9, lat: 39.6, lon: -105.8 }
    ];

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should fetch and render resorts', async () => {
        render(<ResortList resorts={mockResorts} />);

        await waitFor(() => {
            expect(screen.getByText('Resort Status')).toBeInTheDocument();
            expect(screen.getByText('Copper Mountain')).toBeInTheDocument();
            expect(screen.getByText('Breckenridge')).toBeInTheDocument();
            expect(screen.getByText('Arapahoe Basin')).toBeInTheDocument();
        });
    });

    it('should display snow information', async () => {
        render(<ResortList resorts={mockResorts} />);

        await waitFor(() => {
            expect(screen.getByText('5"')).toBeInTheDocument();
        });
    });

    it('should sort by snow by default (descending)', async () => {
        render(<ResortList resorts={mockResorts} />);

        await waitFor(() => {
            const resortNames = screen.getAllByRole('heading', { level: 3 });
            expect(resortNames[0]).toHaveTextContent('Breckenridge'); // 8"
            expect(resortNames[1]).toHaveTextContent('Copper Mountain'); // 5"
            expect(resortNames[2]).toHaveTextContent('Arapahoe Basin'); // 3"
        });
    });

    it('should sort by name when selected', async () => {
        render(<ResortList resorts={mockResorts} />);

        await waitFor(() => {
            expect(screen.getByText('Breckenridge')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'name' } });

        await waitFor(() => {
            const resortNames = screen.getAllByRole('heading', { level: 3 });
            expect(resortNames[0]).toHaveTextContent('Arapahoe Basin');
            expect(resortNames[1]).toHaveTextContent('Breckenridge');
            expect(resortNames[2]).toHaveTextContent('Copper Mountain');
        });
    });
});
