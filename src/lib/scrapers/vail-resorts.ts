
import * as cheerio from 'cheerio';
import { logger } from '../../utils/logger';

export interface LiftStatus {
    [liftName: string]: 'open' | 'closed' | 'hold' | 'scheduled';
}

export interface ResortStatus {
    lifts: LiftStatus;
    timestamp: string;
}

const STATUS_MAP: Record<number, 'open' | 'closed' | 'hold' | 'scheduled'> = {
    1: 'open',
    0: 'closed',
    2: 'hold',
};

/**
 * Extracts the lift status data from the Vail Resorts HTML.
 * Based on logic from: https://github.com/pirxpilot/liftie/blob/main/lib/tools/vail.js
 */

// Update the interface to include optional debug info and park summary
export interface LiftStatusResult {
    lifts: LiftStatus;
    parks: {
        open: number;
        total: number;
        details: Record<string, string>;
    };
    debug?: any;
}

export interface ParseOptions {
    parkNames?: string[];
}

export function parseVailStatus(html: string, options?: ParseOptions): LiftStatusResult {
    const debugInfo: any = { steps: [] };
    const log = (msg: string, data?: any) => debugInfo.steps.push({ msg, data });

    const parkNames = options?.parkNames || [];

    // Helper to return empty result
    const emptyResult = {
        lifts: {},
        parks: { open: 0, total: 0, details: {} },
        debug: debugInfo
    };

    log('Starting parse', { htmlLength: html.length, parkNamesCount: parkNames.length });

    const $ = cheerio.load(html);

    // Find the script containing 'TerrainStatusFeed = {'
    let scriptContent = '';
    $('script').each((_, element) => {
        const text = $(element).html();
        if (text && text.includes('TerrainStatusFeed = {')) {
            scriptContent = text;
            return false; // Break the loop
        }
    });

    if (!scriptContent) {
        log('TerrainStatusFeed script not found');
        return emptyResult;
    }

    log('Found script', { length: scriptContent.length });

    // Extract the object: TerrainStatusFeed = { ... }
    // We'll use a regex to capture the object content inside the storage
    // The structure is typically: var TerrainStatusFeed = { ... };
    // Or simply TerrainStatusFeed = { ... }

    // Attempt to isolate the TerrainStatusFeed assignment
    // This simplistic regex tries to grab everything after the assignment until the end of the script or a semicolon
    // It is safer to assume the object is well-formed JSON-like structure but valid JS.
    // We will execute a safe regex extraction for the 'Lifts' array.

    try {
        // The script content might have leading newlines/spaces.
        // We want to find "var TerrainStatusFeed =" or "TerrainStatusFeed =" and replace with "return ".

        // The script appears to be "FR.TerrainStatusFeed = { ... }"
        // We need to replace the entire assignment "FR.TerrainStatusFeed =" with "return ".
        // Regex: (?:var\s+)?(?:[\w.]+\.)?TerrainStatusFeed\s*=\s*

        let modifiedScript = scriptContent.replace(/(?:var\s+)?(?:[\w]+\.)?TerrainStatusFeed\s*=\s*/, 'return ');

        log('Modified script prefix', { snippet: modifiedScript.substring(0, 50) });

        // If the script ends with a semicolon, 'return { ... };' is valid JS.

        const getData = new Function(modifiedScript);
        const feed = getData();

        if (!feed || !feed.Lifts) {
            log('Script executed but no Lifts', { keys: feed ? Object.keys(feed) : 'null' });
            return emptyResult;
        }

        // Discover keys for Terrain/Trails
        log('Feed keys found', { keys: Object.keys(feed) });
        const liftsData = feed.Lifts;
        log('Lifts data found', { count: liftsData.length });

        const liftStatus: LiftStatus = {};
        const rawStatusMap: Record<string, number> = {};

        if (Array.isArray(liftsData)) {
            liftsData.forEach((lift: any) => {
                // Vail keys are typically Capitalized: Name, Status
                // Check if they are lower case?
                const name = lift.Name || lift.name;
                const rawStatus = lift.Status !== undefined ? lift.Status : lift.status;

                if (name && rawStatus !== undefined) {
                    const status = STATUS_MAP[Number(rawStatus)] || 'scheduled';
                    liftStatus[name.trim()] = status;
                    rawStatusMap[name.trim()] = Number(rawStatus);
                }
            });
        }

        // --- Terrain Park Logic ---
        const parkStatus: Record<string, string> = {};
        let openParks = 0;
        let totalParks = 0;

        if (parkNames.length > 0) {
            // Aggregate all trails from GroomingAreas
            const allTrails: any[] = [];
            if (feed.GroomingAreas && Array.isArray(feed.GroomingAreas)) {
                feed.GroomingAreas.forEach((area: any) => {
                    if (area.Trails && Array.isArray(area.Trails)) {
                        allTrails.push(...area.Trails);
                    }
                });
            }

            // Find status for known parks
            parkNames.forEach(parkName => {
                const trail = allTrails.find(t => t.Name && t.Name.trim() === parkName);
                if (trail) {
                    // Trails use 'IsOpen' boolean, unlike Lifts which use 'Status' code
                    // Check IsOpen directly.
                    const isOpen = trail.IsOpen === true;
                    const status = isOpen ? 'open' : 'closed';

                    parkStatus[parkName] = status;

                    if (status === 'open') openParks++;
                    totalParks++;
                } else {
                    // Log missing parks to help debugging
                    log('Park not found in feed', { name: parkName });
                }
            });
        }

        debugInfo.rawStatusMap = rawStatusMap;
        debugInfo.parkStatus = parkStatus;

        return {
            lifts: liftStatus,
            parks: {
                open: openParks,
                total: totalParks,
                details: parkStatus
            },
            debug: debugInfo
        };

    } catch (error) {
        log('Exception during parsing', { error: String(error) });
        return emptyResult;
    }
}
