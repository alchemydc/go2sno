import React, { useEffect, useState } from 'react';
import { AvalancheForecast } from '../services/avalanche';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { useRegion } from '../context/RegionContext';
import { getAvalancheService } from '../services/factory';

interface AvalancheReportCardProps {
    destination: string;
}

export const AvalancheReportCard: React.FC<AvalancheReportCardProps> = ({ destination }) => {
    const { selectedRegion } = useRegion();
    const [forecast, setForecast] = useState<AvalancheForecast | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!destination || !selectedRegion) {
            setForecast(null);
            setLoading(false);
            return;
        }

        const fetchForecast = async () => {
            setLoading(true);
            const avalancheService = getAvalancheService(selectedRegion.id);
            const data = await avalancheService.getAvalancheForecast(destination);
            setForecast(data);
            setLoading(false);
        };

        fetchForecast();
    }, [destination, selectedRegion?.id]);

    if (loading) {
        return (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
                <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>Loading avalanche report...</span>
            </div>
        );
    }

    if (!forecast) {
        return null; // Don't show card if no forecast available for this zone
    }

    const getDangerColor = (rating: number) => {
        switch (rating) {
            case 1: return '#4ade80'; // Low - Green
            case 2: return '#facc15'; // Moderate - Yellow
            case 3: return '#f97316'; // Considerable - Orange
            case 4: return '#ef4444'; // High - Red
            case 5: return '#000000'; // Extreme - Black
            default: return '#9ca3af'; // Grey
        }
    };

    const dangerColor = getDangerColor(forecast.dangerRating);
    const isExtreme = forecast.dangerRating === 5;

    return (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: `6px solid ${dangerColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <AlertTriangle size={20} style={{ marginRight: '0.5rem', color: dangerColor }} />
                    <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Avalanche Report</h2>
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: '12px'
                }}>
                    {forecast.zoneName}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{
                    backgroundColor: dangerColor,
                    color: isExtreme ? 'white' : 'black',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginRight: '0.75rem',
                    border: isExtreme ? '1px solid #333' : 'none'
                }}>
                    {forecast.dangerRating}
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', color: isExtreme ? dangerColor : 'inherit' }}>
                        {forecast.dangerRatingDescription.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Danger Level</div>
                </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem', lineHeight: '1.4' }}>
                {forecast.summary.replace(/<[^>]*>/g, '')}
            </p>

            <a
                href={forecast.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: 500
                }}
            >
                View Full Forecast <ExternalLink size={14} style={{ marginLeft: '4px' }} />
            </a>
        </div>
    );
};
