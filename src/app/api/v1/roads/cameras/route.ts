import { NextResponse } from 'next/server';
import { logger } from '../../../../../utils/logger';

interface Camera {
    id: string;
    name: string;
    url: string; // Stream URL
    thumbnailUrl?: string; // Optional
    location: {
        lat: number;
        lon: number;
    };
    regionId: string;
    provider: string; // 'cdot' | 'caltrans'
}

// --- CDOT Logic ---
async function fetchCdotCameras(): Promise<Camera[]> {
    const url = 'https://cotg.carsprogram.org/cameras_v1/api/cameras';
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        return (data || [])
            .filter((c: any) => c.public && c.active)
            .map((c: any) => {
                const wmpView = c.views?.find((v: any) => v.type === 'WMP');
                if (!wmpView?.url) return null;

                return {
                    id: String(c.id),
                    name: c.name || 'Unknown',
                    url: wmpView.url,
                    thumbnailUrl: wmpView.videoPreviewUrl,
                    location: {
                        lat: c.location?.latitude || 0,
                        lon: c.location?.longitude || 0
                    },
                    regionId: 'co',
                    provider: 'cdot'
                };
            })
            .filter((c: any): c is Camera => c !== null);
    } catch (err) {
        logger.error('Failed to fetch CDOT cameras', err);
        return [];
    }
}

// --- Caltrans Logic ---
const CALTRANS_DISTRICTS = ['3', '9', '10'];

async function fetchCaltransCameras(districts: string[]): Promise<Camera[]> {
    const promises = districts.map(async (d) => {
        const url = `https://cwwp2.dot.ca.gov/data/d${d}/cctv/cctvStatusD${d.padStart(2, '0')}.json`;
        try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const json: any = await res.json();
            return json.data
                .filter((item: any) => item.cctv.inService === 'true')
                .map(({ cctv }: any) => ({
                    id: `d${d}-${cctv.index}`,
                    name: cctv.location.locationName,
                    url: cctv.imageData.streamingVideoURL || cctv.imageData.static.currentImageURL,
                    thumbnailUrl: cctv.imageData.static.currentImageURL,
                    location: {
                        lat: parseFloat(cctv.location.latitude),
                        lon: parseFloat(cctv.location.longitude)
                    },
                    regionId: 'tahoe',
                    provider: 'caltrans'
                }));
        } catch (err) {
            logger.error(`Failed to fetch Caltrans cameras district ${d}`, err);
            return [];
        }
    });

    const results = await Promise.all(promises);
    return results.flat();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const districtsParam = searchParams.get('districts');

    let cameras: Camera[] = [];

    try {
        if (region === 'co') {
            cameras = await fetchCdotCameras();
        } else if (region === 'tahoe' || region === 'canv') {
            const districts = districtsParam ? districtsParam.split(',') : CALTRANS_DISTRICTS;
            cameras = await fetchCaltransCameras(districts);
        }

        return NextResponse.json(cameras);
    } catch (error) {
        logger.error('Error in v1/roads/cameras', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
