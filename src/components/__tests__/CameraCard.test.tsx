import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraCard } from '../CameraCard';
import type { Camera } from '../../services/cdot';

vi.mock('hls.js', () => {
    return {
        default: class Hls {
            static isSupported = vi.fn(() => true);
            static Events = {
                MANIFEST_PARSED: 'hlsManifestParsed',
                ERROR: 'hlsError'
            };
            static ErrorTypes = {
                NETWORK_ERROR: 'networkError'
            };

            loadSource = vi.fn();
            attachMedia = vi.fn();
            on = vi.fn();
            destroy = vi.fn();
        }
    };
});

describe('CameraCard', () => {
    const mockCamera: Camera = {
        id: '123',
        name: 'Test Camera',
        url: 'https://publicstreamer1.cotrip.org/rtplive/test/playlist.m3u8',
        thumbnailUrl: 'https://cocam.carsprogram.org/Snapshots/test.png',
        latitude: 39.5,
        longitude: -105.5
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should render thumbnail image when not playing', () => {
        render(<CameraCard camera={mockCamera} />);

        const thumbnail = screen.getByAltText('Test Camera');
        expect(thumbnail).toBeInTheDocument();
        expect(thumbnail).toHaveAttribute('src', mockCamera.thumbnailUrl);
    });

    it('should display camera name', () => {
        render(<CameraCard camera={mockCamera} />);

        expect(screen.getByText('Test Camera')).toBeInTheDocument();
    });

    it('should show play button overlay on thumbnail', () => {
        const { container } = render(<CameraCard camera={mockCamera} />);

        // Play icon should be visible
        const playIcon = container.querySelector('svg');
        expect(playIcon).toBeInTheDocument();
    });

    it('should change to playing state when clicked', () => {
        const { container } = render(<CameraCard camera={mockCamera} />);

        const card = container.firstChild as HTMLElement;
        fireEvent.click(card);

        // After click, video element should be rendered
        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
    });

    it('should render placeholder if no thumbnail URL', () => {
        const cameraWithoutThumbnail: Camera = {
            ...mockCamera,
            thumbnailUrl: undefined
        };

        render(<CameraCard camera={cameraWithoutThumbnail} />);

        // Should still show camera name
        expect(screen.getByText('Test Camera')).toBeInTheDocument();

        // Should not have an img element
        expect(screen.queryByAltText('Test Camera')).not.toBeInTheDocument();
    });

    it('should display camera name in both thumbnail and video states', () => {
        const { container, rerender } = render(<CameraCard camera={mockCamera} />);

        // Check name in thumbnail state
        expect(screen.getByText('Test Camera')).toBeInTheDocument();

        // Click to switch to video state
        const card = container.firstChild as HTMLElement;
        fireEvent.click(card);

        // Re-render and check name still appears
        rerender(<CameraCard camera={mockCamera} />);
        expect(screen.getAllByText('Test Camera').length).toBeGreaterThan(0);
    });
});
