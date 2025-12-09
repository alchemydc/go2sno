import { NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

// Caltrans CWWP2 API response types
interface CaltransLocation {
    district: string;
    locationName: string;
    longitude: string;
    latitude: string;
    nearbyPlace: string;
    county: string;
    route: string;
}

interface CaltransImageData {
    streamingVideoURL?: string;
    static: {
        currentImageURL: string;
        currentImageUpdateFrequency: string;
    };
}

interface CaltransCCTV {
    index: string;
    location: CaltransLocation;
    inService: string;
    imageData: CaltransImageData;
}

interface CaltransResponse {
    data: Array<{ cctv: CaltransCCTV }>;
}

// Camera interface matching the existing application
interface Camera {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    latitude: number;
    longitude: number;
}

// Default districts for winter driving in Sierra Nevada
const DEFAULT_DISTRICTS = ['3', '9', '10'];

async function fetchDistrictCameras(district: string): Promise<Camera[]> {
    const url = `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${district.padStart(2, '0')}.json`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            logger.error(`Failed to fetch district ${district}: ${response.statusText}`);
            return [];
        }

        const data: CaltransResponse = await response.json();

        return data.data
            .filter(({ cctv }) => cctv.inService === 'true')
            .map(({ cctv }) => ({
                id: `d${district}-${cctv.index}`,
                name: cctv.location.locationName,
                // Prioritize HLS stream, fallback to static image
                url: cctv.imageData.streamingVideoURL || cctv.imageData.static.currentImageURL,
                thumbnailUrl: cctv.imageData.static.currentImageURL,
                latitude: parseFloat(cctv.location.latitude),
                longitude: parseFloat(cctv.location.longitude),
            }));
    } catch (error) {
        logger.error(`Error fetching district ${district}:`, error);
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const districtsParam = searchParams.get('districts');

        // Parse districts from query param or use defaults
        const districts = districtsParam
            ? districtsParam.split(',').map(d => d.trim())
            : DEFAULT_DISTRICTS;

        // Fetch cameras from all requested districts concurrently
        const cameraArrays = await Promise.all(
            districts.map(district => fetchDistrictCameras(district))
        );

        // Flatten all camera arrays into single array
        const cameras = cameraArrays.flat();

        return NextResponse.json(cameras);
    } catch (error) {
        logger.error('Error in caltrans-cctv API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch camera data' },
            { status: 500 }
        );
    }
}
