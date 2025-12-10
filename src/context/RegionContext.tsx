'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Region, getRegion, DEFAULT_REGION_ID } from '../config/regions';

interface RegionContextType {
    selectedRegion: Region | undefined;
    setRegionId: (regionId: string) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const STORAGE_KEY = 'go2snow_selected_region';

export function RegionProvider({ children }: { children: ReactNode }) {
    const [regionId, setRegionIdState] = useState<string>('');
    const selectedRegion = regionId ? getRegion(regionId) : undefined;

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setRegionIdState(stored);
        }
    }, []);

    const setRegionId = (newRegionId: string) => {
        setRegionIdState(newRegionId);
        if (newRegionId) {
            localStorage.setItem(STORAGE_KEY, newRegionId);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    return (
        <RegionContext.Provider value={{ selectedRegion, setRegionId }}>
            {children}
        </RegionContext.Provider>
    );
}

export function useRegion(): RegionContextType {
    const context = useContext(RegionContext);
    if (!context) {
        throw new Error('useRegion must be used within a RegionProvider');
    }
    return context;
}
