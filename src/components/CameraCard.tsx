import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';
import type { Camera } from '../services/cdot';

interface CameraCardProps {
    camera: Camera;
}

export const CameraCard: React.FC<CameraCardProps> = ({ camera }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const handleClick = () => {
        console.log('Camera clicked:', camera.name, 'URL:', camera.url);
        setIsPlaying(true);
    };

    useEffect(() => {
        if (!isPlaying || !videoRef.current) return;

        const video = videoRef.current;

        // Check if HLS is supported
        if (Hls.isSupported()) {
            console.log('HLS.js is supported, loading stream for:', camera.name);
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
            });

            hlsRef.current = hls;

            hls.loadSource(camera.url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed for:', camera.name);
                video.play().catch(e => {
                    console.error('Error playing video:', e);
                    setError('Failed to play stream');
                });
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    console.error('Fatal HLS error for', camera.name, ':', data);
                    if (data.details === 'manifestLoadTimeOut' || data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        setError('Connection timeout - stream server unreachable');
                    } else {
                        setError('Stream error');
                    }
                    hls.destroy();
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            console.log('Using native HLS for:', camera.name);
            video.src = camera.url;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => {
                    console.error('Error playing video:', e);
                    setError('Failed to play stream');
                });
            });
        } else {
            console.error('HLS not supported for:', camera.name);
            setError('HLS not supported in this browser');
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [isPlaying, camera.url, camera.name]);

    if (!isPlaying) {
        return (
            <div
                onClick={handleClick}
                style={{
                    position: 'relative',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                    borderRadius: 'var(--radius-md)',
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {camera.thumbnailUrl ? (
                    <>
                        <img
                            src={camera.thumbnailUrl}
                            alt={camera.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                        {/* Play button overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '50%',
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            pointerEvents: 'none'
                        }}>
                            <Play size={32} fill="white" />
                        </div>
                        {/* Camera name overlay */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            pointerEvents: 'none'
                        }}>
                            {camera.name}
                        </div>
                    </>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'white',
                        pointerEvents: 'none'
                    }}>
                        <Play size={32} />
                        <div style={{ fontSize: '0.875rem', textAlign: 'center', padding: '0 0.5rem' }}>
                            {camera.name}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                position: 'relative',
                aspectRatio: '16/9',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                color: 'white',
                textAlign: 'center'
            }}>
                <div>
                    <div style={{ marginBottom: '0.5rem' }}>Failed to load camera</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{camera.name}</div>
                    <button
                        onClick={() => {
                            setError(null);
                            setIsPlaying(false);
                        }}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #666',
                            background: '#333',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1a1a1a',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'relative',
                aspectRatio: '16/9',
                backgroundColor: '#000'
            }}>
                <video
                    ref={videoRef}
                    controls
                    muted
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>
            <div style={{
                padding: '0.5rem',
                fontSize: '0.875rem',
                color: 'white',
                borderTop: '1px solid #333'
            }}>
                {camera.name}
            </div>
        </div>
    );
};
