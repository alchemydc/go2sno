
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiftStatusOverlay } from './LiftStatusOverlay';
import React from 'react';

// Mock Lucide icons to avoid rendering issues in test environment if any
// (Though typically they render fine as SVGs)

describe('LiftStatusOverlay', () => {
    const mockLifts = {
        'Lift A': 'open',
        'Lift B': 'closed',
        'Lift C': 'scheduled'
    };

    const mockSummary = {
        open: 1,
        total: 3,
        percentOpen: 33
    };

    it('should not render when isOpen is false', () => {
        render(
            <LiftStatusOverlay
                isOpen={false}
                onClose={() => { }}
                resortName="Park City"
                lifts={mockLifts}
                summary={mockSummary}
            />
        );
        expect(screen.queryByText('Park City Lifts')).toBeNull();
    });

    it('should render correct content when isOpen is true', () => {
        render(
            <LiftStatusOverlay
                isOpen={true}
                onClose={() => { }}
                resortName="Park City"
                lifts={mockLifts}
                summary={mockSummary}
            />
        );

        expect(screen.getByText('Park City Lifts')).toBeDefined();
        expect(screen.getByText('1/3 Lifts Open (33%)')).toBeDefined();

        // Check for lift names
        expect(screen.getByText('Lift A')).toBeDefined();
        expect(screen.getByText('Lift B')).toBeDefined();
        expect(screen.getByText('Lift C')).toBeDefined();

        // Check for section headers (capitalized)
        expect(screen.getByText('Open')).toBeDefined();
        expect(screen.getByText('Closed')).toBeDefined();
        expect(screen.getByText('Scheduled')).toBeDefined();
    });

    it('should call onClose when close button is clicked', () => {
        const onCloseSpy = vi.fn();
        render(
            <LiftStatusOverlay
                isOpen={true}
                onClose={onCloseSpy}
                resortName="Park City"
                lifts={mockLifts}
                summary={mockSummary}
            />
        );

        const closeButtons = screen.getAllByRole('button');
        // Likely the first button or specifically looking for the X icon button
        // The component has one main button header.
        fireEvent.click(closeButtons[0]);

        expect(onCloseSpy).toHaveBeenCalled();
    });
});
