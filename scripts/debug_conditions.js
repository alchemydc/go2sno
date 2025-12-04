
const apiKey = process.env.COTRIP_API_KEY;

if (!apiKey) {
    console.error('COTRIP_API_KEY is not set');
    process.exit(1);
}

async function fetchConditions() {
    try {
        const res = await fetch(`https://data.cotrip.org/api/v1/roadConditions?apiKey=${apiKey}&limit=5`);
        if (!res.ok) {
            throw new Error(`Error: ${res.statusText}`);
        }
        const data = await res.json();
        const features = data.features;
        if (features && features.length > 0) {
            const f = features[0];
            console.log(JSON.stringify({ geometry: f.geometry, propertiesKeys: Object.keys(f.properties) }, null, 2));
        } else {
            console.log('No conditions found');
        }
    } catch (error) {
        console.error(error);
    }
}

fetchConditions();
