'use client';

import React from 'react';
import { useRegion } from '../context/RegionContext';
import { getAllRegions } from '../config/regions';

export const ResponsiveHeaderSelector: React.FC = () => {
    const { selectedRegion, setRegionId } = useRegion();
    const regions = getAllRegions();

    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRegionId(e.target.value);
    };

    return (
        <div className="region-selector">
            <label htmlFor="region-select" className="sr-only">
                Select Region
            </label>
            <select
                id="region-select"
                value={selectedRegion.id}
                onChange={handleRegionChange}
                className="region-select"
            >
                {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                        {region.displayName}
                    </option>
                ))}
            </select>
            <style jsx>{`
                .region-selector {
                    display: flex;
                    align-items: center;
                }

                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border-width: 0;
                }

                .region-select {
                    padding: 8px 32px 8px 12px;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text);
                    background-color: var(--card-bg);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                }

                .region-select:hover {
                    border-color: var(--primary);
                }

                .region-select:focus {
                    outline: 2px solid var(--primary);
                    outline-offset: 2px;
                }

                @media (max-width: 640px) {
                    .region-select {
                        font-size: 13px;
                        padding: 6px 28px 6px 10px;
                    }
                }
            `}</style>
        </div>
    );
};
