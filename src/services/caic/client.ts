import {
    AvalancheForecast,
    AvalancheObservation,
    FieldReport,
    RegionalDiscussionForecast,
} from "./types";

const CAIC_API_BASE = "https://api.avalanche.state.co.us";
const CAIC_HOME_BASE = "https://avalanche.state.co.us";

export class CaicClient {
    // Hardcoded mapping from zone slugs to forecast area IDs
    // Empirically updated December 6, 2025 - CAIC changed their entire zone system
    // Zones now use numeric IDs instead of names
    private readonly ZONE_SLUG_TO_AREA_ID: Record<string, string> = {
        // Front Range - publicName: '1-100-101-103-109-111-114-115-146-147-15-16-22-23-27-28-47-57-58-68-7-8'
        'front-range': '894e51d2c85fc4bf770c35add465d964d9545724dff415a9514abfeb6d48a670',

        // Vail & Summit County - publicName: '48-49-50-51-52-63-64-65-70-71-72-73-74-75-76-83-84-85-86-87-88-95'
        'vail-and-summit-county': '65600272998c7d51ab3b86184d15c811ebce93388b3e4f008717a91be3411769',

        // Steamboat & Flat Tops - publicName: '66-67-69-89-90-91'
        'steamboat-and-flat-tops': 'b99916e5c4f11223d2e1cd44a246ec62c91fa23f8717bffe13344c819abbffd3',

        // Aspen - publicName: '108-110-92-93-94'
        'aspen': 'b1e78f1b03b5f093b090e3d330523e88cac576f6d889c144c8dd84f41bc7d320',

        // Gunnison - publicName: '104-105-106-107-82-96-97-98'
        'gunnison': '5e704db6c9b0d393eb79e1fec40c9f4b8bd3685495debe90e1be38a3b6e1cad3',

        // Sawatch - publicName: '102-40-56-59-77-78-79-80-81-99'
        'sawatch': 'e8dd65f96f448cba5602cfc83d652af05c2f65cadc20937e18761a04698ab7ec',

        // Northern San Juan - publicName: '113-116-126-137'
        'northern-san-juan': '9f055ad2245746c99c0cc5ed63238f3074a1835c887672acc89b7a4275883936',

        // Southern San Juan - publicName: '117-118-119-123-124-125-127-136'
        'southern-san-juan': '4772a6c784ef3855bed4e501835a3ff93a19f22399b1470e54b453570b6e80a5',

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
        console.log('Raw CAIC API response types:', response.map((i: any) => i.type));

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
        console.log(`Looking for zone: ${zoneSlug}, mapped to areaId: ${targetAreaId}`);
        console.log('Available forecasts:', forecasts
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
            console.warn(`No area ID mapping for zone: ${zoneSlug}`);
            return null;
        }

        const forecast = forecasts.find(f =>
            f.type === 'avalancheforecast' && f.areaId === targetAreaId
        ) as AvalancheForecast | undefined;

        if (!forecast) {
            console.warn(`Found mapping for ${zoneSlug} but no forecast matched areaId: ${targetAreaId}`);
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
                console.error(`Error fetching page ${page}:`, error);
                paginating = false;
            }
        }

        return results;
    }
}
