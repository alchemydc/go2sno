
import React from 'react';
import { X, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface LiftStatusOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    resortName: string;
    lifts: Record<string, string>;
    summary: {
        open: number;
        total: number;
        percentOpen: number;
    };
}

export const LiftStatusOverlay: React.FC<LiftStatusOverlayProps> = ({
    isOpen,
    onClose,
    resortName,
    lifts,
    summary
}) => {
    if (!isOpen) return null;

    // Group lifts by status
    const groupedLifts: Record<string, string[]> = {
        open: [],
        scheduled: [],
        hold: [],
        closed: []
    };

    Object.entries(lifts).forEach(([name, status]) => {
        const normalizedStatus = status.toLowerCase();
        if (groupedLifts[normalizedStatus]) {
            groupedLifts[normalizedStatus].push(name);
        } else {
            groupedLifts.closed.push(name); // Fallback
        }
    });

    // Sort lifts alphabetically within groups
    Object.keys(groupedLifts).forEach(key => {
        groupedLifts[key].sort();
    });

    const getIcon = (status: string) => {
        switch (status) {
            case 'open': return <CheckCircle size={18} color="#137333" />;
            case 'scheduled': return <Clock size={18} color="#e37400" />;
            case 'hold': return <AlertTriangle size={18} color="#f9ab00" />; // Should verify logical color
            case 'closed': return <XCircle size={18} color="#c5221f" />;
            default: return <XCircle size={18} color="#999" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Open';
            case 'scheduled': return 'Scheduled';
            case 'hold': return 'On Hold';
            case 'closed': return 'Closed';
            default: return status;
        }
    };

    const sections = ['open', 'scheduled', 'hold', 'closed'];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                border: '1px solid var(--color-background)',
                color: 'var(--color-text)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--color-background)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text)' }}>{resortName} Lifts</h2>
                        <div style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem' }}>
                            {summary.open}/{summary.total} Lifts Open ({summary.percentOpen}%)
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text)',
                            opacity: 0.6
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '1rem 1.5rem',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {sections.map(status => {
                        const liftNames = groupedLifts[status];
                        if (liftNames.length === 0) return null;

                        return (
                            <div key={status} style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{
                                    textTransform: 'capitalize',
                                    margin: '0 0 0.75rem 0',
                                    fontSize: '1rem',
                                    color: 'var(--color-text)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {getIcon(status)}
                                    {getStatusLabel(status)}
                                    <span style={{
                                        fontSize: '0.8rem',
                                        opacity: 0.6,
                                        fontWeight: 'normal',
                                        marginLeft: 'auto'
                                    }}>
                                        {liftNames.length}
                                    </span>
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: '0.5rem'
                                }}>
                                    {liftNames.map(name => (
                                        <div key={name} style={{
                                            padding: '0.5rem',
                                            backgroundColor: 'var(--color-background)',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            border: '1px solid rgba(0,0,0,0.05)', // Subtle border
                                            color: 'var(--color-text)'
                                        }}>
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
