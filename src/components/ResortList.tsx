import React, { useEffect, useState } from 'react';
import { getResorts } from '../services/resorts';
import type { Resort } from '../services/resorts';
import { Snowflake, Mountain } from 'lucide-react';
import { useRegion } from '../context/RegionContext';

export const ResortList: React.FC = () => {
    const { selectedRegion } = useRegion();
    const [resorts, setResorts] = useState<Resort[]>([]);
    const [sortBy, setSortBy] = useState<'snow' | 'name'>('snow');

    useEffect(() => {
        if (!selectedRegion) {
            setResorts([]);
            return;
        }

        getResorts(selectedRegion.id).then((data) => {
            // Resort service now handles filtering by region
            const sorted = [...data].sort((a, b) => b.snow24h - a.snow24h);
            setResorts(sorted);
        });
    }, [selectedRegion?.id]);

    if (!selectedRegion) {
        return null;
    }

    const handleSort = (type: 'snow' | 'name') => {
        setSortBy(type);
        const sorted = [...resorts].sort((a, b) => {
            if (type === 'snow') return b.snow24h - a.snow24h;
            return a.name.localeCompare(b.name);
        });
        setResorts(sorted);
    };

    return (
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
                {resorts.map((resort) => (
                    <div key={resort.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.25rem 0' }}>{resort.name}</h3>

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
    );
};
