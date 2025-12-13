import { logger } from "@/utils/logger";
import { resortStatusManager } from "./snow-report/manager";
import { ResortStatus as DomainResortStatus } from "@/types/domain";

export interface NormalizedLiftStatus {
    [liftName: string]: 'open' | 'closed' | 'hold' | 'scheduled';
}

export interface ResortStatusResult {
    resort: string; // Internal ID or Display Name
    timestamp: string;
    lifts: NormalizedLiftStatus;
    summary: {
        open: number;
        total: number;
        percentOpen: number;
        parks: {
            open: number;
            total: number;
            details: Record<string, string>;
        };
    };
    weather?: {
        tempCurrent: number; // Fahrenheit
        snowfallDaily: number; // inches
    };
    source: string;
    debug?: any;
}

export async function getResortStatus(resortId: string): Promise<ResortStatusResult> {
    logger.debug("ResortStatus (Facade): Request for status", { resortId });

    try {
        const status = await resortStatusManager.getResortStatus(resortId);
        return mapDomainToLegacy(status);
    } catch (error) {
        logger.error("ResortStatus (Facade): Error fetching status via Manager", { resortId, error });
        return {
            resort: resortId,
            timestamp: new Date().toISOString(),
            lifts: {},
            summary: {
                open: 0,
                total: 0,
                percentOpen: 0,
                parks: { open: 0, total: 0, details: {} }
            },
            source: 'error'
        };
    }
}

function mapDomainToLegacy(status: DomainResortStatus): ResortStatusResult {
    return {
        resort: status.resortId,
        timestamp: status.timestamp,
        lifts: status.lifts,
        summary: {
            open: status.summary.openLifts,
            total: status.summary.totalLifts,
            percentOpen: status.summary.percentOpen,
            parks: {
                open: status.summary.openParks,
                total: status.summary.totalParks,
                details: {}
            }
        },
        weather: {
            tempCurrent: status.weather.tempCurrent,
            snowfallDaily: status.weather.snow24h
        },
        source: status.source
    };
}
