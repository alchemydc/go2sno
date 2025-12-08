import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CameraGrid } from '../CameraGrid';

describe('CameraGrid', () => {
    it('should not render if no cameras provided', () => {
        const { container } = render(<CameraGrid cameras={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render camera cards when cameras provided', () => {
        const mockCameras = [
            { id: '1', name: 'Floyd Hill', url: 'https://example.com/camera1.m3u8', latitude: 39.7, longitude: -105.5 },
            { id: '2', name: 'Eisenhower Tunnel', url: 'https://example.com/camera2.m3u8', latitude: 39.6, longitude: -105.9 }
        ];

        render(<CameraGrid cameras={mockCameras} />);

        expect(screen.getByText('Road Cameras')).toBeInTheDocument();
        expect(screen.getByText('Floyd Hill')).toBeInTheDocument();
        expect(screen.getByText('Eisenhower Tunnel')).toBeInTheDocument();
    });
});
