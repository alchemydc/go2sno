
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BASE_URL = 'https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14';
const HEADERS = `-H 'accept: application/json, text/plain, */*' \
-H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios' --compressed`;

const ENDPOINTS = [
    { name: 'daily-stats', url: `${BASE_URL}/daily-stats` },
    { name: 'basic', url: `${BASE_URL}` }, // resorts/14
    { name: 'home', url: `${BASE_URL}/home` },
    { name: 'maps', url: `${BASE_URL}/maps` },
    { name: 'wait-times', url: `${BASE_URL}/wait-times` },
    { name: 'weather', url: `${BASE_URL}/weather` },
    { name: 'webcams', url: `${BASE_URL}/webcam-screen` }, // Note: webcam-screen
    { name: 'terrain', url: `${BASE_URL}/terrain-status` }, // Guessing based on pattern, but let's stick to user list + this guess
    { name: 'lifts', url: `${BASE_URL}/lift-status` }, // Guessing based on common patterns
];

async function main() {
    for (const ep of ENDPOINTS) {
        console.log(`Fetching ${ep.name}...`);
        try {
            const cmd = `curl -s ${HEADERS} '${ep.url}'`;
            const { stdout } = await execAsync(cmd);
            console.log(`--- ${ep.name} ---`);
            // truncate output for display
            console.log(stdout.substring(0, 500) + '...');

            // Try parsing to ensure JSON
            JSON.parse(stdout);
            console.log(`(Valid JSON)`);
        } catch (e: any) {
            console.error(`Error fetching ${ep.name}:`, e.message);
        }
    }
}

main();
