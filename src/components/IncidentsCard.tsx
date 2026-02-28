import React from 'react';
import { AlertTriangle, Construction, Loader2 } from 'lucide-react';
import { Incident, RoadCondition } from '../types/domain';

interface IncidentsCardProps {
    incidents: Incident[];
    conditions: RoadCondition[];
    loading: boolean;
}

export const IncidentsCard: React.FC<IncidentsCardProps> = ({ incidents, conditions, loading }) => {
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
                {incidents.map((incident, idx) => (
                    <div key={incident.id || `incident-${idx}`} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{incident.type}</div>
                        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>{incident.description}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                            {new Date(incident.startTime).toLocaleString()}
                        </div>
                    </div>
                ))}

                {conditions.map((condition, idx) => (
                    <div key={`condition-${idx}`} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <Construction size={16} style={{ marginRight: '0.5rem', color: '#6b7280' }} />
                            <span style={{ fontWeight: 600 }}>{condition.routeName}</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            <span style={{ fontWeight: 500 }}>{condition.status}: </span>
                            {condition.description}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
