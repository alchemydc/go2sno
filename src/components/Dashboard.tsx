import React, { useEffect, useState } from 'react';
import { RoutePlanner } from './RoutePlanner';
import { CameraGrid } from './CameraGrid';
import { ResortList } from './ResortList';
import { IncidentsCard } from './IncidentsCard';
import { AvalancheReportCard } from './AvalancheReportCard';
import { getWeather } from '../services/weather';
import type { WeatherForecast } from '../services/weather';
import { CloudSun } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Incident, RoadCondition, Camera, getStreamingCameras } from '../services/cdot';
import pointToLineDistance from '@turf/point-to-line-distance';
import { point, lineString } from '@turf/helpers';
import { useRegion } from '../context/RegionContext';
import { getRoadService } from '../services/factory';
import { getAllRegions } from '../config/regions';

export const Dashboard: React.FC = () => {
    const { selectedRegion, setRegionId } = useRegion();
    const [weather, setWeather] = useState<WeatherForecast | null>(null);
    const [destination, setDestination] = useState('');
    const [from, setFrom] = useState('');
    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
    const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
    const [allConditions, setAllConditions] = useState<RoadCondition[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [conditions, setConditions] = useState<RoadCondition[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [allCameras, setAllCameras] = useState<Camera[]>([]);
    const [cameras, setCameras] = useState<Camera[]>([]);

    const roadService = getRoadService(selectedRegion.id);
    const locations = selectedRegion.locations.reduce((acc, loc) => {
        acc[loc.id] = loc.coordinates;
        return acc;
    }, {} as Record<string, string>);

    // Reset from/destination when region changes
    useEffect(() => {
        // Set default locations based on region
        const gatewayLocations = selectedRegion.locations.filter(loc => loc.type === 'gateway');
        const resortLocations = selectedRegion.locations.filter(loc => loc.type === 'resort');

        // Default "from" to first gateway or first location
        const defaultFrom = gatewayLocations[0]?.id || selectedRegion.locations[0]?.id || '';
        // Default "to" to first resort or second location
        const defaultTo = resortLocations[0]?.id || selectedRegion.locations[1]?.id || '';

        setFrom(defaultFrom);
        setDestination(defaultTo);
    }, [selectedRegion.id]);

    useEffect(() => {
        // Get coordinates for selected destination
        const coords = locations[destination];
        if (coords) {
            const [lat, lon] = coords.split(',').map(Number);
            getWeather(lat, lon).then(setWeather);
        }
    }, [destination]);

    // Fetch alerts and cameras when region changes
    useEffect(() => {
        const fetchData = async () => {
            setLoadingAlerts(true);
            try {
                const [incidentsData, conditionsData, camerasData] = await Promise.all([
                    roadService.getIncidents(),
                    roadService.getRoadConditions(),
                    selectedRegion.id === 'co' ? getStreamingCameras() : Promise.resolve([])
                ]);
                setAllIncidents(incidentsData);
                setAllConditions(conditionsData);
                setAllCameras(camerasData);
            } catch (error) {
                console.error('Error loading alerts:', error);
            } finally {
                setLoadingAlerts(false);
            }
        };
        fetchData();
    }, [selectedRegion.id]);

    // Filter alerts and cameras when route or data changes
    useEffect(() => {
        if (loadingAlerts) return;

        if (routeGeoJSON && routeGeoJSON.geometry && routeGeoJSON.geometry.coordinates) {
            const routeLine = lineString(routeGeoJSON.geometry.coordinates);
            const MAX_DISTANCE_MILES = 1; // range beyond which incidents and conditions will be ignored for a given route
            const CAMERA_MAX_DISTANCE_MILES = 5; // cameras can be further from route

            const filteredIncidents = allIncidents.filter(incident => {
                let coords: number[];
                if (incident.geometry.type === 'MultiPoint') {
                    coords = (incident.geometry.coordinates as number[][])[0];
                } else if (incident.geometry.type === 'Point') {
                    coords = incident.geometry.coordinates as number[];
                } else {
                    return false;
                }

                const pt = point(coords);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                return distance <= MAX_DISTANCE_MILES;
            });

            const filteredConditions = allConditions.filter(condition => {
                const pt = point([condition.properties.primaryLongitude, condition.properties.primaryLatitude]);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                return distance <= MAX_DISTANCE_MILES;
            });

            const filteredCameras = allCameras.filter(camera => {
                if (!camera.latitude || !camera.longitude) return false;
                const pt = point([camera.longitude, camera.latitude]);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                return distance <= CAMERA_MAX_DISTANCE_MILES;
            });

            setIncidents(filteredIncidents);
            setConditions(filteredConditions);
            setCameras(filteredCameras);
        } else {
            setIncidents(allIncidents);
            setConditions(allConditions);
            setCameras(allCameras);
        }
    }, [routeGeoJSON, allIncidents, allConditions, allCameras, loadingAlerts]);

    // Format destination name for display (capitalize first letter)
    const destinationName = destination.charAt(0).toUpperCase() + destination.slice(1);

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', marginBottom: '0.5rem', margin: 0 }}>go2sno</h1>
                    <p style={{ color: '#6b7280', fontSize: '1.125rem', margin: 0 }}>Real-time snow, weather, avalanche and road conditions.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ThemeToggle />
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Main Column: Route & Cameras */}
                <div style={{ gridColumn: 'span 2' }}>
                    <RoutePlanner
                        locations={locations}
                        locationOptions={selectedRegion.locations}
                        destination={destination}
                        onDestinationChange={setDestination}
                        from={from}
                        onFromChange={setFrom}
                        onRouteUpdate={setRouteGeoJSON}
                        incidents={incidents}
                        conditions={conditions}
                        regions={getAllRegions()}
                        selectedRegionId={selectedRegion.id}
                        onRegionChange={setRegionId}
                    />

                    <CameraGrid cameras={cameras} />
                </div>

                {/* Sidebar: Weather, Avalanche Conditions, Road Conditions & Incidents and Resort Reports */}
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
                        <AvalancheReportCard destination={destination} />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <IncidentsCard
                            incidents={incidents}
                            conditions={conditions}
                            loading={loadingAlerts}
                        />
                    </div>

                    <ResortList />
                </div>

            </div>

        </div>
    );
};
