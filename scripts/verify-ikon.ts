
// scripts/verify-ikon.ts
import { ikonClient } from '../src/services/ikon/client';
import { IkonApiProvider } from '../src/services/snow-report/providers/ikon-api';

// Simple polyfill for fetch if needed (Node 18+ has it native)
// env vars should be loaded by run_command environment or dotenv

async function verify() {
    console.log("Verifying Ikon Client...");
    try {
        console.log("Fetching Winter Park (ID 5)...");
        const wpData = await ikonClient.getResortStatus(5);
        console.log("Winter Park Raw Data Summary:");
        console.log(`Lifts: ${wpData.lifts.length}`);
        console.log(`Trails: ${wpData.trails.length}`);
        console.log(`Parks: ${wpData.terrainParks.length}`);

        if (wpData.lifts.length > 0) {
            console.log("Sample Lift:", wpData.lifts[0]);
        }

        console.log("\nVerifying IkonApiProvider...");
        const provider = new IkonApiProvider();
        const status = await provider.getStatus('winterpark'); // Internal ID

        if (status) {
            console.log("Provider Status Result:");
            console.log(JSON.stringify(status.summary, null, 2));
            console.log("Lifts Sample:", Object.entries(status.lifts).slice(0, 3));
        } else {
            console.error("Provider returned null for 'winterpark'");
        }

    } catch (e) {
        console.error("Verification failed:", e);
    }
}

verify();
