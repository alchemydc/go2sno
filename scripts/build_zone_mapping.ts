import { CaicClient } from '../src/services/caic/client';

// Zone IDs we know from the zones API
const KNOWN_ZONES = {
    'aspen': 'eea3da9e-28a3-4327-906e-132937649559',
    'front-range': '5c662518-cc64-4789-bcc1-9b12f601fab8',
    'gunnison': '9afde579-050d-4b04-ad09-09cf03c48f30',
    'northern-san-juan': 'd074e08f-cc75-41b1-93a0-04637480c832',
    'sangre-de-cristo': '8523a351-14bf-4d52-b04c-5cf6af58ac01',
    'sawatch': '4f0c202d-65d2-4f39-91c3-ab67abd0783c',
    'southern-san-juan': '7bd2ea21-f419-42a7-ad85-d1b8dfe0ddfc',
    'steamboat-and-flat-tops': 'fb3cd5fd-12a9-47a4-be58-7e835f6408e6',
    'vail-and-summit-county': '0b270614-a0d3-4368-a011-9a6594ea857e',
};

async function main() {
    const client = new CaicClient();
    const forecasts = await client.getForecast(new Date().toISOString());

    console.log('\n=== Empirical Zone ID to Forecast Area ID Mapping ===\n');
    console.log('Based on comparing zone IDs with forecast polygon arrays...\n');

    const avalancheForecasts = forecasts.filter(f => f.type === 'avalancheforecast');

    // For each known zone, try to find which forecast contains its ID in the polygons
    for (const [zoneSlug, zoneId] of Object.entries(KNOWN_ZONES)) {
        console.log(`\nZone: ${zoneSlug} (ID: ${zoneId})`);

        // Find forecasts that contain this zone ID in their polygons
        const matchingForecasts = avalancheForecasts.filter((f: any) =>
            f.polygons && f.polygons.includes(zoneId)
        );

        if (matchingForecasts.length > 0) {
            const f = matchingForecasts[0] as any;
            console.log(`  ✓ MATCH FOUND!`);
            console.log(`    Forecast AreaId: ${f.areaId}`);
            console.log(`    PublicName: ${f.publicName}`);
            console.log(`    Mapping: '${zoneSlug}' => '${f.areaId}'`);
        } else {
            console.log(`  ✗ No forecast contains this zone ID in polygons`);
        }
    }

    console.log('\n\n=== TypeScript Mapping Object ===\n');
    console.log('const ZONE_SLUG_TO_AREA_ID: Record<string, string> = {');

    for (const [zoneSlug, zoneId] of Object.entries(KNOWN_ZONES)) {
        const matchingForecasts = avalancheForecasts.filter((f: any) =>
            f.polygons && f.polygons.includes(zoneId)
        );

        if (matchingForecasts.length > 0) {
            const f = matchingForecasts[0] as any;
            console.log(`    '${zoneSlug}': '${f.areaId}',`);
        }
    }
    console.log('};');
}

main().catch(console.error);
