import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { logger } from '../utils/logger';
import { RoutePlanner } from './RoutePlanner';
import { CameraGrid } from './CameraGrid';
import { ResortList } from './ResortList';
import { getResorts } from '../services/resorts';
import type { Resort } from '../services/resorts';
import { IncidentsCard } from './IncidentsCard';
import { AvalancheReportCard } from './AvalancheReportCard';
import { getWeather } from '../services/weather';
import type { WeatherForecast } from '../services/weather';
import { CloudSun } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Incident, RoadCondition, Camera, getStreamingCameras } from '../services/cdot';
import { prioritizeCameras } from '../utils/camera-priority';
import pointToLineDistance from '@turf/point-to-line-distance';
import { point, lineString } from '@turf/helpers';
import { useRegion } from '../context/RegionContext';
import { getRoadService } from '../services/factory';
import { getAllRegions } from '../config/regions';
import { getCameras as getCaltransCameras } from '../services/caltrans';

const regions = getAllRegions();

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
    const [resorts, setResorts] = useState<Resort[]>([]);
    const [showAllCameras, setShowAllCameras] = useState(false);

    const locations = React.useMemo(() => {
        return selectedRegion ? selectedRegion.locations.reduce((acc, loc) => {
            acc[loc.id] = loc.coordinates;
            return acc;
        }, {} as Record<string, string>) : {};
    }, [selectedRegion]);

    // Reset from/destination and clear data when region changes
    useEffect(() => {
        // Clear selections and data when region changes
        setFrom('');
        setDestination('');
        setWeather(null);
        setRouteGeoJSON(null);
        setAllIncidents([]);
        setAllConditions([]);
        setAllCameras([]);
        setIncidents([]);
        setConditions([]);
        setCameras([]);
        // Note: We don't clear resorts here because the new region will immediately trigger a fetch
    }, [selectedRegion?.id]);

    useEffect(() => {
        if (!destination || !locations[destination]) return;

        // Get coordinates for selected destination
        const coords = locations[destination];
        if (coords) {
            const [lat, lon] = coords.split(',').map(Number);
            getWeather(lat, lon).then(setWeather);
        }
    }, [destination, locations]);

    // Fetch resorts when region changes
    useEffect(() => {
        if (!selectedRegion) {
            setResorts([]);
            return;
        }

        const fetchResorts = async () => {
            logger.debug(`Fetching resorts for region: ${selectedRegion.id}`, {
                region: selectedRegion.id,
                timestamp: new Date().toISOString()
            });

            try {
                const resortsData = await getResorts(selectedRegion.id);
                setResorts(resortsData);
                logger.debug(`Successfully fetched ${resortsData.length} resorts for region ${selectedRegion.id}`, {
                    region: selectedRegion.id,
                    count: resortsData.length,
                    resorts: resortsData.map(r => r.name)
                });
            } catch (error) {
                logger.error('Error loading resorts:', error);
            }
        };

        fetchResorts();
    }, [selectedRegion?.id]);

    // Fetch alerts and cameras when destination changes (and region is selected)
    useEffect(() => {
        if (!selectedRegion || !destination) {
            // cleared in the region change effect or initial state
            setLoadingAlerts(false);
            return;
        }

        const fetchData = async () => {
            setLoadingAlerts(true);
            try {
                const service = getRoadService(selectedRegion.id);
                const [incidentsData, conditionsData, camerasData] = await Promise.all([
                    service.getIncidents(),
                    service.getRoadConditions(),
                    selectedRegion.id === 'co' ? getStreamingCameras() :
                        selectedRegion.id === 'canv' ? getCaltransCameras() : Promise.resolve([]),
                ]);
                setAllIncidents(incidentsData);
                setAllConditions(conditionsData);
                setAllCameras(camerasData);
                logger.debug('Camera stats: Fetched from API', {
                    region: selectedRegion.id,
                    count: camerasData.length
                });
            } catch (error) {
                logger.error('Error loading alerts:', error);
            } finally {
                setLoadingAlerts(false);
            }
        };
        fetchData();
    }, [selectedRegion?.id, destination]);

    // Filter alerts and cameras when route or data changes
    useEffect(() => {
        if (loadingAlerts) return;

        if (routeGeoJSON && routeGeoJSON.geometry && routeGeoJSON.geometry.coordinates) {
            const routeLine = lineString(routeGeoJSON.geometry.coordinates);
            const MAX_DISTANCE_MILES = 1; // range beyond which incidents and conditions will be ignored for a given route
            const CAMERA_MAX_DISTANCE_MILES = 1; // range beyond which cameras will be ignored for a given route

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

            logger.debug('Camera stats: On Route', {
                count: filteredCameras.length,
                routeSegmentCount: routeGeoJSON.geometry.coordinates.length
            });

            const prioritizedCameras = prioritizeCameras(filteredCameras, filteredIncidents, filteredConditions);

            logger.debug('Camera stats: Prioritized', {
                count: prioritizedCameras.length,
                top4: prioritizedCameras.slice(0, 4).map(c => c.name)
            });

            setIncidents(filteredIncidents);
            setConditions(filteredConditions);
            setCameras(prioritizedCameras);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <Image
                            src="/logo.jpg"
                            alt="go2sno logo"
                            fill
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>
                    <div>
                        <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', margin: 0, lineHeight: 1 }}>go2sno</h1>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem', margin: 0 }}>Real-time snow, weather, avalanche and road conditions.</p>
                    </div>
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
                        locationOptions={selectedRegion?.locations || []}
                        destination={destination}
                        onDestinationChange={setDestination}
                        from={from}
                        onFromChange={setFrom}
                        onRouteUpdate={setRouteGeoJSON}
                        incidents={incidents}
                        conditions={conditions}
                        regions={regions}
                        selectedRegionId={selectedRegion?.id || ''}
                        onRegionChange={setRegionId}
                        snowForecast={resorts.find(r => r.id === destination)?.snow24h}
                    />

                    {destination && (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <CameraGrid cameras={cameras.slice(0, 4)} loading={loadingAlerts} />

                            {!loadingAlerts && cameras.length > 4 && (
                                <div style={{ marginTop: '1rem', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                                    <button
                                        onClick={() => setShowAllCameras(true)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            cursor: 'pointer',
                                            color: 'var(--color-primary)',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            fontSize: 'inherit',
                                            fontFamily: 'inherit'
                                        }}
                                    >
                                        View All {cameras.length} Cameras on Route →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar: Weather, Avalanche Conditions, Road Conditions & Incidents and Resort Reports */}
                <div>
                    {destination && (
                        <>
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

                            {(incidents.length > 0 || conditions.length > 0) && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <IncidentsCard
                                        incidents={incidents}
                                        conditions={conditions}
                                        loading={loadingAlerts}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <ResortList resorts={resorts} />
                </div>

            </div>

            {showAllCameras && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'var(--color-background)',
                    zIndex: 50,
                    overflowY: 'auto',
                    padding: '2rem'
                }}>
                    <div className="container">
                        <div style={{ marginBottom: '2rem' }}>
                            <button
                                onClick={() => setShowAllCameras(false)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: '#6b7280',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    padding: 0,
                                    marginBottom: '1rem'
                                }}
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', margin: 0 }}>All Route Cameras</h1>
                            <p style={{ color: '#6b7280' }}>
                                Showing {cameras.length} cameras associated with route {from} to {destination}
                            </p>
                        </div>
                        <CameraGrid cameras={cameras} loading={false} />
                    </div>
                </div>
            )}
        </div>
    );
};
