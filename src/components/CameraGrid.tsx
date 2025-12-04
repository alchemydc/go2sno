import React, { useEffect, useState } from 'react';
import { getCameras } from '../services/cdot';
import type { Camera } from '../services/cdot';
import { Video } from 'lucide-react';

export const CameraGrid: React.FC = () => {
    const [cameras, setCameras] = useState<Camera[]>([]);

    useEffect(() => {
        getCameras().then(setCameras);
    }, []);

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <Video size={24} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
                <h2 style={{ margin: 0 }}>Road Cameras</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {cameras.map((cam) => (
                    <div key={cam.id} style={{ position: 'relative' }}>
                        <img
                            src={cam.url}
                            alt={cam.name}
                            style={{ width: '100%', borderRadius: 'var(--radius-md)', display: 'block' }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            borderBottomLeftRadius: 'var(--radius-md)',
                            borderBottomRightRadius: 'var(--radius-md)'
                        }}>
                            {cam.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
