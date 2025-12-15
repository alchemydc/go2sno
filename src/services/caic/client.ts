import {
    AvalancheForecast,
    AvalancheObservation,
    FieldReport,
    RegionalDiscussionForecast,
} from "./types";
import { logger } from "../../utils/logger";

const CAIC_API_BASE = "https://api.avalanche.state.co.us";
const CAIC_HOME_BASE = "https://avalanche.state.co.us";

export class CaicClient {
    // Hardcoded mapping from zone slugs to forecast area IDs
    // Empirically updated December 6, 2025 - CAIC changed their entire zone system
    // Zones now use numeric IDs instead of names
    private readonly ZONE_SLUG_TO_AREA_ID: Record<string, string> = {
        // Front Range - publicName: '1-100-101-103-109-111-114-115-146-147-15-16-22-23-27-28-47-57-58-68-7-8'
        // Updated Dec 14 2025 - mapped to aggregate zone 06b1...
        'front-range': '06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7',

        // Vail & Summit County - publicName: '48-49-50-51-52-63-64-65-70-71-72-73-74-75-76-83-84-85-86-87-88-95'
        // Updated Dec 14 2025 - mapped to aggregate zone 06b1...
        'vail-and-summit-county': '06b1a119b933838ed93013a68f5d265969726e4d65d3740f04bbdc6e534784e7',

        // Steamboat & Flat Tops - publicName: '66-67-69-89-90-91'
        'steamboat-and-flat-tops': 'b99916e5c4f11223d2e1cd44a246ec62c91fa23f8717bffe13344c819abbffd3',

        // Aspen - publicName: '108-110-92-93-94'
        'aspen': 'b1e78f1b03b5f093b090e3d330523e88cac576f6d889c144c8dd84f41bc7d320',

        // Gunnison - publicName: '104-105-106-107-82-96-97-98'
        // Updated Dec 14 2025 - mapped to aggregate zone 567f...
        'gunnison': '567fe6fcc0263c935a686696ebc51ed16ed34f747170a871c74b3552bdcdd97f',

        // Sawatch - publicName: '102-40-56-59-77-78-79-80-81-99'
        // Updated Dec 14 2025 - mapped to aggregate zone f2e0...
        'sawatch': 'f2e025fffd4b8e8ae37784da1354a7d29a5d111df372cf20b20f7bb71c3417ae',

        // Northern San Juan - publicName: '113-116-126-137'
        // Updated Dec 14 2025 - mapped to aggregate zone ac98... (merged with Southern)
        'northern-san-juan': 'ac98c08614e0a7565dfe3284385c7bc41ed17a24b5aa6a37402795828b078d3b',

        // Southern San Juan - publicName: '117-118-119-123-124-125-127-136'
        // Updated Dec 14 2025 - mapped to aggregate zone ac98... (merged with Northern)
        'southern-san-juan': 'ac98c08614e0a7565dfe3284385c7bc41ed17a24b5aa6a37402795828b078d3b',

        // Sangre de Cristo - publicName: '120-121-122-129-130-131-132-133'
        'sangre-de-cristo': '0014b641256985c720bd86418cc2aced55b8f20957ed611de5dd3d1dc1c4153d',
    };

    private async fetchJson<T>(url: string, params?: Record<string, any>): Promise<T> {
        const urlObj = new URL(url);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach((v) => urlObj.searchParams.append(key, String(v)));
                    } else {
                        urlObj.searchParams.append(key, String(value));
                    }
                }
            });
        }

        const response = await fetch(urlObj.toString(), {
            headers: {
                "User-Agent": "caic-typescript-client/0.1.0",
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error text');
            logger.error(`CAIC API Error: ${response.status} ${response.statusText}`, { url, errorText });
            throw new Error(`CAIC API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getAvalancheObservations(
        start: string,
        end: string,
        pageLimit: number = 100
    ): Promise<AvalancheObservation[]> {
        const endpoint = `${CAIC_API_BASE}/api/v2/avalanche_observations`;
        const params = {
            observed_after: start,
            observed_before: end,
            t: Math.floor(Date.now() / 1000),
        };

        return this.paginate<AvalancheObservation>(endpoint, params, pageLimit);
    }

    async getFieldReports(
        start: string,
        end: string,
        pageLimit: number = 100
    ): Promise<FieldReport[]> {
        const endpoint = `${CAIC_API_BASE}/api/v2/observation_reports`;
        const params = {
            "r[observed_at_gteq]": start,
            "r[observed_at_lteq]": end,
            "r[sorts][]": "observed_at+desc",
        };

        return this.paginate<FieldReport>(endpoint, params, pageLimit);
    }

    async getForecast(date: string): Promise<(AvalancheForecast | RegionalDiscussionForecast)[]> {
        const endpoint = `${CAIC_HOME_BASE}/api-proxy/avid`;
        const proxyUri = "/products/all";
        const proxyParams = {
            datetime: date,
            includeExpired: "true",
        };

        const proxyParamsStr = new URLSearchParams(proxyParams).toString();
        const params = {
            _api_proxy_uri: `${proxyUri}?${proxyParamsStr}`,
        };

        const response = await this.fetchJson<any[]>(endpoint, params);
        logger.debug('Raw CAIC API response types:', response.map((i: any) => i.type));

        // Filter and cast response
        return response.map((item: any) => {
            if (item.type === 'avalancheforecast') {
                return item as AvalancheForecast;
            } else {
                return item as RegionalDiscussionForecast;
            }
        });
    }

    async getForecastByZoneSlug(zoneSlug: string, date: string): Promise<AvalancheForecast | null> {
        const forecasts = await this.getForecast(date);
        const targetAreaId = this.ZONE_SLUG_TO_AREA_ID[zoneSlug];

        // Debug: log all available area IDs and zone identifiers
        logger.debug(`Looking for zone: ${zoneSlug}, mapped to areaId: ${targetAreaId}`);
        logger.debug('Available forecasts:', forecasts
            .filter(f => f.type === 'avalancheforecast')
            .map(f => {
                const forecast = f as AvalancheForecast;
                return {
                    areaId: forecast.areaId,
                    title: forecast.title,
                    publicName: forecast.publicName
                };
            })
        );

        if (!targetAreaId) {
            logger.warn(`No area ID mapping for zone: ${zoneSlug}`);
            return null;
        }

        const forecast = forecasts.find(f =>
            f.type === 'avalancheforecast' && f.areaId === targetAreaId
        ) as AvalancheForecast | undefined;

        if (!forecast) {
            logger.warn(`Found mapping for ${zoneSlug} but no forecast matched areaId: ${targetAreaId}`);
        }

        return forecast || null;
    }

    private async paginate<T>(
        endpoint: string,
        baseParams: Record<string, any>,
        pageLimit: number
    ): Promise<T[]> {
        let page = 1;
        const per = 1000;
        let results: T[] = [];
        let paginating = true;

        while (paginating) {
            const params = { ...baseParams, page, per };
            try {
                const data = await this.fetchJson<T[]>(endpoint, params);

                if (data.length < per) {
                    paginating = false;
                }

                results = results.concat(data);
                page++;

                if (page > pageLimit) {
                    paginating = false;
                }

            } catch (error) {
                logger.error(`Error fetching page ${page}:`, error);
                paginating = false;
            }
        }

        return results;
    }
}
