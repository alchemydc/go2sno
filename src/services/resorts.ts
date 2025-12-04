export interface Resort {
    id: string;
    name: string;
    snow24h: number; // in inches
    liftsOpen: number;
    totalLifts: number;
    lat: number;
    lon: number;
}

export const getResorts = async (): Promise<Resort[]> => {
    return [
        { id: 'copper', name: 'Copper Mountain', snow24h: 5, liftsOpen: 20, totalLifts: 24, lat: 39.5021, lon: -106.1510 },
        { id: 'breck', name: 'Breckenridge', snow24h: 8, liftsOpen: 30, totalLifts: 35, lat: 39.4817, lon: -106.0384 },
        { id: 'abasin', name: 'Arapahoe Basin', snow24h: 3, liftsOpen: 8, totalLifts: 9, lat: 39.6425, lon: -105.8719 },
        { id: 'keystone', name: 'Keystone', snow24h: 4, liftsOpen: 18, totalLifts: 20, lat: 39.6084, lon: -105.9436 },
        { id: 'vail', name: 'Vail', snow24h: 6, liftsOpen: 25, totalLifts: 31, lat: 39.6403, lon: -106.3742 },
        { id: 'winterpark', name: 'Winter Park', snow24h: 7, liftsOpen: 21, totalLifts: 23, lat: 39.8868, lon: -105.7625 },
        { id: 'steamboat', name: 'Steamboat', snow24h: 10, liftsOpen: 15, totalLifts: 18, lat: 40.4848, lon: -106.8317 },
        { id: 'eldora', name: 'Eldora', snow24h: 2, liftsOpen: 10, totalLifts: 12, lat: 39.9382, lon: -105.5835 },
        { id: 'skicooper', name: 'Ski Cooper', snow24h: 4, liftsOpen: 4, totalLifts: 5, lat: 39.3627, lon: -106.3020 },
    ];
};
