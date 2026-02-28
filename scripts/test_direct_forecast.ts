import { CaicClient } from '../src/services/caic/client';

async function main() {
    const client = new CaicClient();
    const forecasts = await client.getForecast(new Date().toISOString());

    // Get zone data
    const zoneResponse = await fetch('https://api.avalanche.state.co.us/api/v2/zones.json');
    const zones = await zoneResponse.json();

    // Filter to get only backcountry zones
    const backcountryZones = zones.filter((z: any) =>
        z.type === 'backcountry_zone' && z.category === 'backcountry'
    );

    console.log('\n=== Testing Zone Slug to Forecast Mapping ===\n');

    // For each backcountry zone, let's try to find if there's a forecast that could match
    for (const zone of backcountryZones) {
        console.log(`\nZone: ${zone.title} (slug: ${zone.slug}, id: ${zone.id})`);

        // Try the direct forecast endpoint for this zone
        try {
            const directUrl = `https://avalanche.state.co.us/api-proxy/avid?_api_proxy_uri=/products/forecasts/${zone.slug}`;
            const response = await fetch(directUrl);
            if (response.ok) {
                const data = await response.json();
                console.log(`  ✓ Direct forecast available! AreaId: ${data.areaId || data.id || 'unknown'}`);
            } else {
                console.log(`  ✗ No direct forecast (${response.status})`);
            }
        } catch (e) {
            console.log(`  ✗ Error fetching direct forecast`);
        }
    }
}

main().catch(console.error);
