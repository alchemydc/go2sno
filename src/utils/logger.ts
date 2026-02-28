// Simple debug logger
// To enable debug mode, set localStorage.setItem('debug', 'true') in the browser console
// or set NEXT_PUBLIC_DEBUG=true in your environment variables.

const isDebugEnabled = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('debug') === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true';
    }
    return process.env.NEXT_PUBLIC_DEBUG === 'true';
};

export const logger = {
    debug: (message: string, ...args: any[]) => {
        if (isDebugEnabled()) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    },
    info: (message: string, ...args: any[]) => {
        console.log(`[INFO] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(`[ERROR] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`[WARN] ${message}`, ...args);
    }
};
