import { logger } from '../utils/logger';
import { IRoadService } from './interfaces';
import { Camera, Incident, RoadCondition } from '../types/domain';

export class CdotRoadService implements IRoadService {
  async getIncidents(): Promise<Incident[]> {
    logger.debug('CdotRoadService: fetching incidents');
    try {
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error('Failed to fetch incidents');
      const data = await res.json();
      const incidents = (data.features || []).map((f: any) => {
        let lat = 0;
        let lon = 0;

        if (f.geometry && f.geometry.coordinates) {
          if (f.geometry.type === 'Point') {
            lon = f.geometry.coordinates[0];
            lat = f.geometry.coordinates[1];
          } else if (f.geometry.type === 'MultiPoint' && f.geometry.coordinates.length > 0) {
            // Take the first point
            lon = f.geometry.coordinates[0][0];
            lat = f.geometry.coordinates[0][1];
          }
        }

        return {
          id: f.id,
          type: f.properties.type,
          description: f.properties.travelerInformationMessage,
          startTime: f.properties.startTime,
          location: { lat, lon },
          routeName: f.properties.routeName
        };
      });
      logger.debug(`CdotRoadService: found ${incidents.length} incidents`);
      return incidents;
    } catch (error) {
      logger.error('CdotRoadService: Error fetching incidents', { error });
      return [];
    }
  }

  async getConditions(): Promise<RoadCondition[]> {
    logger.debug('CdotRoadService: fetching road conditions');
    try {
      const res = await fetch('/api/road-conditions');
      if (!res.ok) throw new Error('Failed to fetch road conditions');
      const data = await res.json();

      const conditions = (data.features || []).map((f: any) => ({
        location: {
          lat: f.properties.primaryLatitude,
          lon: f.properties.primaryLongitude
        },
        routeName: f.properties.routeName,
        status: f.properties.currentConditions[0]?.conditionDescription || 'Unknown',
        description: f.properties.currentConditions[0]?.conditionDescription || ''
      }));

      logger.debug(`CdotRoadService: found ${conditions.length} conditions`);
      return conditions;
    } catch (error) {
      logger.error('CdotRoadService: Error fetching road conditions', { error });
      return [];
    }
  }

  async getCameras(filterRoute?: string): Promise<Camera[]> {
    logger.debug('CdotRoadService: fetching cameras', { filterRoute });
    try {
      const url = 'https://cotg.carsprogram.org/cameras_v1/api/cameras';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch cameras');

      const data = await res.json();

      const cameras = (data || [])
        .filter((camera: any) => camera.public && camera.active)
        .map((camera: any) => {
          // Find the WMP (Windows Media Player/HLS streaming) view
          const wmpView = camera.views?.find((view: any) => view.type === 'WMP');

          if (!wmpView?.url) return null;

          // Simple location-based filter could happen here if we had lat/lon bounds for route
          // For now, we return all and let the UI filter or map display them

          return {
            id: String(camera.id),
            name: camera.name || 'Unknown Camera',
            url: wmpView.url,
            type: 'stream' as const,
            thumbnailUrl: wmpView.videoPreviewUrl,
            location: {
              lat: camera.location?.latitude,
              lon: camera.location?.longitude
            },
            regionId: 'co'
          };
        })
        .filter((cam: Camera | null): cam is Camera => cam !== null && !!cam.url);

      logger.debug(`CdotRoadService: found ${cameras.length} streaming cameras`);
      return cameras;
    } catch (error) {
      logger.error('CdotRoadService: Error fetching streaming cameras', { error });
      return [];
    }
  }
}

// Deprecated legacy exports for backward compatibility during refactor
// (Can be removed once factory.ts is updated)
export const getIncidents = async () => new CdotRoadService().getIncidents();
export const getRoadConditions = async () => new CdotRoadService().getConditions();
export const getStreamingCameras = async () => new CdotRoadService().getCameras();

// Re-export specific legacy types if needed by other components temporarily,
// OR essentially just remove them if we are confident.
// Given the errors "Import declaration conflicts with local declaration", we must remove the local ones.
// The code below the class was the original file content which is now duplicated.
// I am replacing everything from line 100 onwards (after the class) with just the compatibility exports.

