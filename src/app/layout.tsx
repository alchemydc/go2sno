import '../index.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Colorado Snow Go',
    description: 'Real-time I-70 road conditions and resort status.',
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
