import React from 'react';

interface LogoProps {
    height?: number;
    className?: string;
}

export const EpicLogo: React.FC<LogoProps> = ({ height = 20, className = '' }) => {
    return (
        <svg
            height={height}
            viewBox="0 0 60 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ display: 'block' }}
        >
            <rect width="60" height="24" rx="4" fill="white" />
            <text
                x="30"
                y="17"
                fontFamily="Arial, Helvetica, sans-serif"
                fontWeight="900"
                fontSize="16"
                textAnchor="middle"
                fill="#FF8203"
                style={{ letterSpacing: '-0.5px' }}
            >
                epic
            </text>
        </svg>
    );
};

export const IkonLogo: React.FC<LogoProps> = ({ height = 20, className = '' }) => {
    return (
        <svg
            height={height}
            viewBox="0 0 60 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ display: 'block' }}
        >
            {/* Ikon Yellow Background */}
            <rect width="60" height="24" rx="2" fill="#F8C81C" />
            <text
                x="30"
                y="17"
                fontFamily="Arial, Helvetica, sans-serif"
                fontWeight="900"
                fontSize="14"
                textAnchor="middle"
                fill="#1a1a1a"
                style={{ letterSpacing: '1px' }}
            >
                IKON
            </text>
        </svg>
    );
};
