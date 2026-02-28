import React, { useEffect, useState } from 'react';
import type { Resort } from '../services/resorts';
import { Snowflake, Mountain, Loader2, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, CircleCheck, CircleX, Trees } from 'lucide-react';
import { useRegion } from '../context/RegionContext';
import { relativeTime } from '../utils/time';
import { LiftStatusOverlay } from './LiftStatusOverlay';
import { TerrainParkOverlay } from './TerrainParkOverlay';
import { EpicLogo, IkonLogo } from './PassLogos';

interface ResortListProps {
    resorts: Resort[];
    onSelect?: (resortId: string) => void;
    selectedResortId?: string;
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
    weather?: {
        tempCurrent: number;
        snow24h: number;
        reportedSnow24h?: number;
        calculatedSnow24h?: number;
        weatherDesc?: string;
    };
    debug?: any;
}

export const ResortList: React.FC<ResortListProps> = ({ resorts: initialResorts, onSelect, selectedResortId }) => {
    const { selectedRegion } = useRegion();
    const [sortedResorts, setSortedResorts] = useState<Resort[]>([]);
    const [sortBy, setSortBy] = useState<'snow' | 'name' | 'pass'>('snow');

    const [resortStatuses, setResortStatuses] = useState<Record<string, ResortData>>({});
    const [resortErrors, setResortErrors] = useState<Set<string>>(new Set());
    const [loadingStatuses, setLoadingStatuses] = useState(false);
    const [statusFetchedAt, setStatusFetchedAt] = useState<Date | null>(null);
    const [statusTimeDisplay, setStatusTimeDisplay] = useState('');
    const [activeResortId, setActiveResortId] = useState<string | null>(null);
    const [activeOverlay, setActiveOverlay] = useState<'lifts' | 'parks' | null>(null);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        if (!initialResorts.length) {
            setSortedResorts([]);
            return;
        }

        const sorted = [...initialResorts].sort((a, b) => {
            if (sortBy === 'snow') {
                // Use actual status data snow values instead of initial resort snow24h
                const snowA = resortStatuses[a.id]?.weather?.snow24h ?? a.snow24h;
                const snowB = resortStatuses[b.id]?.weather?.snow24h ?? b.snow24h;
                return snowB - snowA;
            }
            if (sortBy === 'pass') {
                const getScore = (r: Resort) => {
                    if (r.affiliation === 'ikon') return 3;
                    if (r.affiliation === 'epic') return 2;
                    return 1;
                };
                const scoreA = getScore(a);
                const scoreB = getScore(b);
                if (scoreA !== scoreB) return scoreB - scoreA;
                // Secondary sort by actual snow data
                const snowA = resortStatuses[a.id]?.weather?.snow24h ?? a.snow24h;
                const snowB = resortStatuses[b.id]?.weather?.snow24h ?? b.snow24h;
                return snowB - snowA;
            }
            return a.name.localeCompare(b.name);
        });
        setSortedResorts(sorted);
    }, [initialResorts, sortBy, resortStatuses]); // Added resortStatuses dependency

    useEffect(() => {
        const fetchStatuses = async () => {
            if (!initialResorts.length) return;

            setLoadingStatuses(true);

            // Fetch in parallel
            const promises = initialResorts.map(async (resort) => {
                try {
                    const res = await fetch(`/api/v1/resorts/${resort.id}/status`);
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
            const errors = new Set<string>();

            results.forEach((result, i) => {
                if (result) {
                    statusMap[result.id] = result.data;
                } else {
                    errors.add(initialResorts[i].id);
                }
            });

            setResortStatuses(statusMap);
            setResortErrors(errors);
            setLoadingStatuses(false);
            setStatusFetchedAt(new Date());
        };

        fetchStatuses();
    }, [initialResorts]);

    // Update relative time display every 60s
    useEffect(() => {
        const interval = setInterval(() => {
            if (statusFetchedAt) setStatusTimeDisplay(relativeTime(statusFetchedAt));
        }, 60_000);
        if (statusFetchedAt) setStatusTimeDisplay(relativeTime(statusFetchedAt));
        return () => clearInterval(interval);
    }, [statusFetchedAt]);

    const refreshStatuses = async () => {
        if (!initialResorts.length || loadingStatuses) return;
        setLoadingStatuses(true);
        const promises = initialResorts.map(async (resort) => {
            try {
                const res = await fetch(`/api/v1/resorts/${resort.id}/status`);
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
        const errors = new Set<string>();
        results.forEach((result, i) => {
            if (result) statusMap[result.id] = result.data;
            else errors.add(initialResorts[i].id);
        });
        setResortStatuses(statusMap);
        setResortErrors(errors);
        setLoadingStatuses(false);
        setStatusFetchedAt(new Date());
    };

    if (!selectedRegion) {
        return null;
    }

    const handleSort = (type: 'snow' | 'name' | 'pass') => {
        setSortBy(type);
    };

    const activeResortData = activeResortId ? resortStatuses[activeResortId] : null;

    // Collapse list when a resort is selected, expand when deselected
    useEffect(() => {
        setExpanded(!selectedResortId);
    }, [selectedResortId]);

    const displayedResorts = expanded || !selectedResortId
        ? sortedResorts
        : sortedResorts.filter(r => r.id === selectedResortId);

    return (
        <>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Mountain size={24} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
                        <h2 style={{ margin: 0 }}>Resort Status</h2>
                        {loadingStatuses && (
                            <span style={{ marginLeft: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <Loader2 size={14} className="animate-spin" />
                                Updating…
                            </span>
                        )}
                        {!loadingStatuses && statusTimeDisplay && (
                            <span style={{ marginLeft: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                {statusTimeDisplay}
                                <RefreshCw
                                    size={12}
                                    style={{ cursor: 'pointer' }}
                                    onClick={refreshStatuses}
                                    aria-label="Refresh resort statuses"
                                />
                            </span>
                        )}
                    </div>
                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value as 'snow' | 'name' | 'pass')}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ccc' }}
                        >
                            <option value="snow">Sort by Snow</option>
                            <option value="pass">Sort by Pass</option>
                            <option value="name">Sort by Name</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {displayedResorts.map((resort) => {
                        const statusData = resortStatuses[resort.id];
                        const hasLifts = statusData?.summary?.total > 0;
                        const hasParks = statusData?.summary?.parks && statusData.summary.parks.total > 0;

                        return (
                            <div
                                key={resort.id}
                                onClick={() => onSelect?.(resort.id)}
                                role="button"
                                tabIndex={0}
                                className={`resort-item ${onSelect ? 'clickable' : ''} ${resort.id === selectedResortId ? 'resort-item-selected' : ''}`}
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
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                                        {resort.name}
                                        {resortErrors.has(resort.id) && (
                                            <span title="Status unavailable" style={{ marginLeft: '0.4rem', verticalAlign: 'middle', display: 'inline-flex' }}>
                                                <AlertTriangle size={14} color="var(--color-warning)" />
                                            </span>
                                        )}
                                    </h3>

                                    {/* Status Badges - Vertical Stack for Consistency */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        {loadingStatuses && !statusData ? (
                                            <span className="skeleton" style={{ width: '100px', height: '20px' }} />
                                        ) : (
                                            <>
                                        {hasLifts && (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveResortId(resort.id);
                                                    setActiveOverlay('lifts');
                                                }}
                                                className={`status-badge ${statusData.summary.open > 0 ? 'status-badge-open' : 'status-badge-closed'}`}>
                                                {statusData.summary.open > 0 ? <CircleCheck size={12} /> : <CircleX size={12} />}
                                                {statusData.summary.open}/{statusData.summary.total} Lifts Open
                                            </span>
                                        )}
                                        {hasParks && statusData?.summary.parks && (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveResortId(resort.id);
                                                    setActiveOverlay('parks');
                                                }}
                                                className="status-badge status-badge-parks">
                                                <Trees size={12} />
                                                {statusData.summary.parks.open}/{statusData.summary.parks.total} Parks Open
                                            </span>
                                        )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="resort-item-stats">
                                    {loadingStatuses && !statusData ? (
                                        <span className="skeleton" style={{ width: '40px', height: '24px' }} />
                                    ) : (
                                    <div
                                        className="resort-item-snow"
                                        style={{
                                            cursor: statusData?.weather?.reportedSnow24h !== undefined &&
                                                statusData?.weather?.calculatedSnow24h !== undefined &&
                                                Math.abs((statusData.weather.reportedSnow24h || 0) - (statusData.weather.calculatedSnow24h || 0)) > 1
                                                ? 'help' : 'default',
                                            textDecoration: statusData?.weather?.reportedSnow24h !== undefined &&
                                                statusData?.weather?.calculatedSnow24h !== undefined &&
                                                Math.abs((statusData.weather.reportedSnow24h || 0) - (statusData.weather.calculatedSnow24h || 0)) > 1
                                                ? 'underline dotted' : 'none'
                                        }}
                                        title={
                                            statusData?.weather?.reportedSnow24h !== undefined &&
                                                statusData?.weather?.calculatedSnow24h !== undefined &&
                                                Math.abs((statusData.weather.reportedSnow24h || 0) - (statusData.weather.calculatedSnow24h || 0)) > 1
                                                ? `Resort Report: ${Math.round(statusData.weather.reportedSnow24h)}"
Open-Meteo Model: ${Math.round(statusData.weather.calculatedSnow24h)}"`
                                                : undefined
                                        }
                                    >
                                        <Snowflake size={20} style={{ marginRight: '0.25rem' }} />
                                        {Math.round(statusData?.weather?.snow24h ?? resort.snow24h)}"
                                    </div>
                                    )}
                                    {resort.temp !== undefined && (
                                        <div className="resort-item-temp">
                                            {resort.temp}°F
                                        </div>
                                    )}
                                    {resort.affiliation && (
                                        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                                            {resort.affiliation === 'epic' ? (
                                                <EpicLogo height={18} />
                                            ) : (
                                                <IkonLogo height={18} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {selectedResortId && sortedResorts.length > 1 && (
                    <button
                        onClick={() => setExpanded(prev => !prev)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            width: '100%',
                            marginTop: '0.75rem',
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            fontFamily: 'inherit'
                        }}
                    >
                        {expanded ? (
                            <><ChevronUp size={16} /> Collapse</>  
                        ) : (
                            <><ChevronDown size={16} /> Show all {sortedResorts.length} resorts</>
                        )}
                    </button>
                )}
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
                    parks={activeResortData.summary.parks.details || {}}
                    summary={{
                        open: activeResortData.summary.parks.open,
                        total: activeResortData.summary.parks.total
                    }}
                />
            )}
        </>
    );
};
