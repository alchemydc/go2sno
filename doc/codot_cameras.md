# CDOT Camera Integration Documentation

This document describes the integration with the Colorado Department of Transportation (CDOT) camera network for the Go2Sno application.

## API Endpoint

The integration uses an undocumented production API endpoint discovered from the official [COtrip Traveler Information](https://cotrip.org) website.

- **URL**: `https://cotg.carsprogram.org/cameras_v1/api/cameras`
- **Method**: `GET`
- **Access**: Public (No authentication required)
- **CORS**: Enabled (`Access-Control-Allow-Origin: *`), supporting direct browser requests.

## Data Structure

The API returns a JSON array of camera objects. The structure is as follows:

```typescript
interface CotripCamera {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  public: boolean;
  location: {
    latitude: number;
    longitude: number;
    // ... other location info
  };
  views: CotripCameraView[];
  // ... other fields
}

interface CotripCameraView {
  name: string;
  type: string; // "STILL_IMAGE" | "WMP" | "VIDEO"
  url: string;
  videoPreviewUrl?: string; // Thumbnail for WMP/VIDEO types
  imageTimestamp?: number;
}
```

### Key Fields

- `active` & `public`: Used to filter available cameras.
- `views`: An array of media sources for the camera. We are interested in views with `type: "WMP"`.

## Streaming & Playback

### Stream URLs
The `WMP` view type provides HLS (HTTP Live Streaming) URLs pointing to CDOT's public streaming servers.

- **Example URL**: `https://publicstreamer2.cotrip.org:443/rtplive/070E28520CAM1RP2/playlist.m3u8`
- **Protocol**: HTTPS
- **Format**: `.m3u8` playlist (HLS)

These servers (`publicstreamer1` through `publicstreamer4`) serve HLS content that is accessible from standard web browsers without special authentication tokens.

### Thumbnail Previews
The `WMP` view also provides a `videoPreviewUrl`. This is a static image snapshot of the current stream, which we use as a thumbnail.

- **Example URL**: `https://cocam.carsprogram.org/Snapshots/070E28520CAM1RP2.flv.png`

## Implementation Details

### Service Layer (`src/services/cdot.ts`)
The `getStreamingCameras` function handles data fetching and transformation:

1.  Fetches data from `https://cotg.carsprogram.org/cameras_v1/api/cameras`.
2.  Filters for `public` and `active` cameras.
3.  Maps the raw data to our application's `Camera` interface.
4.  **Critical Logic**: It searches the `views` array for a view where `type === 'WMP'`.
    - If found, it uses the view's `url` for the video stream.
    - It uses the view's `videoPreviewUrl` for the thumbnail.

### UI Component (`src/components/CameraCard.tsx`)
The `CameraCard` component manages playback state to optimize performance and user experience:

1.  **Initial State**: Displays the `thumbnailUrl` image with a "Play" button overlay. This avoids opening hundreds of HLS connections on page load.
2.  **Interaction**: When the user clicks the card, the state switches to `isPlaying`.
3.  **Playback**: The `hls.js` library (or native HLS on Safari) initializes and loads the stream directly from the `url`.
4.  **Error Handling**: If the stream fails (timeout or network error), an error message with a "Retry" button is displayed.

## Future Enhancements

Potential improvements for the camera integration:

1.  **Loading State**: Add a visual spinner while the video player initializes after clicking.
2.  **Retry Logic**: Automatically attempt to reconnect if the stream drops or times out.
3.  **Caching**: Implement browser caching for thumbnail images to reduce bandwidth on repeated visits.
4.  **Fullscreen**: Add a fullscreen toggle to the video player for better visibility.
5.  **Status Filtering**: Visually distinguish cameras that are currently "offline" or have stale timestamps.
