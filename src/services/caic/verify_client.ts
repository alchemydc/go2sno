import { CaicClient } from "./client";
import { logger } from "../../utils/logger";

async function main() {
    const client = new CaicClient();
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    logger.debug("--- Verifying CAIC TypeScript Client ---");

    // 1. Get Avalanche Observations
    logger.debug("\n1. Fetching Avalanche Observations (last 7 days)...");
    try {
        const obs = await client.getAvalancheObservations(startIso, endIso, 1);
        logger.debug(`Found ${obs.length} observations.`);
        if (obs.length > 0) {
            logger.debug("Sample observation:", JSON.stringify(obs[0], null, 2));
        }
    } catch (error) {
        logger.error("Error fetching observations:", error);
    }

    // 2. Get Field Reports
    logger.debug("\n2. Fetching Field Reports (last 7 days)...");
    try {
        const reports = await client.getFieldReports(startIso, endIso, 1);
        logger.debug(`Found ${reports.length} field reports.`);
        if (reports.length > 0) {
            logger.debug("Sample report:", JSON.stringify(reports[0], null, 2));
        }
    } catch (error) {
        logger.error("Error fetching field reports:", error);
    }

    // 3. Get Forecast
    logger.debug("\n3. Fetching Forecast (for today)...");
    try {
        const forecasts = await client.getForecast(endIso);
        logger.debug(`Found ${forecasts.length} forecasts.`);
        if (forecasts.length > 0) {
            logger.debug("Sample forecast:", JSON.stringify(forecasts[0], null, 2));
        }
    } catch (error) {
        logger.error("Error fetching forecasts:", error);
    }
}

main().catch(logger.error);
