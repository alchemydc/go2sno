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
    // Empirically determined from CAIC API responses (December 2025)
    private readonly ZONE_SLUG_TO_AREA_ID: Record<string, string> = {
        'front-range': '894e51d2c85fc4bf770c35add465d964d9545724dff415a9514abfeb6d48a670',
        'vail-and-summit-county': 'd265b6c0e3bf3244aaa6a60173183d489431b66e8e7655036a281ba6bfb0902a',
        'steamboat-and-flat-tops': 'b5a4eaa61b0a367941b8f82b9ba4ec75c95587b196cb68cd8afa4e1484749f82',
        'aspen': 'b1e78f1b03b5f093b090e3d330523e88cac576f6d889c144c8dd84f41bc7d320',
        'gunnison': '0e883bd533e60801f3ecf23f312bb1592e9ba081c212288b736bc70cdacd422e',
        'sawatch': 'cbd94cc57eed8a46b49240c098507d86258d99960fe1f49aeb9a57040f46fee9',
        'northern-san-juan': '2b25d211a99f2591d784fe9521bb7e0d3319ebf217eb865476ba67d201cc2c9d',
        'southern-san-juan': '9f055ad2245746c99c0cc5ed63238f3074a1835c887672acc89b7a4275883936',
        'sangre-de-cristo': 'e828f0f1db0a4fc927c33ea4078cb2f4466a9fd8dcde6db4f28ddea15d07b742',
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

        if (!targetAreaId) {
            console.warn(`No area ID mapping for zone: ${zoneSlug}`);
            return null;
        }

        const forecast = forecasts.find(f =>
            f.type === 'avalancheforecast' && f.areaId === targetAreaId
        ) as AvalancheForecast | undefined;

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
