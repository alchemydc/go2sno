import { CaicClient } from './src/services/caic/client';

async function main() {
    const client = new CaicClient();
    const forecasts = await client.getForecast(new Date().toISOString());

    console.log('\n=== All Forecasts ===');
    forecasts.forEach((f: any) => {
        console.log('\nType:', f.type);
        console.log('Title:', f.title);
        console.log('PublicName:', f.publicName);
        console.log('AreaId:', f.areaId);
    });
}

main().catch(console.error);
