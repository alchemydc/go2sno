import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CameraGrid } from '../CameraGrid';
import * as cdotService from '../../services/cdot';

vi.mock('../../services/cdot');

describe('CameraGrid', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should fetch and render cameras', async () => {
        const mockCameras = [
            { id: '1', name: 'Floyd Hill', url: 'https://example.com/camera1.jpg' },
            { id: '2', name: 'Eisenhower Tunnel', url: 'https://example.com/camera2.jpg' }
        ];

        vi.mocked(cdotService.getCameras).mockResolvedValue(mockCameras);

        render(<CameraGrid />);

        await waitFor(() => {
            expect(screen.getByText('Road Cameras')).toBeInTheDocument();
            expect(screen.getByText('Floyd Hill')).toBeInTheDocument();
            expect(screen.getByText('Eisenhower Tunnel')).toBeInTheDocument();
        });
    });

    it('should render camera images', async () => {
        const mockCameras = [
            { id: '1', name: 'Test Camera', url: 'https://example.com/test.jpg' }
        ];

        vi.mocked(cdotService.getCameras).mockResolvedValue(mockCameras);

        render(<CameraGrid />);

        await waitFor(() => {
            const img = screen.getByAltText('Test Camera');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', 'https://example.com/test.jpg');
        });
    });
});
