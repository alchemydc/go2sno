import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Navigation } from 'lucide-react';

interface RouteStats {
    travelTime: string;
    delay: string;
    summitTemp: string;
    newSnow: string;
}



// Coordinates for locations
export const locations: Record<string, string> = {
    boulder: '40.0150,-105.2705',
    denver: '39.7392,-104.9903',
    frisco: '39.5744,-106.0975',
    vail: '39.6403,-106.3742',
    winterpark: '39.8917,-105.7631',
    leadville: '39.2508,-106.2925'
};

interface RoutePlannerProps {
    destination: string;
    onDestinationChange: (destination: string) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({ destination, onDestinationChange }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [from, setFrom] = useState('boulder');
    // destination is now controlled by parent
    const [stats, setStats] = useState<RouteStats>({
        travelTime: 'Loading...',
        delay: '-',
        summitTemp: '-',
        newSnow: '-'
    });

    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setStats(prev => ({ ...prev, travelTime: 'Loading...', delay: '-' }));

            try {
                const originCoords = locations[from];
                const destCoords = locations[destination];

                const response = await fetch(`/api/route?origin=${originCoords}&destination=${destCoords}`);
                const data = await response.json();

                if (data.travelTimeInSeconds) {
                    const hours = Math.floor(data.travelTimeInSeconds / 3600);
                    const minutes = Math.floor((data.travelTimeInSeconds % 3600) / 60);

                    const delayMinutes = Math.floor(data.trafficDelayInSeconds / 60);

                    setStats(prev => ({
                        ...prev,
                        travelTime: `${hours}h ${minutes}m`,
                        delay: delayMinutes > 0 ? `+${delayMinutes}m` : 'None'
                    }));
                }

                if (data.coordinates) {
                    const geojson = {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: data.coordinates
                        }
                    };
                    setRouteGeoJSON(geojson);
                }
            } catch (error) {
                console.error('Failed to fetch route stats:', error);
                setStats(prev => ({ ...prev, travelTime: 'Error', delay: 'Error' }));
            }
        };

        fetchStats();
    }, [from, destination]);

    // Update map with route
    useEffect(() => {
        if (!map.current || !routeGeoJSON) return;

        const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
            source.setData(routeGeoJSON);
        } else {
            // Wait for style to load if needed, but usually safe if map exists
            if (map.current.isStyleLoaded()) {
                addRouteLayer();
            } else {
                map.current.once('load', addRouteLayer);
            }
        }

        function addRouteLayer() {
            if (!map.current || map.current.getSource('route')) return;

            map.current.addSource('route', {
                type: 'geojson',
                data: routeGeoJSON
            });

            map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#2563eb',
                    'line-width': 5,
                    'line-opacity': 0.8
                }
            });
        }

        // Fit bounds
        const coordinates = routeGeoJSON.geometry.coordinates;
        const bounds = coordinates.reduce((bounds: maplibregl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord as [number, number]);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
            padding: 50
        });

    }, [routeGeoJSON]);

    useEffect(() => {
        if (map.current) return; // initialize map only once

        if (mapContainer.current) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        'osm': {
                            type: 'raster',
                            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                            tileSize: 256,
                            attribution: '&copy; OpenStreetMap Contributors',
                        }
                    },
                    layers: [
                        {
                            id: 'osm',
                            type: 'raster',
                            source: 'osm',
                            minzoom: 0,
                            maxzoom: 19,
                        }
                    ]
                },
                center: [-105.6, 39.7], // Center roughly between Denver and Frisco
                zoom: 8
            });

            map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

            map.current.on('load', () => {
                // Map loaded
            });
        }
    }, []);

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <Navigation size={24} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
                <h2 style={{ margin: 0 }}>Route Planner</h2>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>From</label>
                    <select
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ccc' }}
                    >
                        <option value="boulder" disabled={destination === 'boulder'}>Boulder</option>
                        <option value="denver" disabled={destination === 'denver'}>Denver</option>
                        <option value="leadville" disabled={destination === 'leadville'}>Leadville</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>To</label>
                    <select
                        value={destination}
                        onChange={(e) => onDestinationChange(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ccc' }}
                    >
                        <option value="frisco" disabled={from === 'frisco'}>Frisco</option>
                        <option value="vail" disabled={from === 'vail'}>Vail</option>
                        <option value="winterpark" disabled={from === 'winterpark'}>Winter Park</option>
                        <option value="leadville" disabled={from === 'leadville'}>Leadville</option>
                        <option value="boulder" disabled={from === 'boulder'}>Boulder</option>
                    </select>
                </div>
            </div>

            {/* Stats Card */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#f3f4f6',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
            }}>
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{stats.travelTime}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Travel Time</div>
                </div>
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: stats.delay === 'None' ? '#059669' : '#dc2626' }}>{stats.delay}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Delay</div>
                </div>
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{stats.summitTemp}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Summit</div>
                </div>
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.newSnow}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Snowfall</div>
                </div>
            </div>

            <div ref={mapContainer} style={{ width: '100%', height: '400px', borderRadius: 'var(--radius-md)' }} />
        </div>
    );
};
