
const turf = require('@turf/point-to-line-distance');
const helpers = require('@turf/helpers');
const { point, lineString } = helpers;

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const COTRIP_API_KEY = process.env.COTRIP_API_KEY;

if (!TOMTOM_API_KEY || !COTRIP_API_KEY) {
    console.error('Missing API keys');
    process.exit(1);
}

// Locations
const boulder = '40.0150,-105.2705';
const frisco = '39.5744,-106.0975';

async function run() {
    try {
        // 1. Fetch Route
        console.log('Fetching route...');
        const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${boulder}:${frisco}/json?key=${TOMTOM_API_KEY}&traffic=true`;
        const routeRes = await fetch(routeUrl);
        const routeData = await routeRes.json();

        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error('No route found');
        }

        const points = routeData.routes[0].legs[0].points;
        const coordinates = points.map(p => [p.longitude, p.latitude]);
        const routeLine = lineString(coordinates);
        console.log(`Route has ${coordinates.length} points`);

        // 2. Fetch Incidents
        console.log('Fetching incidents...');
        const incidentsUrl = `https://data.cotrip.org/api/v1/incidents?apiKey=${COTRIP_API_KEY}&limit=100`;
        const incidentsRes = await fetch(incidentsUrl);
        const incidentsData = await incidentsRes.json();
        const incidents = incidentsData.features || [];
        console.log(`Fetched ${incidents.length} incidents`);

        // 3. Filter
        const MAX_DISTANCE_MILES = 10;
        console.log(`Filtering with ${MAX_DISTANCE_MILES} mile buffer...`);

        const filtered = incidents.filter(incident => {
            let coords;
            if (incident.geometry.type === 'MultiPoint') {
                coords = incident.geometry.coordinates[0];
            } else if (incident.geometry.type === 'Point') {
                coords = incident.geometry.coordinates;
            } else {
                return false;
            }

            const pt = point(coords);
            const distance = turf.default(pt, routeLine, { units: 'miles' });

            if (distance <= MAX_DISTANCE_MILES) {
                console.log(`[KEEP] ${incident.properties.type} - Dist: ${distance.toFixed(2)} miles - Loc: ${coords}`);
                return true;
            } else {
                // console.log(`[DROP] ${incident.properties.type} - Dist: ${distance.toFixed(2)} miles`);
                return false;
            }
        });

        console.log(`\nSummary: Kept ${filtered.length} out of ${incidents.length} incidents.`);

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
