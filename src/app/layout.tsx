import '../index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Metadata } from 'next';

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
            <body>{children}</body>
        </html>
    );
}
