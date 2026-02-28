/**
 * Types for the Avalanche.org v2 public map-layer API.
 * This API provides current forecast data for all US avalanche centers
 * in a GeoJSON FeatureCollection format.
 *
 * Endpoint: https://api.avalanche.org/v2/public/products/map-layer
 */

export interface AvalancheOrgMapLayerResponse {
    type: 'FeatureCollection';
    features: AvalancheOrgFeature[];
}

export interface AvalancheOrgFeature {
    type: 'Feature';
    id: number;
    properties: AvalancheOrgZoneProperties;
    geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: number[][][] | number[][][][];
    };
}

export interface AvalancheOrgZoneProperties {
    name: string;            // e.g. "Central Sierra Nevada"
    center: string;          // e.g. "Sierra Avalanche Center"
    center_link: string;     // e.g. "https://www.sierraavalanchecenter.org/"
    timezone: string;        // e.g. "America/Los_Angeles"
    center_id: string;       // e.g. "SAC", "ESAC", "BAC"
    state: string;           // e.g. "CA"
    off_season: boolean;
    travel_advice: string;   // Forecaster's bottom-line summary
    danger: string;          // e.g. "moderate", "considerable", "low", "no rating"
    danger_level: number;    // -1 = no rating, 1-5 = Low to Extreme
    color: string;           // Hex color for map display
    stroke: string;
    font_color: string;
    link: string;            // Full forecast URL
    start_date: string;      // ISO datetime (forecast valid from)
    end_date: string;        // ISO datetime (forecast valid until)
    fillOpacity: number;
    fillIncrement: number;
    warning: {
        product: unknown | null;  // Avalanche warning/watch if active
    };
}
