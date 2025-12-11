
import { describe, it, expect } from 'vitest';
import { parseVailStatus } from './vail-resorts';

describe('parseVailStatus', () => {
    it('should return empty object if no script found', () => {
        const html = '<html><body><h1>No data here</h1></body></html>';
        const result = parseVailStatus(html);
        expect(result.lifts).toEqual({});
    });

    it('should parse standard variable assignment', () => {
        const html = `
            <script>
                var TerrainStatusFeed = {
                    "Lifts": [
                        { "Name": "Lift A", "Status": 1 },
                        { "Name": "Lift B", "Status": 0 }
                    ]
                };
            </script>
        `;
        const result = parseVailStatus(html);
        expect(result.lifts).toEqual({
            'Lift A': 'open',
            'Lift B': 'closed'
        });
    });

    it('should parse FR. namespaced assignment', () => {
        const html = `
            <script>
                FR.TerrainStatusFeed = {
                    "Lifts": [
                        { "Name": "Bonanza", "Status": 1 }
                    ]
                };
            </script>
        `;
        const result = parseVailStatus(html);
        expect(result.lifts).toEqual({
            'Bonanza': 'open'
        });
    });

    it('should handle Scheduled (3) as scheduled', () => {
        const html = `
            <script>
                TerrainStatusFeed = {
                    "Lifts": [
                        { "Name": "Future Lift", "Status": 3 }
                    ]
                };
            </script>
        `;
        const result = parseVailStatus(html);
        expect(result.lifts).toEqual({
            'Future Lift': 'scheduled'
        });
    });

    it('should ignore lifts with missing name or status', () => {
        const html = `
            <script>
                var TerrainStatusFeed = {
                    "Lifts": [
                        { "Status": 1 },
                        { "Name": "Ghost Lift" }
                    ]
                };
            </script>
        `;
        const result = parseVailStatus(html);
        expect(result.lifts).toEqual({});
    });

    it('should handle leading whitespace in script', () => {
        const html = `
            <script>
                
                
                var TerrainStatusFeed = {
                    "Lifts": [{ "Name": "Spacey", "Status": 1 }]
                };
            </script>
        `;
        const result = parseVailStatus(html);
        expect(result.lifts).toEqual({
            'Spacey': 'open'
        });
    });
});
