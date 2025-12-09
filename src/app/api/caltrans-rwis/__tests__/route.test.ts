import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/caltrans-rwis', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and transform RWIS data from default districts', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            rwis: {
                                index: '1',
                                recordTimestamp: {
                                    recordDate: '2025-12-08',
                                    recordTime: '18:06:01',
                                    recordEpoch: '1765245961',
                                },
                                location: {
                                    district: '3',
                                    locationName: 'Hwy 80 at Blue Canyon',
                                    nearbyPlace: 'Emigrant Gap',
                                    longitude: '-120.70311',
                                    latitude: '39.2834',
                                    route: 'I-80',
                                    elevation: '5314',
                                },
                                inService: 'true',
                                rwisData: {
                                    stationData: {
                                        essAtmosphericPressure: '65535',
                                    },
                                    windData: {
                                        essAvgWindDirection: '0',
                                        essAvgWindSpeed: '5',
                                        essSpotWindDirection: '170',
                                        essSpotWindSpeed: '7',
                                        essMaxWindGustSpeed: '10',
                                        essMaxWindGustDir: '158',
                                    },
                                    temperatureData: {
                                        essNumTemperatureSensors: '1',
                                        essTemperatureSensorTable: [
                                            {
                                                essTemperatureSensorEntry: {
                                                    essTemperatureSensorIndex: '1',
                                                    essAirTemperature: '32',
                                                },
                                            },
                                        ],
                                        essDewpointTemp: '28',
                                        essMaxTemp: '45',
                                        essMinTemp: '20',
                                    },
                                    humidityPrecipData: {
                                        essRelativeHumidity: '85',
                                        essPrecipYesNo: '1',
                                        essPrecipRate: '5',
                                        essPrecipSituation: '2',
                                        essPrecipitation24Hours: '100',
                                    },
                                    visibilityData: {
                                        essVisibility: '5000',
                                        essVisibilitySituation: '3',
                                    },
                                    pavementSensorData: {
                                        numEssPavementSensors: '1',
                                        essPavementSensorTable: [
                                            {
                                                essPavementSensorEntry: {
                                                    essPavementSensorIndex: '1',
                                                    essSurfaceStatus: '5',
                                                    essSurfaceTemperature: '30',
                                                    essSurfaceFreezePoint: '32',
                                                    essSurfaceBlackIceSignal: '3',
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            });

        const request = new Request('http://localhost:3000/api/caltrans-rwis');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(1);

        const station = data[0];
        expect(station.id).toBe('rwis-d3-1');
        expect(station.name).toBe('Hwy 80 at Blue Canyon');
        expect(station.location).toEqual({
            latitude: 39.2834,
            longitude: -120.70311,
            route: 'I-80',
            nearbyPlace: 'Emigrant Gap',
            elevation: 5314,
        });
        expect(station.weather.airTemperature).toBe(32);
        expect(station.weather.humidity).toBe(85);
        expect(station.surface.status).toBe('Wet');
        expect(station.surface.blackIceWarning).toBe(true);
        expect(station.precipitation.isPresent).toBe(true);
    });

    it('should support custom districts parameter', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }),
        });

        const request = new Request('http://localhost:3000/api/caltrans-rwis?districts=9');
        await GET(request);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
            'https://cwwp2.dot.ca.gov/data/d9/rwis/rwisStatusD09.json',
            expect.any(Object)
        );
    });

    it('should filter out stations not in service', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            rwis: {
                                index: '1',
                                recordTimestamp: {
                                    recordDate: '2025-12-08',
                                    recordTime: '18:00:00',
                                    recordEpoch: '1765245600',
                                },
                                location: {
                                    locationName: 'Station 1',
                                    nearbyPlace: 'Place 1',
                                    latitude: '39.0',
                                    longitude: '-120.0',
                                    route: 'I-80',
                                    elevation: '5000',
                                },
                                inService: 'true',
                                rwisData: {
                                    stationData: { essAtmosphericPressure: '65535' },
                                    windData: {
                                        essAvgWindDirection: '0',
                                        essAvgWindSpeed: '0',
                                        essSpotWindDirection: '0',
                                        essSpotWindSpeed: '0',
                                        essMaxWindGustSpeed: '0',
                                        essMaxWindGustDir: '0',
                                    },
                                    temperatureData: {
                                        essNumTemperatureSensors: '1',
                                        essTemperatureSensorTable: [
                                            { essTemperatureSensorEntry: { essTemperatureSensorIndex: '1', essAirTemperature: '32' } },
                                        ],
                                        essDewpointTemp: '28',
                                        essMaxTemp: '40',
                                        essMinTemp: '20',
                                    },
                                    humidityPrecipData: {
                                        essRelativeHumidity: '80',
                                        essPrecipYesNo: '2',
                                        essPrecipRate: '0',
                                        essPrecipSituation: '3',
                                        essPrecipitation24Hours: '0',
                                    },
                                    visibilityData: {
                                        essVisibility: '10000',
                                        essVisibilitySituation: '2',
                                    },
                                    pavementSensorData: {
                                        numEssPavementSensors: '1',
                                        essPavementSensorTable: [
                                            {
                                                essPavementSensorEntry: {
                                                    essPavementSensorIndex: '1',
                                                    essSurfaceStatus: '3',
                                                    essSurfaceTemperature: '32',
                                                    essSurfaceFreezePoint: '32',
                                                    essSurfaceBlackIceSignal: '4',
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        {
                            rwis: {
                                index: '2',
                                location: { locationName: 'Station 2' },
                                inService: 'false',
                            },
                        },
                    ],
                }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

        const request = new Request('http://localhost:3000/api/caltrans-rwis');
        const response = await GET(request);
        const data = await response.json();

        expect(data).toHaveLength(1);
        expect(data[0].name).toBe('Station 1');
    });

    it('should parse surface status correctly', async () => {
        const createStation = (surfaceStatus: string) => ({
            rwis: {
                index: '1',
                recordTimestamp: { recordDate: '2025-12-08', recordTime: '18:00:00', recordEpoch: '1765245600' },
                location: {
                    locationName: 'Test',
                    nearbyPlace: 'Test',
                    latitude: '39.0',
                    longitude: '-120.0',
                    route: 'I-80',
                    elevation: '5000',
                },
                inService: 'true',
                rwisData: {
                    stationData: { essAtmosphericPressure: '65535' },
                    windData: {
                        essAvgWindDirection: '0',
                        essAvgWindSpeed: '0',
                        essSpotWindDirection: '0',
                        essSpotWindSpeed: '0',
                        essMaxWindGustSpeed: '0',
                        essMaxWindGustDir: '0',
                    },
                    temperatureData: {
                        essNumTemperatureSensors: '1',
                        essTemperatureSensorTable: [
                            { essTemperatureSensorEntry: { essTemperatureSensorIndex: '1', essAirTemperature: '32' } },
                        ],
                        essDewpointTemp: '28',
                        essMaxTemp: '40',
                        essMinTemp: '20',
                    },
                    humidityPrecipData: {
                        essRelativeHumidity: '80',
                        essPrecipYesNo: '2',
                        essPrecipRate: '0',
                        essPrecipSituation: '3',
                        essPrecipitation24Hours: '0',
                    },
                    visibilityData: { essVisibility: '10000', essVisibilitySituation: '2' },
                    pavementSensorData: {
                        numEssPavementSensors: '1',
                        essPavementSensorTable: [
                            {
                                essPavementSensorEntry: {
                                    essPavementSensorIndex: '1',
                                    essSurfaceStatus: surfaceStatus,
                                    essSurfaceTemperature: '32',
                                    essSurfaceFreezePoint: '32',
                                    essSurfaceBlackIceSignal: '4',
                                },
                            },
                        ],
                    },
                },
            },
        });

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [createStation('3')] }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

        const request = new Request('http://localhost:3000/api/caltrans-rwis');
        const response = await GET(request);
        const data = await response.json();

        expect(data[0].surface.status).toBe('Dry');
    });

    it('should handle API errors gracefully', async () => {
        // All three districts fail
        mockFetch
            .mockRejectedValue(new Error('Network error'))
            .mockRejectedValue(new Error('Network error'))
            .mockRejectedValue(new Error('Network error'));

        const request = new Request('http://localhost:3000/api/caltrans-rwis');
        const response = await GET(request);
        const data = await response.json();

        // API route catches errors and returns empty array with 200
        expect(response.status).toBe(200);
        expect(data).toEqual([]);
    });
});
