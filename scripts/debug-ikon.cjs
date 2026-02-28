const fs = require('fs');
const path = require('path');

async function main() {
    // Read .env
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env not found');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/IKON_API_KEY=(.+)/);
    if (!match) {
        console.error('IKON_API_KEY not found in .env');
        process.exit(1);
    }
    const token = match[1].trim();

    const url = `https://www.mtnpowder.com/feed/v3/ikon.json?bearer_token=${token}`;
    console.log(`Fetching ${url.replace(token, 'REDACTED')}...`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': "IkonMobileIOS/7.76.304 (The in-house Ikon mobile app; iPadOS; Apple; Build 9308)",
            }
        });

        if (!res.ok) {
            console.error('Fetch failed:', res.status, res.statusText);
            process.exit(1);
        }

        const data = await res.json();

        // Find Eldora
        const resorts = data.Resorts || [];
        console.log(`Found ${resorts.length} resorts.`);

        // List matches for Eldora
        const matches = resorts.filter(r => r && r.ResortName && r.ResortName.toLowerCase().includes('eldora'));
        if (matches.length > 0) {
            matches.forEach(r => console.log(`FOUND RESORT: ${r.ResortName} (ID: ${r.Id})`));
        } else {
            console.log('No resort found matching "eldora".');
            // Print all names for manual review
            console.log('Available resorts:');
            resorts.forEach(r => {
                if (r && r.ResortName) console.log(`${r.ResortName} (${r.Id})`);
            });
        }

    } catch (e) {
        console.error(e);
    }
}

main();
