import { NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

// Caltrans CWWP2 Chain Control API response types
interface CaltransLocation {
    district: string;
    locationName: string;
    longitude: string;
    latitude: string;
    nearbyPlace: string;
    county: string;
    route: string;
    routeSuffix: string;
    direction: string;
    elevation: string;
}

interface CaltransStatusData {
    statusTimestamp: {
        statusDate: string;
        statusTime: string;
    };
    status: string; // e.g., "R-0", "R-1", "R-2"
    statusDescription: string;
}

interface CaltransChainControl {
    index: string;
    location: CaltransLocation;
    inService: string;
    statusData: CaltransStatusData;
    recordTimestamp: {
        recordDate: string;
        recordTime: string;
    };
}

interface CaltransChainControlResponse {
    data: Array<{ cc: CaltransChainControl }>;
}

// RoadCondition interface matching the existing application
interface RoadCondition {
    id: string;
    type: string;
    properties: {
        type: string;
        routeName: string;
        primaryLatitude: number;
        primaryLongitude: number;
        currentConditions: {
            conditionDescription: string;
        }[];
    };
}

// Default districts for winter driving in Sierra Nevada
const DEFAULT_DISTRICTS = ['3', '9', '10'];

async function fetchDistrictChainControls(district: string): Promise<RoadCondition[]> {
    const url = `https://cwwp2.dot.ca.gov/data/d${district}/cc/ccStatusD${district.padStart(2, '0')}.json`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            logger.error(`Failed to fetch chain control for district ${district}: ${response.statusText}`);
            return [];
        }

        const data: CaltransChainControlResponse = await response.json();

        return data.data
            .filter(({ cc }) => cc.inService === 'true')
            .map(({ cc }) => ({
                id: cc.index,
                type: 'ChainControl',
                properties: {
                    type: 'Chain Control',
                    routeName: `${cc.location.route} ${cc.location.locationName}`,
                    primaryLatitude: parseFloat(cc.location.latitude),
                    primaryLongitude: parseFloat(cc.location.longitude),
                    currentConditions: [{
                        conditionDescription: `${cc.statusData.status}: ${cc.statusData.statusDescription}`,
                    }],
                },
            }));
    } catch (error) {
        logger.error(`Error fetching chain control for district ${district}:`, error);
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

        // Fetch chain controls from all requested districts concurrently
        const conditionArrays = await Promise.all(
            districts.map(district => fetchDistrictChainControls(district))
        );

        // Flatten all condition arrays into single array
        const conditions = conditionArrays.flat();

        return NextResponse.json(conditions);
    } catch (error) {
        logger.error('Error in caltrans-chain-control API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chain control data' },
            { status: 500 }
        );
    }
}
