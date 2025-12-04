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
    leadville: '39.2508,-106.2925',
    silverton: '37.8119,-107.6639',
    wolfcreek: '37.3869,-106.8830',
    crestedbutte: '38.8697,-106.9878',
    aspen: '39.1911,-106.8175',
    telluride: '37.9375,-107.8123',
    beavercreek: '39.6042,-106.5165',
    monarch: '38.5458,-106.3258',
    arapahoebasin: '39.6425,-105.8719'
};

import { Incident, RoadCondition } from '../services/cdot';

interface RoutePlannerProps {
    destination: string;
    onDestinationChange: (destination: string) => void;
    from: string;
    onFromChange: (from: string) => void;
    onRouteUpdate: (geojson: any) => void;
    incidents?: Incident[];
    conditions?: RoadCondition[];
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
    destination,
    onDestinationChange,
    from,
    onFromChange,
    onRouteUpdate,
    incidents = [],
    conditions = []
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    // from is now controlled by parent
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
                    onRouteUpdate(geojson);
                }
            } catch (error) {
                console.error('Failed to fetch route stats:', error);
                setStats(prev => ({ ...prev, travelTime: 'Error', delay: 'Error' }));
            }
        };

        fetchStats();
    }, [from, destination]);

    // Update map with route and alerts
    useEffect(() => {
        if (!map.current) return;

        console.log('RoutePlanner: Effect triggered');
        console.log('RoutePlanner: Incidents count:', incidents.length);
        console.log('RoutePlanner: Conditions count:', conditions.length);

        const updateLayers = () => {
            if (!map.current) return;
            // @ts-ignore
            console.log(`RoutePlanner: Updating layers for map instance ${map.current._id}`);

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
            console.log('RoutePlanner: Incidents source exists?', !!incidentsSource);
            console.log('RoutePlanner: Incidents GeoJSON features count:', incidentsGeoJSON.features.length);

            if (incidentsSource) {
                console.log('RoutePlanner: Updating incidents source data with', incidentsGeoJSON.features.length, 'features');
                incidentsSource.setData(incidentsGeoJSON);
            } else {
                console.log('RoutePlanner: Adding incidents source and layer');
                map.current.addSource('incidents', {
                    type: 'geojson',
                    data: incidentsGeoJSON
                });
                map.current.addLayer({
                    id: 'incidents',
                    type: 'circle',
                    source: 'incidents',
                    paint: {
                        'circle-radius': 6,
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
            console.log('RoutePlanner: Conditions source exists?', !!conditionsSource);
            console.log('RoutePlanner: Conditions GeoJSON features count:', conditionsGeoJSON.features.length);

            if (conditionsSource) {
                console.log('RoutePlanner: Updating conditions source data with', conditionsGeoJSON.features.length, 'features');
                conditionsSource.setData(conditionsGeoJSON);
            } else {
                console.log('RoutePlanner: Adding conditions source and layer');
                map.current.addSource('conditions', {
                    type: 'geojson',
                    data: conditionsGeoJSON
                });
                map.current.addLayer({
                    id: 'conditions',
                    type: 'circle',
                    source: 'conditions',
                    paint: {
                        'circle-radius': 5,
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
                console.log('RoutePlanner: Style is loaded, calling updateLayers immediately');
                updateLayers();
            } else {
                console.log('RoutePlanner: Style not loaded yet, waiting...');
                // Use a small timeout to wait for style to load
                const checkStyle = setInterval(() => {
                    if (map.current && map.current.isStyleLoaded()) {
                        console.log('RoutePlanner: Style loaded after waiting');
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

    useEffect(() => {
        if (map.current) return; // initialize map only once

        if (mapContainer.current) {
            const mapId = Math.random().toString(36).substring(7);
            console.log(`RoutePlanner: Initializing map instance ${mapId}`);

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

            // @ts-ignore
            map.current._id = mapId;

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
                        onChange={(e) => onFromChange(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ccc' }}
                    >
                        <option value="boulder" disabled={destination === 'boulder'}>Boulder</option>
                        <option value="denver" disabled={destination === 'denver'}>Denver</option>
                        <option value="leadville" disabled={destination === 'leadville'}>Leadville</option>
                        <option value="silverton" disabled={destination === 'silverton'}>Silverton</option>
                        <option value="wolfcreek" disabled={destination === 'wolfcreek'}>Wolf Creek</option>
                        <option value="crestedbutte" disabled={destination === 'crestedbutte'}>Crested Butte</option>
                        <option value="aspen" disabled={destination === 'aspen'}>Aspen</option>
                        <option value="telluride" disabled={destination === 'telluride'}>Telluride</option>
                        <option value="beavercreek" disabled={destination === 'beavercreek'}>Beaver Creek</option>
                        <option value="monarch" disabled={destination === 'monarch'}>Monarch</option>
                        <option value="arapahoebasin" disabled={destination === 'arapahoebasin'}>Arapahoe Basin</option>
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
                        <option value="silverton" disabled={from === 'silverton'}>Silverton</option>
                        <option value="wolfcreek" disabled={from === 'wolfcreek'}>Wolf Creek</option>
                        <option value="crestedbutte" disabled={from === 'crestedbutte'}>Crested Butte</option>
                        <option value="leadville" disabled={from === 'leadville'}>Leadville</option>
                        <option value="boulder" disabled={from === 'boulder'}>Boulder</option>
                        <option value="aspen" disabled={from === 'aspen'}>Aspen</option>
                        <option value="telluride" disabled={from === 'telluride'}>Telluride</option>
                        <option value="beavercreek" disabled={from === 'beavercreek'}>Beaver Creek</option>
                        <option value="monarch" disabled={from === 'monarch'}>Monarch</option>
                        <option value="arapahoebasin" disabled={from === 'arapahoebasin'}>Arapahoe Basin</option>
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
