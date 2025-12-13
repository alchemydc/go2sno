
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CURL_COMMAND = `curl -s -H 'accept: application/json, text/plain, */*' \
 -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios' --compressed \
 https://digital-gw.azmtn.com/uiservice/api/v1/resorts`;

interface Resort {
  resortId: string;
  title: string;
  displayName: string;
  // ... other fields we don't care about
}

async function main() {
  try {
    const { stdout, stderr } = await execAsync(CURL_COMMAND);
    
    if (stderr) {
      // curl might output progress to stderr, but -s should silence it. 
      // If there's content it might be errors or stats. simpler to ignore unless parsing fails.
    }

    const resorts: Resort[] = JSON.parse(stdout);
    
    const resortMap: Record<string, string> = {};

    resorts.forEach(resort => {
        // Prefer displayName, fallback to title
        resortMap[resort.resortId] = resort.displayName || resort.title;
    });

    console.log(JSON.stringify(resortMap, null, 2));

  } catch (error) {
    console.error('Error fetching or parsing resort data:', error);
    process.exit(1);
  }
}

main();
