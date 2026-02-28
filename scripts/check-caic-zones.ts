
import { CaicClient } from '../src/services/caic/client';
import { logger } from '../src/utils/logger';

async function checkZones() {
    console.log('Checking CAIC zones for drift...');
    const client = new CaicClient();

    try {
        const forecasts = await client.getForecast(new Date().toISOString());
        console.log(`Fetched ${forecasts.length} forecast items.`);

        // 1. Get all valid Area IDs from API (where rating is not 'noForecast')
        const validAreaIds = new Set<string>();
        const validAreas: any[] = [];

        forecasts.forEach((f: any) => {
            if (f.type === 'avalancheforecast') {
                const today = f.dangerRatings?.days?.[0];
                if (today && today.alp !== 'noForecast') {
                    validAreaIds.add(f.areaId);
                    validAreas.push({
                        id: f.areaId,
                        publicName: f.publicName,
                        title: f.title
                    });
                }
            }
        });

        console.log(`Found ${validAreaIds.size} valid forecast areas currently active.`);

        // 2. Check internal mappings
        // Access private map via casting to any (script hack)
        const mappedZones = (client as any).ZONE_SLUG_TO_AREA_ID as Record<string, string>;
        const knownZones = Object.keys(mappedZones);

        let issuesFound = 0;

        console.log('\n--- Checking Internal Mappings ---');
        for (const zone of knownZones) {
            const mappedId = mappedZones[zone];

            if (!validAreaIds.has(mappedId)) {
                console.error(`[FAIL] Zone '${zone}' maps to ID ${mappedId} which has NO VALID FORECAST.`);
                issuesFound++;
            } else {
                console.log(`[OK] Zone '${zone}' maps to valid ID.`);
            }
        }

        if (issuesFound > 0) {
            console.error(`\nFound ${issuesFound} issues with zone mappings!`);

            console.log('\n--- HOW TO FIX ---');
            console.log('1. Look at the "Available Valid Areas" list below.');
            console.log('2. Find the ID that corresponds to the failing zone (check publicName for zone numbers).');
            console.log('   - Example: Front Range includes zones 20, 21, etc.');
            console.log('3. Update "src/services/caic/client.ts" with the new Area ID.');
            console.log('4. Run this script again to verify: npx tsx scripts/check-caic-zones.ts');
            console.log('------------------');

            console.log('\nAvailable Valid Areas:');
            validAreas.forEach(a => console.log(`- ID: ${a.id} | Name: ${a.publicName}`));
            process.exit(1);
        } else {
            console.log('\nAll mappings are valid!');
            process.exit(0);
        }

    } catch (error) {
        console.error('Failed to check zones:', error);
        process.exit(1);
    }
}

checkZones();
