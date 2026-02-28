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

    // Service Provider Configuration
    providers: {
        road: 'cdot' | 'caltrans' | 'udot' | 'stub';
        avalanche: 'caic' | 'uac' | 'sac' | 'stub';
    };

    // Priority keywords for camera sorting in this region
    // key: lowercase keyword, value: score bonus
    cameraKeywords?: Record<string, number>;
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
        resortIds: ['copper', 'breck', 'keystone', 'abasin', 'vail', 'winterpark', 'steamboat', 'eldora', 'skicooper', 'aspen', 'telluride', 'beavercreek', 'monarch', 'crestedbutte'],
        services: {
            weather: true,
            roads: true,
            avalanche: true,
        },
        providers: {
            road: 'cdot',
            avalanche: 'caic',
        },
        cameraKeywords: {
            'eisenhower': 20,
            'tunnel': 20,
            'johnson': 20,
            'fremont': 10,
            'vail': 10,
            'berthoud': 10,
            'loveland': 5,
            'summit': 5
        }
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
        providers: {
            road: 'udot', // Will use stub for now
            avalanche: 'uac', // Will use stub for now
        },
        cameraKeywords: {
            'parley': 20,
            'cottonwood': 20,
            'canyon': 10,
            'summit': 10
        }
    },
    tahoe: {
        id: 'tahoe',
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
        providers: {
            road: 'caltrans',
            avalanche: 'sac', // Will use stub for now
        },
        cameraKeywords: {
            'donner': 20,
            'summit': 10,
            'echo': 10,
        }
    },
    socal: {
        id: 'socal',
        name: 'Southern California',
        displayName: 'SoCal',
        center: [-117.9, 34.0], // LA/San Bernardino area
        zoom: 8,
        bounds: [[-120.5, 32.5], [-116.0, 35.5]],
        locations: [
            { id: 'la', name: 'Los Angeles', coordinates: '34.0522,-118.2437', type: 'gateway' },
            { id: 'ventura', name: 'Ventura', coordinates: '34.2746,-119.2290', type: 'gateway' },
            { id: 'santabarbara', name: 'Santa Barbara', coordinates: '34.4208,-119.6982', type: 'gateway' },
            { id: 'santamonica', name: 'Santa Monica', coordinates: '34.0195,-118.4912', type: 'gateway' },
            { id: 'hollywood', name: 'Hollywood', coordinates: '34.0928,-118.3287', type: 'gateway' },
            { id: 'sandiego', name: 'San Diego', coordinates: '32.7157,-117.1611', type: 'gateway' },
            { id: 'mammoth', name: 'Mammoth', coordinates: '37.6485,-118.9721', type: 'resort' },
            { id: 'bigbear', name: 'Big Bear', coordinates: '34.2439,-116.9114', type: 'resort' },
            { id: 'baldy', name: 'Mt Baldy', coordinates: '34.2708,-117.6214', type: 'resort' },
        ],
        resortIds: ['mammoth', 'bigbear', 'baldy'],
        services: {
            weather: true,
            roads: true, // Caltrans
            avalanche: false,
        },
        providers: {
            road: 'caltrans',
            avalanche: 'stub',
        },
        cameraKeywords: {
            'cajon': 20,
            'grapevine': 20,
            'bear': 10,
            'summit': 10
        }
    },
    pnw: {
        id: 'pnw',
        name: 'Pacific Northwest',
        displayName: 'PNW',
        center: [-121.5, 47.0], // Cascades area
        zoom: 7,
        bounds: [[-124.0, 43.5], [-117.0, 51.5]],
        locations: [
            { id: 'seattle', name: 'Seattle', coordinates: '47.6062,-122.3321', type: 'gateway' },
            { id: 'portland', name: 'Portland', coordinates: '45.5152,-122.6784', type: 'gateway' },
            { id: 'vancouver', name: 'Vancouver', coordinates: '49.2827,-123.1207', type: 'gateway' },
            { id: 'crystal', name: 'Crystal Mountain', coordinates: '46.9282,-121.5045', type: 'resort' },
            { id: 'snoqualmie', name: 'The Summit at Snoqualmie', coordinates: '47.4239,-121.4132', type: 'resort' },
            { id: 'stevens', name: 'Stevens Pass', coordinates: '47.7441,-121.0890', type: 'resort' },
            { id: 'bachelor', name: 'Mt. Bachelor', coordinates: '43.9774,-121.6885', type: 'resort' },
            { id: 'mthood', name: 'Mt. Hood Meadows', coordinates: '45.3344,-121.6663', type: 'resort' },
            { id: 'whitepass', name: 'White Pass', coordinates: '46.6375,-121.3912', type: 'resort' },
            { id: 'missionridge', name: 'Mission Ridge', coordinates: '47.2917,-120.3980', type: 'resort' },
            { id: 'whistler', name: 'Whistler Blackcomb', coordinates: '50.1163,-122.9574', type: 'resort' },
            { id: 'cypress', name: 'Cypress Mountain', coordinates: '49.3959,-123.2045', type: 'resort' },
            { id: 'sunpeaks', name: 'Sun Peaks', coordinates: '50.8845,-119.8864', type: 'resort' },
            { id: 'revelstoke', name: 'Revelstoke', coordinates: '50.9585,-118.1633', type: 'resort' },
            { id: 'red', name: 'RED Mountain', coordinates: '49.1026,-117.8188', type: 'resort' },
            { id: 'panorama', name: 'Panorama', coordinates: '50.4856,-116.1425', type: 'resort' },
        ],
        resortIds: [
            'crystal', 'snoqualmie', 'stevens', 'bachelor', 'mthood', 'whitepass',
            'missionridge', 'whistler', 'cypress', 'sunpeaks', 'revelstoke', 'red', 'panorama'
        ],
        services: {
            weather: true,
            roads: false, // Future: WSDOT/ODOT
            avalanche: false, // Future: NWAC/Avalanche Canada
        },
        providers: {
            road: 'stub',
            avalanche: 'stub',
        },
        cameraKeywords: {
            'snoqualmie': 20,
            'stevens': 20,
            'blewett': 20,
            'white': 10,
            'hood': 10,
            'crystal': 10,
            'baker': 10,
            'canyon': 5
        }
    },
    japan: {
        id: 'japan',
        name: 'Japan',
        displayName: 'Japan',
        center: [139.0, 38.0], // Sea of Japan / Central Honshu
        zoom: 6,
        bounds: [[130.0, 31.0], [146.0, 46.0]],
        locations: [
            { id: 'tokyo', name: 'Tokyo', coordinates: '35.6762,139.6503', type: 'gateway' },
            { id: 'sapporo', name: 'Sapporo', coordinates: '43.0618,141.3545', type: 'gateway' },
            { id: 'niseko', name: 'Niseko', coordinates: '42.8048,140.6874', type: 'town' },
            { id: 'nagano', name: 'Nagano', coordinates: '36.6486,138.1942', type: 'town' },
            { id: 'annupuri', name: 'Niseko Annupuri', coordinates: '42.8465,140.6558', type: 'resort' },
            { id: 'hirafu', name: 'Niseko Grand Hirafu', coordinates: '42.8622,140.7042', type: 'resort' },
            { id: 'hanazono', name: 'Niseko Hanazono', coordinates: '42.8711,140.7180', type: 'resort' },
            { id: 'village', name: 'Niseko Village', coordinates: '42.8533,140.6782', type: 'resort' },
            { id: 'rusutsu', name: 'Rusutsu', coordinates: '42.7533,140.9056', type: 'resort' },
            { id: 'furano', name: 'Furano', coordinates: '43.3421,142.3832', type: 'resort' },
            { id: 'hakuba', name: 'Hakuba Valley', coordinates: '36.6982,137.8619', type: 'resort' },
            { id: 'lottearai', name: 'Lotte Arai', coordinates: '36.9997,138.1814', type: 'resort' },
            { id: 'appi', name: 'Appi Kogen', coordinates: '40.0017,140.9714', type: 'resort' },
            { id: 'zao', name: 'Zao Onsen', coordinates: '38.1705,140.4017', type: 'resort' },
            { id: 'myoko', name: 'Myoko Suginohara', coordinates: '36.8539,138.1558', type: 'resort' },
        ],
        resortIds: [
            'annupuri', 'hirafu', 'hanazono', 'village', 'rusutsu', 'furano',
            'hakuba', 'lottearai', 'appi', 'zao', 'myoko'
        ],
        services: {
            weather: true,
            roads: false,
            avalanche: false,
        },
        providers: {
            road: 'stub',
            avalanche: 'stub',
        },
        cameraKeywords: {}
    },
    nz: {
        id: 'nz',
        name: 'New Zealand',
        displayName: 'New Zealand',
        center: [170.0, -44.0], // South Island
        zoom: 6,
        bounds: [[165.0, -47.0], [175.0, -40.0]],
        locations: [
            { id: 'queenstown', name: 'Queenstown', coordinates: '-45.0312,168.6626', type: 'gateway' },
            { id: 'christchurch', name: 'Christchurch', coordinates: '-43.5321,172.6362', type: 'gateway' },
            { id: 'wanaka', name: 'Wanaka', coordinates: '-44.7000,169.1500', type: 'town' },
            { id: 'coronet', name: 'Coronet Peak', coordinates: '-44.9269,168.7361', type: 'resort' },
            { id: 'remarkables', name: 'The Remarkables', coordinates: '-45.0533,168.8143', type: 'resort' },
            { id: 'mthutt', name: 'Mt Hutt', coordinates: '-43.4667,171.5333', type: 'resort' },
            { id: 'cardrona', name: 'Cardrona', coordinates: '-44.8739,168.9500', type: 'resort' },
            { id: 'treblecone', name: 'Treble Cone', coordinates: '-44.6340,168.8960', type: 'resort' },
        ],
        resortIds: [
            'coronet', 'remarkables', 'mthutt', 'cardrona', 'treblecone'
        ],
        services: {
            weather: true,
            roads: false,
            avalanche: false,
        },
        providers: {
            road: 'stub',
            avalanche: 'stub',
        },
        cameraKeywords: {}
    },
    'us-east': {
        id: 'us-east',
        name: 'East Coast',
        displayName: 'East Coast',
        center: [-74.0, 42.0], // Mid-point (NY/New England)
        zoom: 6,
        bounds: [[-80.0, 38.0], [-68.0, 46.0]],
        locations: [
            { id: 'nyc', name: 'New York City', coordinates: '40.7128,-74.0060', type: 'gateway' },
            { id: 'boston', name: 'Boston', coordinates: '42.3601,-71.0589', type: 'gateway' },
            { id: 'burlington', name: 'Burlington', coordinates: '44.4759,-73.2121', type: 'town' },
            { id: 'stowe', name: 'Stowe', coordinates: '44.5298,-72.7858', type: 'resort' },
            { id: 'okemo', name: 'Okemo', coordinates: '43.4014,-72.7167', type: 'resort' },
            { id: 'mtsnow', name: 'Mount Snow', coordinates: '42.9598,-72.9223', type: 'resort' },
            { id: 'killington', name: 'Killington', coordinates: '43.6256,-72.7972', type: 'resort' },
            { id: 'sugarbush', name: 'Sugarbush', coordinates: '44.1352,-72.9281', type: 'resort' },
            { id: 'sundayriver', name: 'Sunday River', coordinates: '44.4738,-70.8574', type: 'resort' },
            { id: 'sugarloaf', name: 'Sugarloaf', coordinates: '45.0315,-70.3132', type: 'resort' },
            { id: 'loon', name: 'Loon Mountain', coordinates: '44.0360,-71.6212', type: 'resort' },
            { id: 'stratton', name: 'Stratton', coordinates: '43.1114,-72.9038', type: 'resort' },
            { id: 'jaypeak', name: 'Jay Peak', coordinates: '44.9242,-72.5257', type: 'resort' },
            { id: 'hunter', name: 'Hunter Mountain', coordinates: '42.2023,-74.2290', type: 'resort' },
            { id: 'windham', name: 'Windham', coordinates: '42.2883,-74.2557', type: 'resort' },
            { id: 'whiteface', name: 'Whiteface', coordinates: '44.3659,-73.9026', type: 'resort' },
            { id: 'snowshoe', name: 'Snowshoe', coordinates: '38.4093,-79.9939', type: 'resort' },
            { id: 'blue', name: 'Blue Mountain', coordinates: '40.8223,-75.5133', type: 'resort' },
            { id: 'camelback', name: 'Camelback', coordinates: '41.0514,-75.3553', type: 'resort' },
            { id: 'sevensprings', name: 'Seven Springs', coordinates: '40.0232,-79.2990', type: 'resort' },
        ],
        resortIds: [
            'stowe', 'okemo', 'mtsnow', 'killington', 'sugarbush', 'sundayriver',
            'sugarloaf', 'loon', 'stratton', 'jaypeak', 'hunter', 'windham',
            'whiteface', 'snowshoe', 'blue', 'camelback', 'sevensprings'
        ],
        services: {
            weather: true,
            roads: false,
            avalanche: false,
        },
        providers: {
            road: 'stub',
            avalanche: 'stub',
        },
        cameraKeywords: {}
    },
};

export const DEFAULT_REGION_ID = 'co';

export function getRegion(regionId: string): Region {
    return REGIONS[regionId] || REGIONS[DEFAULT_REGION_ID];
}

export function getAllRegions(): Region[] {
    return Object.values(REGIONS);
}
