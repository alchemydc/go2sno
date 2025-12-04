import React, { useEffect, useState } from 'react';
import { AlertTriangle, Construction } from 'lucide-react';
import { getIncidents, getRoadConditions, Incident, RoadCondition } from '../services/cdot';

export const IncidentsCard: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [conditions, setConditions] = useState<RoadCondition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [incidentsData, conditionsData] = await Promise.all([
                    getIncidents(),
                    getRoadConditions()
                ]);
                setIncidents(incidentsData);
                setConditions(conditionsData);
            } catch (error) {
                console.error('Error loading alerts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="card">Loading alerts...</div>;
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
                            <div key={idx} style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                {cond.conditionDescription}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
