
import { logger } from "@/utils/logger";

const EPIC_API_BASE = "https://digital-gw.azmtn.com/uiservice/api/v1";
const USER_AGENT = "MyEpic/160000 ios";

export interface EpicLift {
    id: number;
    name: string;
    type: string; // "LIFT"
    liftType: string; // "GONDOLA", "CHAIR", etc.
    openingStatus: string; // "SCHEDULED", "OPEN", "CLOSED", "ON_HOLD"
    waiting?: number;
    waitTimeStatus?: string; // "ACTIVE", etc
}

export interface EpicTrail {
    id: number;
    name: string;
    type: string; // "TRAIL"
    trailType: string; // "DOWNHILL_SKIING"
    trailLevel: string; // "BLUE_SQUARE", "DOUBLE_BLACK_DIAMOND", "TERRAIN_PARKS"
    openingStatus: string; // "OPEN", "CLOSED"
    groomingStatus: string; // "GROOMED", "NOT_GROOMED"
}

export interface EpicMapResponse {
    lifts: { data: EpicLift }[];
    trails: { data: EpicTrail }[];
    // There are other fields like 'restaurants' etc, but we only care about lifts and trails (specifically parks)
    // The structure is actually [ { lifts: [...], trails: [...] } ] based on our findings
}

export interface EpicWeatherResponse {
    currentWeather: {
        currentTempStandard: number; // Fahrenheit
        weatherShortDescription: string;
    };
    dailyForecast: {
        date: string;
        daySnowfall: number; // inches
        nightSnowfall: number; // inches
    }[];
}

// The API returns an array of map objects. We usually just want the first one or merge them.
type RawMapResponse = {
    lifts?: { data: EpicLift }[];
    trails?: { data: EpicTrail }[];
}[];

type RawWeatherResponse = {
    mainLocation: EpicWeatherResponse;
};

export class EpicMixClient {
    private async fetch<T>(path: string): Promise<T> {
        const url = `${EPIC_API_BASE}${path}`;
        logger.debug("EpicMixClient: Fetching", { url });

        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!response.ok) {
            throw new Error(`Epic Mix API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getResortStatus(resortId: string) {
        try {
            logger.debug("EpicMixClient: Fetching resort map", { resortId });
            // The maps endpoint contains both lifts and trails
            const maps = await this.fetch<RawMapResponse>(`/resorts/${resortId}/maps`);

            const allLifts: EpicLift[] = [];
            const allTrails: EpicTrail[] = [];

            for (const map of maps) {
                if (map.lifts) {
                    allLifts.push(...map.lifts.map(l => l.data));
                }
                if (map.trails) {
                    allTrails.push(...map.trails.map(t => t.data));
                }
            }

            logger.debug("EpicMixClient: Parsed map data", {
                resortId,
                liftCount: allLifts.length,
                trailCount: allTrails.length
            });

            const terrainParks = allTrails.filter(t => t.trailLevel === "TERRAIN_PARKS");
            logger.debug("EpicMixClient: Filtered terrain parks", {
                resortId,
                parkCount: terrainParks.length,
                parks: terrainParks.map(p => p.name)
            });

            return {
                lifts: allLifts,
                terrainParks: terrainParks,
            };

        } catch (error) {
            logger.error("EpicMixClient: Failed to fetch resort status", { resortId, error });
            throw error;
        }
    }

    async getResortWeather(resortId: string) {
        try {
            logger.debug("EpicMixClient: Fetching resort weather", { resortId });
            const data = await this.fetch<RawWeatherResponse>(`/resorts/${resortId}/weather`);

            logger.debug("EpicMixClient: Received weather", {
                resortId,
                temp: data.mainLocation?.currentWeather?.currentTempStandard,
                weather: data.mainLocation?.currentWeather?.weatherShortDescription
            });

            return data.mainLocation;
        } catch (error) {
            logger.error("EpicMixClient: Failed to fetch resort weather", { resortId, error });
            throw error;
        }
    }
}

export const epicMixClient = new EpicMixClient();
