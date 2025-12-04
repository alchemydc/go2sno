import { CaicClient } from "./client";

async function main() {
    const client = new CaicClient();
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    console.log("--- Verifying CAIC TypeScript Client ---");

    // 1. Get Avalanche Observations
    console.log("\n1. Fetching Avalanche Observations (last 7 days)...");
    try {
        const obs = await client.getAvalancheObservations(startIso, endIso, 1);
        console.log(`Found ${obs.length} observations.`);
        if (obs.length > 0) {
            console.log("Sample observation:", JSON.stringify(obs[0], null, 2));
        }
    } catch (error) {
        console.error("Error fetching observations:", error);
    }

    // 2. Get Field Reports
    console.log("\n2. Fetching Field Reports (last 7 days)...");
    try {
        const reports = await client.getFieldReports(startIso, endIso, 1);
        console.log(`Found ${reports.length} field reports.`);
        if (reports.length > 0) {
            console.log("Sample report:", JSON.stringify(reports[0], null, 2));
        }
    } catch (error) {
        console.error("Error fetching field reports:", error);
    }

    // 3. Get Forecast
    console.log("\n3. Fetching Forecast (for today)...");
    try {
        const forecasts = await client.getForecast(endIso);
        console.log(`Found ${forecasts.length} forecasts.`);
        if (forecasts.length > 0) {
            console.log("Sample forecast:", JSON.stringify(forecasts[0], null, 2));
        }
    } catch (error) {
        console.error("Error fetching forecasts:", error);
    }
}

main().catch(console.error);
