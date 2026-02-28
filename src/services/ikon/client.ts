
import { logger } from "@/utils/logger";

const IKON_API_BASE = "https://www.mtnpowder.com/feed/v3.json";
const USER_AGENT = "IkonMobileIOS/7.76.304 (The in-house Ikon mobile app; iPadOS; Apple; Build 9308)";

export interface IkonLift {
    Name: string;
    Status: string; // "Open", "Closed", "Scheduled", "Hold", etc.
    // ... other fields ignore for now
}

export interface IkonTrail {
    Name: string;
    Status: string; // "Open", "Closed"
    TrailIcon: string; // "GreenCircle", "BlueSquare", "BlackDiamond", "Park", etc.
    Difficulty: string;
    // ...
}

export interface IkonMountainArea {
    Name: string;
    Lifts: IkonLift[];
    Trails: IkonTrail[];
}

export interface IkonResortResponse {
    Name: string;
    OperatingStatus: string;
    MountainAreas: IkonMountainArea[];
    // ...
}

export interface IIkonClient {
    getResortStatus(resortId: number): Promise<{ lifts: IkonLift[]; trails: IkonTrail[]; terrainParks: IkonTrail[]; }>;
    getResortSummary(resortId: number): Promise<any | null>;
}

export class IkonClient implements IIkonClient {

    private getApiKey(): string {
        const key = process.env.IKON_API_KEY;
        if (!key) {
            logger.error("IkonClient: IKON_API_KEY not found in environment variables");
            throw new Error("IKON_API_KEY missing");
        }
        return key;
    }

    private async fetch<T>(params: URLSearchParams): Promise<T> {
        const token = this.getApiKey();
        params.append("bearer_token", token);

        const url = `${IKON_API_BASE}?${params.toString()}`;

        logger.debug("IkonClient: Fetching URL", { url: url.replace(token, '[REDACTED]') });

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json",
                    "Accept-Language": "en-US,en;q=0.9"
                },
                next: { revalidate: 60 }
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error("IkonClient: HTTP Error", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Ikon API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            logger.debug("IkonClient: Fetch success", { size: JSON.stringify(data).length });
            return data;
        } catch (error) {
            logger.error("IkonClient: Network or Parse Error", { error });
            throw error;
        }
    }

    async getResortStatus(resortId: number) {
        logger.debug("IkonClient: getResortStatus called", { resortId });

        const params = new URLSearchParams();
        params.append("resortId", resortId.toString());

        try {
            const data = await this.fetch<IkonResortResponse>(params);

            if (!data.MountainAreas) {
                logger.warn("IkonClient: No MountainAreas found in response", { resortId });
                return { lifts: [], trails: [], terrainParks: [] };
            }

            const allLifts: IkonLift[] = [];
            const allTrails: IkonTrail[] = [];

            data.MountainAreas.forEach(area => {
                if (area.Lifts) {
                    logger.debug("IkonClient: Processing area lifts", { area: area.Name, count: area.Lifts.length });
                    allLifts.push(...area.Lifts);
                }
                if (area.Trails) {
                    logger.debug("IkonClient: Processing area trails", { area: area.Name, count: area.Trails.length });
                    allTrails.push(...area.Trails);
                }
            });

            const terrainParks = allTrails.filter(t => t.TrailIcon === "Park");

            logger.info("IkonClient: Data processed successfully", {
                resortId,
                totalLifts: allLifts.length,
                totalTrails: allTrails.length,
                terrainParks: terrainParks.length
            });

            return {
                lifts: allLifts,
                trails: allTrails,
                terrainParks
            };

        } catch (error) {
            logger.error("IkonClient: Failed to get resort status", { resortId, error });
            throw error;
        }
    }

    async getResortSummary(resortId: number): Promise<any | null> {
        try {
            // Re-using internal fetch but constructing full URL slightly differently or just using fetch directly since structure differs
            // The Base URL is shared but endpoint differs
            const token = this.getApiKey();
            // Current base is /feed/v3.json ... we want /feed/v3/ikon.json
            const summaryUrl = 'https://www.mtnpowder.com/feed/v3/ikon.json?bearer_token=' + token;

            logger.debug("IkonClient: Fetching aggregate summary", { url: summaryUrl.replace(token, '[REDACTED]') });

            const response = await fetch(summaryUrl, {
                headers: {
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json"
                },
                next: { revalidate: 300 } // longer cache for big file
            });

            if (!response.ok) {
                logger.error("IkonClient: Summary fetch failed", { status: response.status });
                return null;
            }

            const data = await response.json();
            const resort = data.Resorts?.find((r: any) => r.Id === resortId);

            return resort || null;

        } catch (error) {
            logger.error("IkonClient: Error fetching summary", { error });
            return null;
        }
    }
}

export const ikonClient = new IkonClient();
