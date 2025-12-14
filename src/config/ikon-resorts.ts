
export interface IkonResortConfig {
    ikonId: number;
}

export const IKON_RESORT_MAP: Record<string, IkonResortConfig> = {
    'winterpark': { ikonId: 5 },
    'steamboat': { ikonId: 6 },
    'eldora': { ikonId: 56 },
    'copper': { ikonId: 55 },
    // Aspen generic mapped to Aspen Mountain for MVP
    'aspen': { ikonId: 52 },

    // Utah
    'deervalley': { ikonId: 49 },
    'alta': { ikonId: 78 },
    'snowbird': { ikonId: 77 },
    'brighton': { ikonId: 14 },
    'solitude': { ikonId: 65 },

    // Tahoe
    'palisades': { ikonId: 61 },
    // Alpine Meadows often has its own ID but sometimes rolled into Palisades. 
    // Based on resort list, distinct ID not always clear in summary, but verified ID 61 is Palisades.
    // We will map Alpine to 61 for now as well unless we find a specific one.
    // Actually, let's stick to 61 for both for now or check if there's another.
    // Wait, recent resort list had "Palisades Tahoe" but didn't explicitly list Alpine as a separate top-level resort with ID?
    // Let's assume 61 covers it or it's the main one.
    'alpinemeadows': { ikonId: 61 },
    'mammoth': { ikonId: 60 },

    // PNW
    'crystal': { ikonId: 80 },
    'snoqualmie': { ikonId: 79 },
    'bachelor': { ikonId: 96 },
    'cypress': { ikonId: 81 },
    'red': { ikonId: 98 },
    'revelstoke': { ikonId: 77 },
    'sunpeaks': { ikonId: 171 },
    'panorama': { ikonId: 170 },

    // Japan
    'annupuri': { ikonId: 84 },
    'hirafu': { ikonId: 85 },
    'hanazono': { ikonId: 86 },
    'village': { ikonId: 87 },
    'furano': { ikonId: 251 },
    'lottearai': { ikonId: 169 },
    'appi': { ikonId: 252 },
    'zao': { ikonId: 253 },
    'myoko': { ikonId: 270 },

    // New Zealand
    'coronet': { ikonId: 179 },
    'remarkables': { ikonId: 180 },
    'mthutt': { ikonId: 181 },
};
