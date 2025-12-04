import { CaicClient } from '../src/services/caic/client';

async function main() {
    // Get zone data
    const zoneResponse = await fetch('https://api.avalanche.state.co.us/api/v2/zones.json');
    const zones = await zoneResponse.json();

    // Create a map of zone IDs to zone names
    const zoneMap = new Map();
    zones.forEach((z: any) => {
        zoneMap.set(z.id, { title: z.title, slug: z.slug, category: z.category });
    });

    // Get today's forecasts
    const client = new CaicClient();
    const forecasts = await client.getForecast(new Date().toISOString());

    console.log('\n=== Mapping Forecasts to Zones (via polygons) ===\n');

    const avalancheForecasts = forecasts.filter(f => f.type === 'avalancheforecast');

    for (const forecast of avalancheForecasts) {
        const f = forecast as any;
        console.log(`PublicName: ${f.publicName}`);
        console.log(`AreaId: ${f.areaId}`);
        console.log(`Polygons (${f.polygons?.length || 0}):`, f.polygons);

        // Map polygon IDs to zone names
        if (f.polygons && f.polygons.length > 0) {
            const zoneNames = f.polygons
                .map((polyId: string) => {
                    const zone = zoneMap.get(polyId);
                    return zone ? `${zone.title} (${zone.category})` : `Unknown (${polyId})`;
                })
                .join(', ');
            console.log(`Zone Names: ${zoneNames}`);
        }

        console.log('---\n');
    }
}

main().catch(console.error);
