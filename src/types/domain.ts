export interface Resort {
    id: string;
    name: string;
    totalLifts: number;
    lat: number;
    lon: number;
    // Dynamic data will be merged in, but base config is static
}

// Normalized Status for any resort (Epic/Ikon/Indy/etc)
export interface ResortStatus {
    resortId: string;
    timestamp: string;
    summary: { // High level summary suitable for list views
        openLifts: number;
        totalLifts: number;
        percentOpen: number;
        openParks: number;
        totalParks: number;
        details?: Record<string, string>;
    };
    lifts: { // Detailed lift status
        [liftName: string]: 'open' | 'closed' | 'hold' | 'scheduled';
    };
    weather: {
        tempCurrent: number; // Fahrenheit
        snow24h: number; // Inches
        weatherDesc?: string;
    };
    source: string; // 'epic-mix', 'ikon-api', 'micrawl', 'open-meteo-fallback'
}

export interface Camera {
    id: string;
    name: string;
    url: string; // Stream or Image URL
    type: 'stream' | 'image';
    thumbnailUrl?: string; // Optional static preview
    location: {
        lat: number;
        lon: number;
    };
    regionId?: string; // e.g. 'co', 'ut'
}

export interface Incident {
    id: string;
    type: string; // 'Accident', 'RoadWork', 'ChainLaw', etc.
    description: string;
    startTime: string;
    location: {
        lat: number;
        lon: number;
    };
    routeName?: string; // e.g., "I-70 EB"
}

export interface RoadCondition {
    location: {
        lat: number;
        lon: number;
    };
    routeName: string;
    status: string; // 'Wet', 'Icy', 'Snow Packed', 'Dry' etc.
    description: string;
}

export interface AvalancheForecast {
    zoneId: string;
    zoneName: string;
    dangerRating: number; // 1-5 (1=Low, 5=Extreme)
    dangerRatingDisplay: string; // e.g. "Considerable"
    summary: string;
    issueDate: string;
    url: string;
}
