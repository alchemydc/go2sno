
export interface EpicResortConfig {
    epicId: string;
    parkNames: string[];
}

export const EPIC_RESORT_MAP: Record<string, EpicResortConfig> = {
    'parkcity': {
        epicId: '14',
        parkNames: []
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
    },
    'whistler': {
        epicId: '19',
        parkNames: []
    },
    'stevens': {
        epicId: '17',
        parkNames: []
    },
    'hakuba': {
        epicId: 'hakuba', // Placeholder/Partner
        parkNames: []
    },

    // US East
    'stowe': {
        epicId: '18',
        parkNames: []
    },
    'okemo': {
        epicId: '13',
        parkNames: []
    },
    'mtsnow': {
        epicId: '21',
        parkNames: []
    },
    'hunter': {
        epicId: '20',
        parkNames: []
    },
    'sevensprings': {
        epicId: '39',
        parkNames: []
    }
};
