import React, { useEffect, useState } from 'react';
import { RoutePlanner, locations } from './RoutePlanner';
import { CameraGrid } from './CameraGrid';
import { ResortList } from './ResortList';
import { IncidentsCard } from './IncidentsCard';
import { getWeather } from '../services/weather';
import type { WeatherForecast } from '../services/weather';
import { CloudSun } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Dashboard: React.FC = () => {
    const [weather, setWeather] = useState<WeatherForecast | null>(null);
    const [destination, setDestination] = useState('leadville');

    useEffect(() => {
        // Get coordinates for selected destination
        const coords = locations[destination];
        if (coords) {
            const [lat, lon] = coords.split(',').map(Number);
            getWeather(lat, lon).then(setWeather);
        }
    }, [destination]);

    // Format destination name for display (capitalize first letter)
    const destinationName = destination.charAt(0).toUpperCase() + destination.slice(1);

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', marginBottom: '0.5rem', margin: 0 }}>Colorado Snow Go</h1>
                    <p style={{ color: '#6b7280', fontSize: '1.125rem', margin: 0 }}>Real-time I-70 road conditions and resort status.</p>
                </div>
                <ThemeToggle />
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Main Column: Route & Cameras */}
                <div style={{ gridColumn: 'span 2' }}>
                    <RoutePlanner destination={destination} onDestinationChange={setDestination} />

                    <CameraGrid />
                </div>

                {/* Sidebar: Weather & Resorts */}
                <div>
                    {/* Weather Card */}
                    <div className="card" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #1e40af)', color: 'white', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <CloudSun size={24} style={{ marginRight: '0.5rem' }} />
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{destinationName} Weather</h2>
                        </div>
                        {weather ? (
                            <div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{weather.temperature}°F</div>
                                <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{weather.shortForecast}</div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Wind: {weather.windSpeed}</div>
                            </div>
                        ) : (
                            <div>Loading weather...</div>
                        )}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <IncidentsCard />
                    </div>

                    <ResortList />
                </div>

            </div>
        </div>
    );
};
