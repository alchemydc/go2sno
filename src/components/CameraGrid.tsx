import React from 'react';
import type { Camera } from '../types/domain';
import { Video, AlertTriangle } from 'lucide-react';
import { CameraCard } from './CameraCard';

interface CameraGridProps {
    cameras: Camera[];
    loading?: boolean;
    error?: boolean;
}

export const CameraGrid: React.FC<CameraGridProps> = ({ cameras, loading = false, error = false }) => {
    if ((!cameras || cameras.length === 0) && !loading && !error) {
        return null; // Don't render if no cameras and not loading
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <Video size={24} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
                <h2 style={{ margin: 0 }}>Road Cameras</h2>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#6b7280' }}>
                    <div className="animate-spin" style={{
                        marginRight: '0.5rem',
                        border: '2px solid #e5e7eb',
                        borderTop: '2px solid var(--color-primary)',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px'
                    }}></div>
                    Loading cameras on route...
                </div>
            ) : error ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--color-text-muted)', gap: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    Unable to load cameras
                </div>
            ) : cameras.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No cameras found on this route
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {cameras.map((cam) => (
                        <CameraCard key={cam.id} camera={cam} />
                    ))}
                </div>
            )}
        </div>
    );
};
