export interface Region {
    id: string;
    name: string;
    displayName: string; // e.g., "Colorado"
    center: [number, number]; // [lng, lat] for map center
    zoom: number; // Default zoom level
    bounds?: [[number, number], [number, number]]; // Max bounds [[minLng, minLat], [maxLng, maxLat]]
    defaultOrigin?: string;
    defaultDestination?: string;

    // Key locations for "From" and "To" dropdowns in this region
    locations: {
        id: string;
        name: string;
        coordinates: string; // "lat,lon"
        type: 'gateway' | 'resort' | 'town';
    }[];

    // IDs of resorts that belong to this region
    resortIds: string[];

    // Service support flags
    services: {
        weather: boolean; // NWS - supported everywhere
        roads: boolean; // COtrip, UDOT, Caltrans
        avalanche: boolean; // CAIC, UAC, SAC
    };
}

export const REGIONS: Record<string, Region> = {
    co: {
        id: 'co',
        name: 'Colorado',
        displayName: 'Colorado',
        center: [-106.0, 39.5], // Frisco area
        zoom: 8,
        bounds: [[-109.5, 36.5], [-102.0, 41.5]],
        defaultOrigin: 'boulder',
        defaultDestination: 'leadville',
        locations: [
            { id: 'boulder', name: 'Boulder', coordinates: '40.0150,-105.2705', type: 'gateway' },
            { id: 'denver', name: 'Denver', coordinates: '39.7392,-104.9903', type: 'gateway' },
            { id: 'frisco', name: 'Frisco', coordinates: '39.5744,-106.0975', type: 'town' },
            { id: 'copper', name: 'Copper Mountain', coordinates: '39.5021,-106.1510', type: 'resort' },
            { id: 'breck', name: 'Breckenridge', coordinates: '39.4817,-106.0384', type: 'resort' },
            { id: 'keystone', name: 'Keystone', coordinates: '39.6084,-105.9436', type: 'resort' },
            { id: 'abasin', name: 'Arapahoe Basin', coordinates: '39.6425,-105.8719', type: 'resort' },
            { id: 'vail', name: 'Vail', coordinates: '39.6403,-106.3742', type: 'resort' },
            { id: 'winterpark', name: 'Winter Park', coordinates: '39.8917,-105.7631', type: 'resort' },
            { id: 'steamboat', name: 'Steamboat', coordinates: '40.4848,-106.8317', type: 'resort' },
            { id: 'eldora', name: 'Eldora', coordinates: '39.9382,-105.5835', type: 'resort' },
            { id: 'skicooper', name: 'Ski Cooper', coordinates: '39.3627,-106.3020', type: 'resort' },
            { id: 'leadville', name: 'Leadville', coordinates: '39.2508,-106.2925', type: 'town' },
            { id: 'silverton', name: 'Silverton', coordinates: '37.8119,-107.6639', type: 'town' },
            { id: 'wolfcreek', name: 'Wolf Creek', coordinates: '37.3869,-106.8830', type: 'resort' },
            { id: 'crestedbutte', name: 'Crested Butte', coordinates: '38.8697,-106.9878', type: 'resort' },
            { id: 'aspen', name: 'Aspen', coordinates: '39.1911,-106.8175', type: 'resort' },
            { id: 'telluride', name: 'Telluride', coordinates: '37.9375,-107.8123', type: 'resort' },
            { id: 'beavercreek', name: 'Beaver Creek', coordinates: '39.6042,-106.5165', type: 'resort' },
            { id: 'monarch', name: 'Monarch', coordinates: '38.5458,-106.3258', type: 'resort' },
        ],
        resortIds: ['copper', 'breck', 'keystone', 'abasin', 'vail', 'winterpark', 'steamboat', 'eldora', 'skicooper', 'aspen', 'telluride', 'beavercreek', 'monarch'],
        services: {
            weather: true,
            roads: true,
            avalanche: true,
        },
    },
    ut: {
        id: 'ut',
        name: 'Utah',
        displayName: 'Utah',
        center: [-111.8, 40.6], // Salt Lake area
        zoom: 9,
        bounds: [[-112.5, 40.0], [-111.0, 41.2]],
        locations: [
            { id: 'slc', name: 'Salt Lake City', coordinates: '40.7608,-111.8910', type: 'gateway' },
            { id: 'parkcity', name: 'Park City', coordinates: '40.6461,-111.4980', type: 'resort' },
            { id: 'deervalley', name: 'Deer Valley', coordinates: '40.6374,-111.4783', type: 'resort' },
            { id: 'alta', name: 'Alta', coordinates: '40.5885,-111.6381', type: 'resort' },
            { id: 'snowbird', name: 'Snowbird', coordinates: '40.5836,-111.6575', type: 'resort' },
            { id: 'brighton', name: 'Brighton', coordinates: '40.5983,-111.5831', type: 'resort' },
            { id: 'solitude', name: 'Solitude', coordinates: '40.6199,-111.5913', type: 'resort' },
        ],
        resortIds: ['parkcity', 'deervalley', 'alta', 'snowbird', 'brighton', 'solitude'],
        services: {
            weather: true,
            roads: false, // Future: UDOT
            avalanche: false, // Future: UAC
        },
    },
    canv: {
        id: 'canv',
        name: 'Tahoe',
        displayName: 'Tahoe',
        center: [-120.0, 39.0], // Tahoe area
        zoom: 9,
        bounds: [[-123.0, 36.9], [-119.0, 40.0]],
        locations: [
            { id: 'sf', name: 'San Francisco', coordinates: '37.7749,-122.4194', type: 'gateway' },
            { id: 'oakland', name: 'Oakland', coordinates: '37.8044,-122.2712', type: 'gateway' },
            { id: 'sacramento', name: 'Sacramento', coordinates: '38.5816,-121.4944', type: 'gateway' },
            { id: 'la', name: 'Los Angeles', coordinates: '34.0522,-118.2437', type: 'gateway' },
            { id: 'ventura', name: 'Ventura', coordinates: '34.2746,-119.2290', type: 'gateway' },
            { id: 'santacruz', name: 'Santa Cruz', coordinates: '36.9741,-122.0308', type: 'gateway' },
            { id: 'reno', name: 'Reno', coordinates: '39.5296,-119.8138', type: 'gateway' },
            { id: 'tahoe', name: 'South Lake Tahoe', coordinates: '38.9332,-119.9772', type: 'town' },
            { id: 'incline', name: 'Incline Village', coordinates: '39.2514,-119.9772', type: 'town' },
            { id: 'heavenly', name: 'Heavenly', coordinates: '38.9352,-119.9403', type: 'resort' },
            { id: 'palisades', name: 'Palisades Tahoe', coordinates: '39.1970,-120.2356', type: 'resort' },
            { id: 'alpinemeadows', name: 'Alpine Meadows', coordinates: '39.1644,-120.2384', type: 'resort' },
            { id: 'sugarbowl', name: 'Sugar Bowl', coordinates: '39.3090,-120.3340', type: 'resort' },
            { id: 'homewood', name: 'Homewood', coordinates: '39.0779,-120.1601', type: 'resort' },
            { id: 'northstar', name: 'Northstar', coordinates: '39.2730,-120.1192', type: 'resort' },
            { id: 'kirkwood', name: 'Kirkwood', coordinates: '38.6810,-120.0659', type: 'resort' },
            { id: 'mammoth', name: 'Mammoth', coordinates: '37.6485,-118.9721', type: 'resort' },
        ],
        resortIds: ['heavenly', 'palisades', 'alpinemeadows', 'sugarbowl', 'homewood', 'northstar', 'kirkwood', 'mammoth'],
        services: {
            weather: true,
            roads: false, // Future: Caltrans
            avalanche: false, // Future: SAC
        },
    },
};

export const DEFAULT_REGION_ID = 'co';

export function getRegion(regionId: string): Region {
    return REGIONS[regionId] || REGIONS[DEFAULT_REGION_ID];
}

export function getAllRegions(): Region[] {
    return Object.values(REGIONS);
}
