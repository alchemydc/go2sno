'use client';

import { Dashboard } from '../components/Dashboard';
import { RegionProvider } from '../context/RegionContext';

export default function Home() {
    return (
        <RegionProvider>
            <Dashboard />
        </RegionProvider>
    );
}
