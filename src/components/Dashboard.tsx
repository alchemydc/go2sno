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
import { CloudSun, X, AlertTriangle } from 'lucide-react';
import { relativeTime } from '../utils/time';
import { ThemeToggle } from './ThemeToggle';
import { Incident, RoadCondition, Camera } from '../types/domain';
import { prioritizeCameras } from '../utils/camera-priority';
import pointToLineDistance from '@turf/point-to-line-distance';
import { point, lineString } from '@turf/helpers';
import { useRegion } from '../context/RegionContext';
import { getRoadService } from '../services/factory';
import { getAllRegions } from '../config/regions';

const regions = getAllRegions();

export const Dashboard: React.FC = () => {
    const { selectedRegion, setRegionId } = useRegion();
    const [weather, setWeather] = useState<WeatherForecast | null>(null);
    const [weatherError, setWeatherError] = useState(false);
    const [weatherFetchedAt, setWeatherFetchedAt] = useState<Date | null>(null);
    const [weatherTimeDisplay, setWeatherTimeDisplay] = useState('');
    const [destination, setDestination] = useState('');
    const [from, setFrom] = useState('');
    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
    const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
    const [allConditions, setAllConditions] = useState<RoadCondition[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [conditions, setConditions] = useState<RoadCondition[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [alertsError, setAlertsError] = useState(false);
    const [allCameras, setAllCameras] = useState<Camera[]>([]);
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [resorts, setResorts] = useState<Resort[]>([]);
    const [showAllCameras, setShowAllCameras] = useState(false);

    // Close camera modal on Escape key
    useEffect(() => {
        if (!showAllCameras) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowAllCameras(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [showAllCameras]);

    // Update relative time displays every 60s
    useEffect(() => {
        const interval = setInterval(() => {
            if (weatherFetchedAt) setWeatherTimeDisplay(relativeTime(weatherFetchedAt));
        }, 60_000);
        // Set initial display
        if (weatherFetchedAt) setWeatherTimeDisplay(relativeTime(weatherFetchedAt));
        return () => clearInterval(interval);
    }, [weatherFetchedAt]);

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
        setWeatherError(false);
        setWeatherFetchedAt(null);
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
            setWeatherError(false);
            getWeather(lat, lon).then(data => {
                setWeather(data);
                setWeatherFetchedAt(new Date());
            }).catch(() => {
                setWeatherError(true);
            });
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
        if (!selectedRegion || !destination || !from) {
            // cleared in the region change effect or initial state
            setLoadingAlerts(false);
            return;
        }

        const fetchData = async () => {
            setLoadingAlerts(true);
            setAlertsError(false);
            try {
                const service = getRoadService(selectedRegion.id);
                const [incidentsData, conditionsData, camerasData] = await Promise.all([
                    service.getIncidents(),
                    service.getConditions(),
                    service.getCameras()
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
                setAlertsError(true);
            } finally {
                setLoadingAlerts(false);
            }
        };
        fetchData();
    }, [selectedRegion?.id, destination, from]);

    // Filter alerts and cameras when route or data changes
    useEffect(() => {
        if (loadingAlerts) return;

        logger.debug('Dashboard: Filtering alerts', {
            allIncidents: allIncidents.length,
            allConditions: allConditions.length,
            allCameras: allCameras.length,
            hasRoute: !!routeGeoJSON
        });

        if (routeGeoJSON && routeGeoJSON.geometry && routeGeoJSON.geometry.coordinates) {
            const routeLine = lineString(routeGeoJSON.geometry.coordinates);
            const MAX_DISTANCE_MILES = 1; // range beyond which incidents and conditions will be ignored for a given route
            const CAMERA_MAX_DISTANCE_MILES = 1; // range beyond which cameras will be ignored for a given route

            const filteredIncidents = allIncidents.filter(incident => {
                if (typeof incident.location.lon !== 'number' || typeof incident.location.lat !== 'number' || isNaN(incident.location.lon) || isNaN(incident.location.lat)) {
                    return false;
                }
                const pt = point([incident.location.lon, incident.location.lat]);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                return distance <= MAX_DISTANCE_MILES;
            });

            const filteredConditions = allConditions.filter(condition => {
                // Filter out "dry" conditions as they are not actionable alerts
                const description = (condition.description || '').toLowerCase();
                const status = (condition.status || '').toLowerCase();

                if (description.includes('dry') || status.includes('dry')) {
                    return false;
                }

                if (typeof condition.location.lon !== 'number' || typeof condition.location.lat !== 'number' || isNaN(condition.location.lon) || isNaN(condition.location.lat)) {
                    return false;
                }

                const pt = point([condition.location.lon, condition.location.lat]);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                return distance <= MAX_DISTANCE_MILES;
            });

            logger.debug('Dashboard: Route filtered stats', {
                incidents: filteredIncidents.length,
                conditions: filteredConditions.length
            });

            const filteredCameras = allCameras.filter(camera => {
                if (!camera.location?.lat || !camera.location?.lon || isNaN(camera.location.lat) || isNaN(camera.location.lon)) return false;
                const pt = point([camera.location.lon, camera.location.lat]);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                return distance <= CAMERA_MAX_DISTANCE_MILES;
            });

            logger.debug('Camera stats: On Route', {
                count: filteredCameras.length,
                routeSegmentCount: routeGeoJSON.geometry.coordinates.length
            });

            const prioritizedCameras = prioritizeCameras(filteredCameras, filteredIncidents, filteredConditions, selectedRegion?.id);

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
            <header className="dashboard-header">
                <div className="dashboard-header-left">
                    <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                        <Image
                            src="/logo.jpg"
                            alt="go2sno logo"
                            fill
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>
                    <p className="dashboard-tagline">play in the snow</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeToggle />
                </div>
            </header>

            {!selectedRegion ? (
                <div className="empty-state">
                    <h2>Where are you headed?</h2>
                    <p>Select a region to check conditions, plan your route, and track snow.</p>
                    <div className="region-chips">
                        {regions.map(r => (
                            <button key={r.id} onClick={() => setRegionId(r.id)} className="region-chip">
                                {r.name}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (

            <div className="dashboard-grid">

                {/* Left Column */}
                <div className="dashboard-col-left">
                    <div className="area-planner">
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
                    </div>

                    <div className="area-cameras">
                        {destination && (
                            <div className="card" style={{ marginBottom: 0, height: '100%' }}>
                                <CameraGrid cameras={cameras.slice(0, 4)} loading={loadingAlerts} error={alertsError} />

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
                </div>

                {/* Right Column */}
                <div className="dashboard-col-right">
                    <div className="area-resorts">
                        <ResortList
                            resorts={resorts}
                            onSelect={setDestination}
                            selectedResortId={destination}
                        />
                    </div>

                    <div className="area-weather">
                        {destination && (
                            <div className="card card-weather" style={{ marginBottom: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <CloudSun size={24} style={{ marginRight: '0.5rem' }} />
                                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{destinationName} Weather</h2>
                                </div>
                                {weather ? (
                                    <div>
                                        <div className="weather-temp">{weather.temperature}°F</div>
                                        <div className="weather-desc">{weather.shortForecast}</div>
                                        <div className="weather-wind">Wind: {weather.windSpeed}</div>
                                        {weatherTimeDisplay && (
                                            <div className="weather-updated">Updated {weatherTimeDisplay}</div>
                                        )}
                                    </div>
                                ) : weatherError ? (
                                    <div className="weather-error">
                                        <AlertTriangle size={16} />
                                        <span>Weather unavailable</span>
                                        <button
                                            onClick={() => {
                                                const coords = locations[destination];
                                                if (coords) {
                                                    const [lat, lon] = coords.split(',').map(Number);
                                                    setWeatherError(false);
                                                    getWeather(lat, lon).then(data => {
                                                        setWeather(data);
                                                        setWeatherFetchedAt(new Date());
                                                    }).catch(() => setWeatherError(true));
                                                }
                                            }}
                                            className="link-button"
                                        >Retry</button>
                                    </div>
                                ) : (
                                    <div>Loading weather...</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="area-avalanche">
                        {destination && (
                            <AvalancheReportCard destination={destination} />
                        )}
                    </div>

                    <div className="area-alerts">
                        {destination && (incidents.length > 0 || conditions.length > 0) && (
                            <IncidentsCard
                                incidents={incidents}
                                conditions={conditions}
                                loading={loadingAlerts}
                            />
                        )}
                    </div>
                </div>

            </div>

            )}

            {showAllCameras && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="All route cameras"
                    className="camera-modal-overlay"
                >
                    <button
                        onClick={() => setShowAllCameras(false)}
                        aria-label="Close"
                        className="camera-modal-close"
                    >
                        <X size={20} />
                    </button>
                    <div className="container">
                        <div style={{ marginBottom: '2rem' }}>
                            <button
                                onClick={() => setShowAllCameras(false)}
                                className="camera-modal-back"
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 className="camera-modal-title">All Route Cameras</h1>
                            <p className="camera-modal-subtitle">
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
