import { AvalancheOrgMapLayerResponse, AvalancheOrgZoneProperties } from './types';
import { logger } from '../../utils/logger';

const AVALANCHE_ORG_MAP_LAYER_URL = 'https://api.avalanche.org/v2/public/products/map-layer';

/**
 * Client for the Avalanche.org v2 public API.
 * Uses the map-layer endpoint which provides current danger ratings,
 * travel advice (bottom-line), and forecast links for all US avalanche centers.
 *
 * Supports SAC (Sierra Avalanche Center), ESAC (Eastern Sierra),
 * BAC (Bridgeport), and any other center on the Avalanche.org platform.
 */
export class SacClient {
    private cache: { data: AvalancheOrgMapLayerResponse; fetchedAt: number } | null = null;
    private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

    /**
     * Fetch the current forecast for a specific avalanche center zone.
     * Results are cached for 15 minutes to avoid excessive API calls.
     */
    async getForecastByCenter(centerId: string): Promise<AvalancheOrgZoneProperties | null> {
        const features = await this.fetchMapLayer();
        const feature = features.features.find(
            f => f.properties.center_id === centerId
        );

        if (!feature) {
            logger.warn(`No forecast zone found for center_id: ${centerId}`);
            return null;
        }

        return feature.properties;
    }

    private async fetchMapLayer(): Promise<AvalancheOrgMapLayerResponse> {
        // Return cached data if still fresh
        if (this.cache && (Date.now() - this.cache.fetchedAt) < SacClient.CACHE_TTL_MS) {
            logger.debug('SacClient: returning cached map-layer data');
            return this.cache.data;
        }

        logger.debug('SacClient: fetching map-layer from avalanche.org');
        const response = await fetch(AVALANCHE_ORG_MAP_LAYER_URL, {
            headers: {
                'User-Agent': 'go2sno/1.0 (avalanche forecast aggregator)',
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error text');
            logger.error(`Avalanche.org API Error: ${response.status}`, { errorText });
            throw new Error(`Avalanche.org API Error: ${response.status} ${response.statusText}`);
        }

        const data: AvalancheOrgMapLayerResponse = await response.json();
        this.cache = { data, fetchedAt: Date.now() };
        return data;
    }
}
