import '../index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Metadata } from 'next';
import { Github } from 'lucide-react';

export const metadata: Metadata = {
    title: 'go2sno',
    description: 'Real-time snow, weather, avalanche and road conditions.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>{children}</div>
                <footer style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#666',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '2rem'
                }}>
                    <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        Weather data by Open-Meteo.com
                    </a>
                    {' | '}
                    <a href="https://github.com/alchemydc/go2sno/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', verticalAlign: 'text-bottom' }} aria-label="GitHub Repository">
                        <Github size={14} />
                    </a>
                </footer>
            </body>
        </html>
    );
}
