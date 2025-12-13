
import { logger } from "@/utils/logger";
import { epicMixClient } from "./epic-mix/client";
import { scrapeUrl } from "@/lib/micrawl";
import { parseVailStatus } from "@/lib/scrapers/vail-resorts";
import { fetchResortWeather } from "./open-meteo";
import { EPIC_RESORT_MAP } from "@/config/epic-resorts";

// Reusing types from vail-resorts or defining compatible ones
export interface NormalizedLiftStatus {
    [liftName: string]: 'open' | 'closed' | 'hold' | 'scheduled';
}

export interface ResortStatusResult {
    resort: string; // Internal ID or Display Name
    timestamp: string;
    lifts: NormalizedLiftStatus;
    summary: {
        open: number;
        total: number;
        percentOpen: number;
        parks: {
            open: number;
            total: number;
            details: Record<string, string>;
        };
    };
    weather?: {
        tempCurrent: number; // Fahrenheit
        snowfallDaily: number; // inches
    };
    source: 'epic-mix' | 'micrawl' | 'fallback-weather-only';
    debug?: any;
}

export async function getResortStatus(resortId: string): Promise<ResortStatusResult> {
    logger.debug("ResortStatus: Request for status", { resortId });

    const epicConfig = EPIC_RESORT_MAP[resortId];

    if (epicConfig) {
        try {
            return await getStatusFromEpicMix(resortId, epicConfig.epicId, epicConfig.parkNames);
        } catch (error) {
            logger.warn(`ResortStatus: Epic Mix API failed for ${resortId}, attempting fallback`, { error });
            return await getFallbackStatus(resortId);
        }
    } else {
        logger.debug("ResortStatus: No Epic config found, using unknown strategy (fallback)", { resortId });
        return await getFallbackStatus(resortId);
    }
}

// Kept for backward compatibility/alias if needed, but should preferably use getResortStatus('parkcity')


async function getStatusFromEpicMix(internalId: string, epicId: string, parkNames: string[]): Promise<ResortStatusResult> {
    logger.info("ResortStatus: Fetching status from Epic Mix", { internalId, epicId });

    // Fetch Status and Weather in parallel for speed
    const [statusData, weatherData] = await Promise.all([
        epicMixClient.getResortStatus(epicId),
        epicMixClient.getResortWeather(epicId)
    ]);

    // Normalize Lifts
    const lifts: NormalizedLiftStatus = {};
    let openLiftsCount = 0;

    statusData.lifts.forEach(lift => {
        const name = lift.name.trim();
        let status: 'open' | 'closed' | 'hold' | 'scheduled' = 'closed';

        switch (lift.openingStatus) {
            case "OPEN": status = 'open'; break;
            case "ON_HOLD": status = 'hold'; break;
            case "SCHEDULED": status = 'scheduled'; break;
            default: status = 'closed'; break;
        }

        lifts[name] = status;
        if (status === 'open' || status === 'scheduled') { // Match existing logic: scheduled counts as open
            openLiftsCount++;
        }
    });

    const totalLiftsCount = statusData.lifts.length;

    // Normalize Parks
    const parkDetails: Record<string, string> = {};
    let openParksCount = 0;
    let totalParksCount = 0;

    // If we have a specific list of managed parks, filter by it. 
    // Otherwise, include all found parks.
    const hasParkFilter = parkNames.length > 0;
    const knownParks = new Set(parkNames);

    statusData.terrainParks.forEach(park => {
        const name = park.name.trim();
        if (!hasParkFilter || knownParks.has(name)) {
            const status = park.openingStatus === 'OPEN' ? 'open' : 'closed';
            parkDetails[name] = status;
            if (status === 'open') openParksCount++;
            totalParksCount++;
        }
    });

    const weather = {
        tempCurrent: weatherData.currentWeather.currentTempStandard,
        snowfallDaily: weatherData.dailyForecast[0]?.daySnowfall + weatherData.dailyForecast[0]?.nightSnowfall || 0
    };

    logger.debug("ResortStatus: Successfully fetched Epic Mix data", {
        internalId,
        openLifts: openLiftsCount,
        totalLifts: totalLiftsCount,
        openParks: openParksCount
    });

    return {
        resort: internalId,
        timestamp: new Date().toISOString(),
        lifts: lifts,
        summary: {
            open: openLiftsCount,
            total: totalLiftsCount,
            percentOpen: totalLiftsCount > 0 ? Math.round((openLiftsCount / totalLiftsCount) * 100) : 0,
            parks: {
                open: openParksCount,
                total: totalParksCount, // Use the count of parks we actually tracked
                details: parkDetails
            }
        },
        weather,
        source: 'epic-mix'
    };
}

async function getFallbackStatus(resortId: string): Promise<ResortStatusResult> {
    logger.info("ResortStatus: Executing fallback strategy", { resortId });

    if (resortId === 'parkcity') {
        const RESORT_URL = 'https://www.parkcitymountain.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx';
        const PARK_CITY_PARKS = EPIC_RESORT_MAP['parkcity'].parkNames;

        try {
            // Parallel fetch for micrawl and open-meteo weather
            const [scrapeResult, weatherResult] = await Promise.all([
                scrapeUrl(RESORT_URL),
                fetchResortWeather([{ lat: 40.6514, lon: -111.5080 }])
            ]);

            if (!scrapeResult.success || !scrapeResult.html) {
                throw new Error(`Micrawl failed: ${scrapeResult.error}`);
            }

            const { lifts, parks, debug } = parseVailStatus(scrapeResult.html, { parkNames: PARK_CITY_PARKS });

            const liftValues = Object.values(lifts);
            const openCount = liftValues.filter(s => s === 'open' || s === 'scheduled').length;
            const totalCount = liftValues.length;

            const weatherData = weatherResult[0];
            const weather = weatherData ? {
                tempCurrent: weatherData.current.temperature_2m,
                snowfallDaily: weatherData.daily.snowfall_sum[0] || 0
            } : undefined;

            logger.info("ResortStatus: Micrawl fallback successful", { resortId });

            return {
                resort: 'Park City',
                timestamp: new Date().toISOString(),
                lifts: lifts,
                summary: {
                    open: openCount,
                    total: totalCount,
                    percentOpen: totalCount > 0 ? Math.round((openCount / totalCount) * 100) : 0,
                    parks: parks
                },
                weather,
                source: 'micrawl',
                debug: { ...debug, micrawl: scrapeResult.debug }
            };

        } catch (err) {
            logger.error("ResortStatus: Micrawl fallback failed", { resortId, error: err });
            // Fall through to generic empty return?
        }
    }

    // Generic Fallback (e.g. just weather if we knew coordinates, or empty)
    // For now, return empty/error state but properly typed
    logger.warn("ResortStatus: No viable data source found", { resortId });
    return {
        resort: resortId,
        timestamp: new Date().toISOString(),
        lifts: {},
        summary: {
            open: 0,
            total: 0,
            percentOpen: 0,
            parks: { open: 0, total: 0, details: {} }
        },
        source: 'fallback-weather-only' // technically just empty for now
    };
}
