import { AvalancheOrgMapLayerResponse, AvalancheOrgFeature, AvalancheOrgZoneProperties } from './types';
import { logger } from '../../utils/logger';

const AVALANCHE_ORG_MAP_LAYER_URL = 'https://api.avalanche.org/v2/public/products/map-layer';

/**
 * Client for the Avalanche.org v2 public API.
 * Uses the map-layer endpoint which provides current danger ratings,
 * travel advice (bottom-line), and forecast links for all US avalanche centers.
 *
 * Supports any center on the Avalanche.org platform including:
 * - Single-zone centers (SAC, ESAC, BAC) — use getForecastByCenter()
 * - Multi-zone centers (UAC with 9 zones) — use getForecastByZoneName()
 * - Coordinate-based lookup (CAIC with 12 unnamed zones) — use getForecastByCoordinates()
 */
export class AvalancheOrgClient {
    private cache: { data: AvalancheOrgMapLayerResponse; fetchedAt: number } | null = null;
    private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

    /**
     * Fetch the current forecast for a single-zone avalanche center.
     * Use this for centers like SAC, ESAC, BAC where center_id is unique per zone.
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

    /**
     * Fetch the current forecast for a specific zone within a multi-zone center.
     * Use this for centers like UAC where multiple zones share the same center_id.
     */
    async getForecastByZoneName(centerId: string, zoneName: string): Promise<AvalancheOrgZoneProperties | null> {
        const features = await this.fetchMapLayer();
        const feature = features.features.find(
            f => f.properties.center_id === centerId &&
                 f.properties.name.toLowerCase() === zoneName.toLowerCase()
        );

        if (!feature) {
            logger.warn(`No forecast zone found for center_id: ${centerId}, zone: ${zoneName}`);
            return null;
        }

        return feature.properties;
    }

    /**
     * Fetch the current forecast for the zone containing a given coordinate.
     * Use this for centers like CAIC where zones share the same generic name
     * and can only be distinguished by their polygon geometry.
     */
    async getForecastByCoordinates(centerId: string, lon: number, lat: number): Promise<AvalancheOrgZoneProperties | null> {
        const features = await this.fetchMapLayer();
        const candidates = features.features.filter(
            f => f.properties.center_id === centerId
        );

        if (candidates.length === 0) {
            logger.warn(`No forecast zones found for center_id: ${centerId}`);
            return null;
        }

        const match = candidates.find(f => this.pointInFeature(lon, lat, f));

        if (!match) {
            logger.warn(`No zone polygon contains point [${lon}, ${lat}] for center: ${centerId}`);
            return null;
        }

        return match.properties;
    }

    /**
     * Test if a point is inside a Feature's polygon geometry.
     * Handles both Polygon and MultiPolygon types.
     */
    private pointInFeature(lon: number, lat: number, feature: AvalancheOrgFeature): boolean {
        const geom = feature.geometry;
        if (geom.type === 'Polygon') {
            // Polygon coordinates: [ring][point][lon,lat]
            return this.pointInPolygon(lon, lat, geom.coordinates as number[][][]);
        } else if (geom.type === 'MultiPolygon') {
            // MultiPolygon coordinates: [polygon][ring][point][lon,lat]
            return (geom.coordinates as number[][][][]).some(
                polygon => this.pointInPolygon(lon, lat, polygon)
            );
        }
        return false;
    }

    /**
     * Ray-casting point-in-polygon test against a single polygon (with optional holes).
     * Tests against the outer ring (index 0); a point inside a hole ring is excluded.
     */
    private pointInPolygon(lon: number, lat: number, rings: number[][][]): boolean {
        // Must be inside outer ring
        if (!this.pointInRing(lon, lat, rings[0])) return false;
        // Must not be inside any hole ring
        for (let i = 1; i < rings.length; i++) {
            if (this.pointInRing(lon, lat, rings[i])) return false;
        }
        return true;
    }

    /**
     * Ray-casting algorithm: count edge crossings to determine inside/outside.
     */
    private pointInRing(px: number, py: number, ring: number[][]): boolean {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            if ((yi > py) !== (yj > py) &&
                px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    private async fetchMapLayer(): Promise<AvalancheOrgMapLayerResponse> {
        // Return cached data if still fresh
        if (this.cache && (Date.now() - this.cache.fetchedAt) < AvalancheOrgClient.CACHE_TTL_MS) {
            logger.debug('AvalancheOrgClient: returning cached map-layer data');
            return this.cache.data;
        }

        logger.debug('AvalancheOrgClient: fetching map-layer from avalanche.org');
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

/** @deprecated Use AvalancheOrgClient instead */
export const SacClient = AvalancheOrgClient;
