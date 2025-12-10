import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AvalancheReportCard } from './AvalancheReportCard';
import { logger } from '../utils/logger';
import { Navigation } from 'lucide-react';
import { Region } from '../config/regions';

interface RouteStats {
    travelTime: string;
    delay: string;
}

// Coordinates for locations
// This is now passed as a prop from the Dashboard which gets it from the RegionContext

import { Incident, RoadCondition } from '../services/cdot';

export interface LocationOption {
    id: string;
    name: string;
    coordinates: string;
    type: 'gateway' | 'resort' | 'town';
}

interface RoutePlannerProps {
    locations: Record<string, string>; // ID -> coordinates mapping
    locationOptions: LocationOption[]; // Full location data for dropdowns
    destination: string;
    onDestinationChange: (destination: string) => void;
    from: string;
    onFromChange: (from: string) => void;
    onRouteUpdate: (geojson: any) => void;
    incidents?: Incident[];
    conditions?: RoadCondition[];
    regions: Region[];
    selectedRegionId: string;
    onRegionChange: (regionId: string) => void;
    snowForecast?: number;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
    locations,
    locationOptions,
    destination,
    onDestinationChange,
    from,
    onFromChange,
    onRouteUpdate,
    incidents = [],
    conditions = [],
    regions,
    selectedRegionId,
    onRegionChange,
    snowForecast
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    // from is now controlled by parent
    // destination is now controlled by parent
    const [stats, setStats] = useState<RouteStats>({
        travelTime: '-',
        delay: '-'
    });

    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!from || !destination) {
                setStats({
                    travelTime: '-',
                    delay: '-'
                });
                setRouteGeoJSON(null);
                onRouteUpdate(null);
                return;
            }

            setStats(prev => ({ ...prev, travelTime: 'Loading...', delay: '-' }));

            try {
                const originCoords = locations[from];
                const destCoords = locations[destination];

                if (!originCoords || !destCoords) return;

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
                    onRouteUpdate(geojson);
                }
            } catch (error) {
                logger.error('Failed to fetch route stats:', error);
                setStats(prev => ({ ...prev, travelTime: 'Error', delay: 'Error' }));
            }
        };

        fetchStats();
    }, [from, destination]);

    // Update map with route and alerts
    useEffect(() => {
        if (!map.current) return;

        logger.debug('RoutePlanner: Effect triggered');
        logger.debug('RoutePlanner: Incidents count:', incidents.length);
        logger.debug('RoutePlanner: Conditions count:', conditions.length);

        const updateLayers = () => {
            if (!map.current) return;
            // @ts-ignore
            logger.debug(`RoutePlanner: Updating layers for map instance ${map.current._id}`);

            // Route Layer
            if (routeGeoJSON) {
                const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
                if (source) {
                    source.setData(routeGeoJSON);
                } else {
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
                        // TODO: color coding of traffic delays on route
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
            } else {
                if (map.current.getLayer('route')) {
                    map.current.removeLayer('route');
                }
                if (map.current.getSource('route')) {
                    map.current.removeSource('route');
                }
            }

            // Incidents Layer
            const incidentsGeoJSON: any = {
                type: 'FeatureCollection',
                features: incidents.map(incident => ({
                    type: 'Feature',
                    geometry: incident.geometry,
                    properties: {
                        type: incident.properties.type || 'Incident',
                        description: incident.properties.travelerInformationMessage || incident.properties.type || 'Road incident reported'
                    }
                }))
            };

            const incidentsSource = map.current.getSource('incidents') as maplibregl.GeoJSONSource;

            if (incidentsSource) {
                incidentsSource.setData(incidentsGeoJSON);
            } else {
                map.current.addSource('incidents', {
                    type: 'geojson',
                    data: incidentsGeoJSON
                });
                map.current.addLayer({
                    id: 'incidents',
                    type: 'circle',
                    source: 'incidents',
                    paint: {
                        'circle-radius': 8,
                        'circle-color': '#ef4444', // Red
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#ffffff'
                    }
                });
            }

            // Conditions Layer
            const conditionsGeoJSON: any = {
                type: 'FeatureCollection',
                features: conditions.map(condition => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [condition.properties.primaryLongitude, condition.properties.primaryLatitude]
                    },
                    properties: {
                        description: condition.properties.currentConditions?.map(c => c.conditionDescription).join(', ') ||
                            condition.properties.routeName ||
                            'Road condition reported'
                    }
                }))
            };

            const conditionsSource = map.current.getSource('conditions') as maplibregl.GeoJSONSource;

            if (conditionsSource) {
                conditionsSource.setData(conditionsGeoJSON);
            } else {
                map.current.addSource('conditions', {
                    type: 'geojson',
                    data: conditionsGeoJSON
                });
                map.current.addLayer({
                    id: 'conditions',
                    type: 'circle',
                    source: 'conditions',
                    paint: {
                        'circle-radius': 6,
                        'circle-color': '#f59e0b', // Orange
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#ffffff'
                    }
                });
            }
        };

        // Always update layers when dependencies change, but ensure map is ready
        const executeUpdate = () => {
            if (!map.current) return;

            if (map.current.isStyleLoaded()) {
                updateLayers();
            } else {
                // Use a small timeout to wait for style to load
                const checkStyle = setInterval(() => {
                    if (map.current && map.current.isStyleLoaded()) {
                        clearInterval(checkStyle);
                        updateLayers();
                    }
                }, 50);

                // Cleanup after 5 seconds to prevent infinite loop
                setTimeout(() => clearInterval(checkStyle), 5000);
            }
        };

        executeUpdate();

    }, [routeGeoJSON, incidents, conditions]);

    // Separate effect for hover interactions to ensure layers exist
    useEffect(() => {
        if (!map.current) return;

        // Wait for layers to be ready
        const addHoverInteractions = () => {
            if (!map.current) return;

            // Check if layers exist before adding listeners
            if (!map.current.getLayer('incidents') && !map.current.getLayer('conditions')) {
                return;
            }

            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            const showPopup = (e: any) => {
                if (!e.features || e.features.length === 0) return;

                map.current!.getCanvas().style.cursor = 'pointer';

                const feature = e.features[0];
                let coordinates = feature.geometry.coordinates.slice();

                // Get description from properties
                let description = 'No information available';

                if (feature.properties) {
                    const desc = feature.properties.description;
                    const type = feature.properties.type;

                    // Check if description exists and is not "undefined" or "null" string
                    if (desc && desc !== 'undefined' && desc !== 'null' && desc.trim() !== '') {
                        description = desc;
                    } else if (type && type !== 'undefined' && type !== 'null' && type.trim() !== '') {
                        description = type;
                    }
                }

                // Handle MultiPoint: coordinates will be [[lon, lat], [lon, lat]]
                // We need [lon, lat] for setLngLat
                if (Array.isArray(coordinates[0])) {
                    coordinates = coordinates[0];
                }

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                popup.setLngLat(coordinates).setHTML(`<div style="max-width: 200px; padding: 4px;">${description}</div>`).addTo(map.current!);
            };

            const hidePopup = () => {
                map.current!.getCanvas().style.cursor = '';
                popup.remove();
            };

            // Remove existing listeners if any
            map.current.off('mouseenter', 'incidents', showPopup);
            map.current.off('mouseleave', 'incidents', hidePopup);
            map.current.off('mouseenter', 'conditions', showPopup);
            map.current.off('mouseleave', 'conditions', hidePopup);

            // Add new listeners
            if (map.current.getLayer('incidents')) {
                map.current.on('mouseenter', 'incidents', showPopup);
                map.current.on('mouseleave', 'incidents', hidePopup);
            }

            if (map.current.getLayer('conditions')) {
                map.current.on('mouseenter', 'conditions', showPopup);
                map.current.on('mouseleave', 'conditions', hidePopup);
            }

            return () => {
                if (map.current) {
                    map.current.off('mouseenter', 'incidents', showPopup);
                    map.current.off('mouseleave', 'incidents', hidePopup);
                    map.current.off('mouseenter', 'conditions', showPopup);
                    map.current.off('mouseleave', 'conditions', hidePopup);
                    popup.remove();
                }
            };
        };

        // Small delay to ensure layers are fully added
        const timeoutId = setTimeout(addHoverInteractions, 100);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [incidents, conditions]);

    // Initialize map when route is complete
    const showMap = Boolean(from && destination);

    useEffect(() => {
        if (!showMap || !mapContainer.current) return;
        if (map.current) return; // initialize map only once per mount cycle

        const mapId = Math.random().toString(36).substring(7);

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    'osm': {
                        type: 'raster',
                        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        //attribution: '&copy; OpenStreetMap Contributors',
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
            center: [-98.5795, 39.8283], // Center of US
            zoom: 3
        });

        // @ts-ignore
        map.current._id = mapId;

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            // Map loaded
            // Trigger an update to ensure layers are added if route data is already present
            // We can't easily trigger the other effect, but it depends on map.current,
            // so we might need to force a re-render or ensure the other effect runs.
            // Actually, the other effect checks `if (!map.current) return;`.
            // Depending on timing, it might have run and returned early.
            // But since `map` is a ref, modifying it doesn't trigger re-renders.
            // The `updateLayers` logic is in another useEffect dependent on [routeGeoJSON].
            // If routeGeoJSON is already set, that effect might have run before map.current was set.
            // However, `showMap` becoming true usually coincides with routeGeoJSON being fetched?
            // Not necessarily. routeGeoJSON comes from `fetchStats`.
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [showMap]); // Only re-run when showing/hiding toggles

    // Update map view when region changes
    useEffect(() => {
        if (!map.current || !selectedRegionId) return;

        const region = regions.find(r => r.id === selectedRegionId);
        if (region) {
            map.current.flyTo({
                center: region.center,
                zoom: region.zoom
            });
        }
    }, [selectedRegionId, regions]);

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Navigation size={20} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Route Planner</h2>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <select
                        value={selectedRegionId}
                        onChange={(e) => onRegionChange(e.target.value)}
                        style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #ccc',
                            fontSize: '0.875rem'
                        }}
                    >
                        <option value="" disabled>Select Region</option>
                        {regions.map(region => (
                            <option key={region.id} value={region.id}>
                                {region.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>From</label>
                    <select
                        value={from}
                        onChange={(e) => onFromChange(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ccc' }}
                        disabled={!selectedRegionId}
                    >
                        <option value="" disabled>Select Origin</option>
                        {locationOptions.map(loc => (
                            <option key={loc.id} value={loc.id} disabled={destination === loc.id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>To</label>
                    <select
                        value={destination}
                        onChange={(e) => onDestinationChange(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ccc' }}
                        disabled={!selectedRegionId}
                    >
                        <option value="" disabled>Select Destination</option>
                        {locationOptions.map(loc => (
                            <option key={loc.id} value={loc.id} disabled={from === loc.id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Card */}
            {from && destination && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
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
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
                            {snowForecast !== undefined ? `${snowForecast}"` : '-'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>New Snow</div>
                    </div>
                </div>
            )}

            {from && destination && (
                <div style={{ minHeight: '400px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginTop: '1rem' }}>
                    <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />
                </div>
            )}
        </div>
    );
};
