
// scripts/verify-ikon.ts
import { ikonClient } from '../src/services/ikon/client';
import { IkonApiProvider } from '../src/services/snow-report/providers/ikon-api';

// Simple polyfill for fetch if needed (Node 18+ has it native)
// env vars should be loaded by run_command environment or dotenv

async function main() {
    try {
        console.log('1. Testing IkonClient (Copper Mountain ID 55)...');
        const status = await ikonClient.getResortStatus(55); // Copper

        console.log('Lifts:', status.lifts.length);
        console.log('Trails:', status.trails.length);
        console.log('Parks:', status.terrainParks.length);
        console.log('Sample Lift:', status.lifts[0]);
        console.log('Sample Park:', status.terrainParks[0]);

        console.log('\n2. Testing IkonApiProvider (copper)...');
        const provider = new IkonApiProvider();
        const result = await provider.getStatus('copper');

        console.log('Provider Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Verification failed:", e);
    }
}

main();
