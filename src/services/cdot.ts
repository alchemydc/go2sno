export interface Camera {
  id: string;
  name: string;
  url: string; // Placeholder image URL
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
  properties: {
    type: string;
    startTime: string;
    travelerInformationMessage: string;
    routeName: string;
    primaryLatitude: number;
    primaryLongitude: number;
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

export const getCameras = async (): Promise<Camera[]> => {
  // Placeholder cameras as per MVP
  return [
    { id: '1', name: 'Floyd Hill', url: 'https://placehold.co/600x400?text=Floyd+Hill+Camera' },
    { id: '2', name: 'Eisenhower Tunnel East', url: 'https://placehold.co/600x400?text=Eisenhower+Tunnel+East' },
    { id: '3', name: 'Eisenhower Tunnel West', url: 'https://placehold.co/600x400?text=Eisenhower+Tunnel+West' },
    { id: '4', name: 'Georgetown', url: 'https://placehold.co/600x400?text=Georgetown' },
    { id: '5', name: 'Silverthorne', url: 'https://placehold.co/600x400?text=Silverthorne' },
    { id: '6', name: 'Vail Pass', url: 'https://placehold.co/600x400?text=Vail+Pass' },
  ];
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
