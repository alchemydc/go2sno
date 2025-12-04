
const turf = require('@turf/point-to-line-distance');
const helpers = require('@turf/helpers');

const point = helpers.point;
const lineString = helpers.lineString;

// Approximate coordinates
// Boulder: -105.2705, 40.0150
// Frisco: -106.0975, 39.5744
// A point far away: Colorado Springs: -104.8214, 38.8339

const route = lineString([
    [-105.2705, 40.0150], // Boulder
    [-105.1, 39.8],       // Intermediate
    [-106.0975, 39.5744]  // Frisco
]);

const nearPoint = point([-105.15, 39.85]); // Near intermediate
const farPoint = point([-104.8214, 38.8339]); // Colorado Springs

try {
    const p = point([undefined, undefined]);
    console.log('Point created:', p);
} catch (e) {
    console.log('Point creation failed:', e.message);
}
