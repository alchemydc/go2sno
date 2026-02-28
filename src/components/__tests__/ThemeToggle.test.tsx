import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should render theme toggle button', () => {
        render(<ThemeToggle />);

        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toBeInTheDocument();
    });

    it('should default to light theme', () => {
        render(<ThemeToggle />);

        // Moon icon indicates light theme (can toggle to dark)
        expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('should read saved theme from localStorage', () => {
        localStorage.setItem('theme', 'dark');

        render(<ThemeToggle />);

        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should toggle theme on click', () => {
        render(<ThemeToggle />);

        const button = screen.getByRole('button');

        // Initially light
        expect(document.documentElement.getAttribute('data-theme')).toBeNull();

        // Click to toggle to dark
        fireEvent.click(button);
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');

        // Click to toggle back to light
        fireEvent.click(button);
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should respect prefers-color-scheme when no saved theme', () => {
        const mockMatchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-color-scheme: dark)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        render(<ThemeToggle />);

        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
});
