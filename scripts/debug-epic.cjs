const https = require('https');

const url = 'https://digital-gw.azmtn.com/uiservice/api/v1/resorts';

const options = {
    headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': 'MyEpic/160000 ios'
    }
};

console.log(`Fetching ${url}...`);

https.get(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log(`Found ${parsed.length} resorts.`);

            const targets = ['stevens', 'whistler', 'blackcomb'];

            parsed.forEach(r => {
                const name = r.name || r.title || r.resortName || 'Unknown';
                const id = r.id || r.resortId;

                console.log(`${name}: ${id}`);
                // if (targets.some(t => name.toLowerCase().includes(t))) {
                //    console.log(`MATCH: ${name} (ID: ${id})`);
                // }
            });
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data preview:', data.substring(0, 200));
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
