export interface Camera {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface TrafficSegment {
  id: string;
  name: string;
  status: 'Normal' | 'Slow' | 'Heavy';
  travelTime: number; // in minutes
}

export interface Incident {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][];
  };
  properties: {
    type: string;
    startTime: string;
    travelerInformationMessage: string;
    routeName: string;
    // primaryLatitude and primaryLongitude are often missing in API
  };
}

export interface RoadCondition {
  id: string;
  type: string;
  properties: {
    type: string;
    routeName: string;
    primaryLatitude: number;
    primaryLongitude: number;
    currentConditions: {
      conditionDescription: string;
    }[];
  };
}

export const getStreamingCameras = async (): Promise<Camera[]> => {
  try {
    const url = 'https://cotg.carsprogram.org/cameras_v1/api/cameras';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch cameras');

    const data = await res.json();

    return (data || [])
      .filter((camera: any) => camera.public && camera.active)
      .map((camera: any) => {
        // Find the WMP (Windows Media Player/HLS streaming) view
        const wmpView = camera.views?.find((view: any) => view.type === 'WMP');

        if (!wmpView?.url) return null;

        return {
          id: String(camera.id),
          name: camera.name || 'Unknown Camera',
          url: wmpView.url,
          thumbnailUrl: wmpView.videoPreviewUrl,
          latitude: camera.location?.latitude,
          longitude: camera.location?.longitude
        };
      })
      .filter((cam: Camera | null): cam is Camera => cam !== null && !!cam.url);
  } catch (error) {
    console.error('Error fetching streaming cameras:', error);
    return [];
  }
};

export const getCameras = async (): Promise<Camera[]> => {
  // Deprecated: Use getStreamingCameras for real data
  return [];
};

export const getTrafficData = async (): Promise<TrafficSegment[]> => {
  // Mock traffic data for MVP visualization
  return [
    { id: '1', name: 'Denver to Eisenhower Tunnel', status: 'Normal', travelTime: 45 },
    { id: '2', name: 'Eisenhower Tunnel to Silverthorne', status: 'Slow', travelTime: 25 },
    { id: '3', name: 'Silverthorne to Vail', status: 'Heavy', travelTime: 45 },
  ];
};

export const getIncidents = async (): Promise<Incident[]> => {
  try {
    const res = await fetch('/api/incidents');
    if (!res.ok) throw new Error('Failed to fetch incidents');
    const data = await res.json();
    return data.features || [];
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return [];
  }
};

export const getRoadConditions = async (): Promise<RoadCondition[]> => {
  try {
    const res = await fetch('/api/road-conditions');
    if (!res.ok) throw new Error('Failed to fetch road conditions');
    const data = await res.json();
    return data.features || [];
  } catch (error) {
    console.error('Error fetching road conditions:', error);
    return [];
  }
};
