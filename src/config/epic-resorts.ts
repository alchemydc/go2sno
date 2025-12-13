
export interface EpicResortConfig {
    epicId: string;
    parkNames: string[];
}

export const EPIC_RESORT_MAP: Record<string, EpicResortConfig> = {
    'parkcity': {
        epicId: '14',
        parkNames: [
            "Little Kings",
            "Pick Axe",
            "Transitions Terrain Park",
            "3 Kings",
            "Half Pipe",
            "Mini Pipe",
            "Pick 'N Shovel"
        ]
    },
    'breck': {
        epicId: '4',
        parkNames: [] // TODO: Populate if known, or leave empty to discover/ignore
    },
    'keystone': {
        epicId: '8',
        parkNames: []
    },
    'vail': {
        epicId: '15',
        parkNames: []
    },
    'beavercreek': {
        epicId: '3',
        parkNames: []
    },
    'heavenly': {
        epicId: '6',
        parkNames: []
    },
    'northstar': {
        epicId: '12',
        parkNames: []
    },
    'kirkwood': {
        epicId: '9',
        parkNames: []
    },
    'crestedbutte': {
        epicId: '5',
        parkNames: []
    }
};
