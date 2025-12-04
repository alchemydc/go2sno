import React, { useEffect, useState } from 'react';
import { AlertTriangle, Construction, Loader2 } from 'lucide-react';
import { getIncidents, getRoadConditions, Incident, RoadCondition } from '../services/cdot';
import pointToLineDistance from '@turf/point-to-line-distance';
import { point, lineString } from '@turf/helpers';

interface IncidentsCardProps {
    routeGeoJSON?: any;
}

export const IncidentsCard: React.FC<IncidentsCardProps> = ({ routeGeoJSON }) => {
    const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
    const [allConditions, setAllConditions] = useState<RoadCondition[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [conditions, setConditions] = useState<RoadCondition[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all data once on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [incidentsData, conditionsData] = await Promise.all([
                    getIncidents(),
                    getRoadConditions()
                ]);
                setAllIncidents(incidentsData);
                setAllConditions(conditionsData);
            } catch (error) {
                console.error('Error loading alerts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter data when route or data changes
    useEffect(() => {
        if (loading) return;

        if (routeGeoJSON && routeGeoJSON.geometry && routeGeoJSON.geometry.coordinates) {
            const routeLine = lineString(routeGeoJSON.geometry.coordinates);
            console.log('Filtering alerts for new route. Points:', routeGeoJSON.geometry.coordinates.length);
            const MAX_DISTANCE_MILES = 1;

            const filteredIncidents = allIncidents.filter(incident => {
                let coords: number[];
                if (incident.geometry.type === 'MultiPoint') {
                    coords = (incident.geometry.coordinates as number[][])[0];
                } else if (incident.geometry.type === 'Point') {
                    coords = incident.geometry.coordinates as number[];
                } else {
                    return false; // Skip unknown geometries
                }

                const pt = point(coords);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                // console.log(`Incident ${incident.properties.type} distance: ${distance} miles`);
                return distance <= MAX_DISTANCE_MILES;
            });

            const filteredConditions = allConditions.filter(condition => {
                const pt = point([condition.properties.primaryLongitude, condition.properties.primaryLatitude]);
                const distance = pointToLineDistance(pt, routeLine, { units: 'miles' });
                return distance <= MAX_DISTANCE_MILES;
            });

            setIncidents(filteredIncidents);
            setConditions(filteredConditions);
        } else {
            // If no route selected, show all (or maybe none? showing all for now as fallback)
            setIncidents(allIncidents);
            setConditions(allConditions);
        }
    }, [routeGeoJSON, allIncidents, allConditions, loading]);

    if (loading) {
        return (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
                <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>Loading alerts...</span>
            </div>
        );
    }

    if (incidents.length === 0 && conditions.length === 0) {
        return (
            <div className="card" style={{ borderLeft: '4px solid #9ca3af' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <AlertTriangle size={24} color="#9ca3af" style={{ marginRight: '0.5rem' }} />
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Travel Alerts</h2>
                </div>
                <div>No active alerts or incidents reported.</div>
            </div>
        );
    }

    return (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={24} color="#f59e0b" style={{ marginRight: '0.5rem' }} />
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Travel Alerts</h2>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {incidents.map(incident => (
                    <div key={incident.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{incident.properties.type}</div>
                        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>{incident.properties.travelerInformationMessage}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                            {new Date(incident.properties.startTime).toLocaleString()}
                        </div>
                    </div>
                ))}

                {conditions.map(condition => (
                    <div key={condition.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <Construction size={16} style={{ marginRight: '0.5rem', color: '#6b7280' }} />
                            <span style={{ fontWeight: 600 }}>{condition.properties.routeName}</span>
                        </div>
                        {condition.properties.currentConditions.map((cond, idx) => (
                            <div key={`${condition.id}-cond-${idx}`} style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                {cond.conditionDescription}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
