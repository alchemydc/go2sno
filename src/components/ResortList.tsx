import React, { useEffect, useState } from 'react';
import type { Resort } from '../services/resorts';
import { Snowflake, Mountain } from 'lucide-react';
import { useRegion } from '../context/RegionContext';
import { LiftStatusOverlay } from './LiftStatusOverlay';
import { TerrainParkOverlay } from './TerrainParkOverlay';

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
        parks?: {
            open: number;
            total: number;
            details: Record<string, string>;
        };
    };
    debug?: any;
}

export const ResortList: React.FC<ResortListProps> = ({ resorts: initialResorts, onSelect }) => {
    const { selectedRegion } = useRegion();
    const [sortedResorts, setSortedResorts] = useState<Resort[]>([]);
    const [sortBy, setSortBy] = useState<'snow' | 'name'>('snow');

    const [resortStatuses, setResortStatuses] = useState<Record<string, ResortData>>({});
    const [activeResortId, setActiveResortId] = useState<string | null>(null);
    const [activeOverlay, setActiveOverlay] = useState<'lifts' | 'parks' | null>(null);

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
        const fetchStatuses = async () => {
            if (!initialResorts.length) return;

            // Fetch in parallel
            const promises = initialResorts.map(async (resort) => {
                try {
                    const res = await fetch(`/api/resort-status/${resort.id}`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    return { id: resort.id, data };
                } catch (err) {
                    console.error(`Failed to fetch status for ${resort.id}`, err);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const statusMap: Record<string, ResortData> = {};

            results.forEach(result => {
                if (result) {
                    statusMap[result.id] = result.data;
                }
            });

            setResortStatuses(statusMap);
        };

        fetchStatuses();
    }, [initialResorts]);

    if (!selectedRegion) {
        return null;
    }

    const handleSort = (type: 'snow' | 'name') => {
        setSortBy(type);
    };

    const activeResortData = activeResortId ? resortStatuses[activeResortId] : null;

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
                    {sortedResorts.map((resort) => {
                        const statusData = resortStatuses[resort.id];
                        const hasLifts = statusData?.summary?.total > 0;
                        const hasParks = statusData?.summary?.parks && statusData.summary.parks.total > 0;

                        return (
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

                                    {/* Status Badges */}
                                    <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {hasLifts && (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveResortId(resort.id);
                                                    setActiveOverlay('lifts');
                                                }}
                                                style={{
                                                    backgroundColor: statusData.summary.open > 0 ? '#e6f4ea' : '#fce8e6',
                                                    color: statusData.summary.open > 0 ? '#137333' : '#c5221f',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: 'pointer'
                                                }}>
                                                {statusData.summary.open}/{statusData.summary.total} Lifts Open
                                                <span style={{ fontSize: '0.7em' }}>ℹ️</span>
                                            </span>
                                        )}
                                        {hasParks && statusData?.summary.parks && (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveResortId(resort.id);
                                                    setActiveOverlay('parks');
                                                }}
                                                style={{
                                                    backgroundColor: '#f1f3f4',
                                                    color: '#3c4043',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginLeft: '4px',
                                                    cursor: 'pointer'
                                                }}>
                                                {statusData.summary.parks.open}/{statusData.summary.parks.total} Parks Open
                                                <span style={{ fontSize: '0.7em', marginLeft: '4px' }}>ℹ️</span>
                                            </span>
                                        )}
                                    </div>
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
                        );
                    })}
                </div>
            </div>

            {activeResortData && activeOverlay === 'lifts' && (
                <LiftStatusOverlay
                    isOpen={true}
                    onClose={() => { setActiveOverlay(null); setActiveResortId(null); }}
                    resortName={initialResorts.find(r => r.id === activeResortId)?.name || 'Resort'}
                    lifts={activeResortData.lifts}
                    summary={activeResortData.summary}
                />
            )}

            {activeResortData && activeOverlay === 'parks' && activeResortData.summary.parks && (
                <TerrainParkOverlay
                    isOpen={true}
                    onClose={() => { setActiveOverlay(null); setActiveResortId(null); }}
                    resortName={initialResorts.find(r => r.id === activeResortId)?.name || 'Resort'}
                    parks={activeResortData.summary.parks.details}
                    summary={{
                        open: activeResortData.summary.parks.open,
                        total: activeResortData.summary.parks.total
                    }}
                />
            )}
        </>
    );
};
