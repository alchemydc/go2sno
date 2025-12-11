import React, { useEffect, useState } from 'react';
import { getResorts } from '../services/resorts';
import type { Resort } from '../services/resorts';
import { Snowflake, Mountain } from 'lucide-react';
import { useRegion } from '../context/RegionContext';
import { LiftStatusOverlay } from './LiftStatusOverlay';

interface ResortListProps {
    resorts: Resort[];
    onSelect?: (resortId: string) => void;
}

interface ResortData {
    resort: string;
    timestamp: string;
    lifts: Record<string, string>;
    summary: {
        open: number;
        total: number;
        percentOpen: number;
    };
    debug?: any;
}

export const ResortList: React.FC<ResortListProps> = ({ resorts: initialResorts, onSelect }) => {
    const { selectedRegion } = useRegion();
    const [sortedResorts, setSortedResorts] = useState<Resort[]>([]);
    const [sortBy, setSortBy] = useState<'snow' | 'name'>('snow');

    const [pcData, setPcData] = useState<ResortData | null>(null);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);

    useEffect(() => {
        if (!initialResorts.length) {
            setSortedResorts([]);
            return;
        }

        const sorted = [...initialResorts].sort((a, b) => {
            if (sortBy === 'snow') return b.snow24h - a.snow24h;
            return a.name.localeCompare(b.name);
        });
        setSortedResorts(sorted);
    }, [initialResorts, sortBy]);

    useEffect(() => {
        // Ideally we would map resort IDs to API endpoints, but for MVP we hardcode Park City
        fetch('/api/resort-status/park-city')
            .then((res) => res.json())
            .then((data) => {
                // @ts-ignore
                if (data.summary) {
                    setPcData(data as ResortData);
                }
                if (data.debug) {
                    console.log('[DEBUG] Park City Status:', data);
                }
            })
            .catch((err) => console.error('Failed to fetch Park City status', err));
    }, []);

    if (!selectedRegion) {
        return null;
    }

    const handleSort = (type: 'snow' | 'name') => {
        setSortBy(type);
    };

    return (
        <>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Mountain size={24} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
                        <h2 style={{ margin: 0 }}>Resort Status</h2>
                    </div>
                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value as 'snow' | 'name')}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ccc' }}
                        >
                            <option value="snow">Sort by Snow</option>
                            <option value="name">Sort by Name</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sortedResorts.map((resort) => (
                        <div
                            key={resort.id}
                            onClick={() => onSelect?.(resort.id)}
                            role="button"
                            tabIndex={0}
                            className={`resort-item ${onSelect ? 'clickable' : ''}`}
                            style={{
                                cursor: onSelect ? 'pointer' : 'default'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    onSelect?.(resort.id);
                                }
                            }}
                        >
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0' }}>{resort.name}</h3>
                                {resort.name === 'Park City' && pcData && (
                                    <div
                                        style={{ fontSize: '0.8rem', color: '#555', display: 'flex', gap: '0.5rem', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsOverlayOpen(true);
                                        }}
                                        title="Click for details"
                                    >
                                        <span style={{
                                            backgroundColor: pcData.summary.open > 0 ? '#e6f4ea' : '#fce8e6',
                                            color: pcData.summary.open > 0 ? '#137333' : '#c5221f',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {pcData.summary.open}/{pcData.summary.total} Lifts Open
                                            <span style={{ fontSize: '0.7em' }}>ℹ️</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 'bold', justifyContent: 'flex-end' }}>
                                    <Snowflake size={20} style={{ marginRight: '0.25rem' }} />
                                    {resort.snow24h}"
                                </div>
                                {resort.temp !== undefined && (
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                        {resort.temp}°F
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {pcData && (
                <LiftStatusOverlay
                    isOpen={isOverlayOpen}
                    onClose={() => setIsOverlayOpen(false)}
                    resortName="Park City Mountain"
                    lifts={pcData.lifts}
                    summary={pcData.summary}
                />
            )}
        </>
    );
};
