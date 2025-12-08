import React from 'react';
import type { Camera } from '../services/cdot';
import { Video } from 'lucide-react';
import { CameraCard } from './CameraCard';

interface CameraGridProps {
    cameras: Camera[];
}

export const CameraGrid: React.FC<CameraGridProps> = ({ cameras }) => {
    if (cameras.length === 0) {
        return null; // Don't render if no cameras
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <Video size={24} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
                <h2 style={{ margin: 0 }}>Road Cameras</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {cameras.map((cam) => (
                    <CameraCard key={cam.id} camera={cam} />
                ))}
            </div>
        </div>
    );
};
