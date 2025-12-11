import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerrainParkOverlay } from './TerrainParkOverlay';
import React from 'react';

describe('TerrainParkOverlay', () => {
    const mockParks = {
        'Park A': 'open',
        'Park B': 'closed'
    };

    const mockSummary = {
        open: 1,
        total: 2
    };

    it('should not render when isOpen is false', () => {
        render(
            <TerrainParkOverlay
                isOpen={false}
                onClose={() => { }}
                resortName="Park City"
                parks={mockParks}
                summary={mockSummary}
            />
        );
        expect(screen.queryByText('Park City Terrain Parks')).toBeNull();
    });

    it('should render correct content when isOpen is true', () => {
        render(
            <TerrainParkOverlay
                isOpen={true}
                onClose={() => { }}
                resortName="Park City"
                parks={mockParks}
                summary={mockSummary}
            />
        );

        expect(screen.getByText('Park City Terrain Parks')).toBeDefined();
        // 1/2 = 50%
        expect(screen.getByText('1/2 Parks Open (50%)')).toBeDefined();

        // Check for park names
        expect(screen.getByText('Park A')).toBeDefined();
        expect(screen.getByText('Park B')).toBeDefined();

        // Check for section headers
        expect(screen.getByText('Open')).toBeDefined();
        expect(screen.getByText('Closed')).toBeDefined();
    });

    it('should call onClose when close button is clicked', () => {
        const onCloseSpy = vi.fn();
        render(
            <TerrainParkOverlay
                isOpen={true}
                onClose={onCloseSpy}
                resortName="Park City"
                parks={mockParks}
                summary={mockSummary}
            />
        );

        const closeButtons = screen.getAllByRole('button');
        fireEvent.click(closeButtons[0]);

        expect(onCloseSpy).toHaveBeenCalled();
    });
});
