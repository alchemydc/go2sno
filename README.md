# go2sno

A real-time dashboard for snow-philes of all stripes to check travel times, road conditions, avalanche forecasts, weather, and resort status. Inspired by [snowgogo.com](https://snowgogo.com).

## What Works (Rocky Mountain region)
*   **Dashboard:** Aggregated view of route, reported delays, avalanche forecasts, cameras, weather, and resorts.
*   **Route Planner:** Interactive map with routing to and from major snow destinations.
*   **Real-time Alerts:** Integration with COtrip API for active road incidents and travel alerts.
*   **Road Cameras:** Live HLS streaming video feeds from CDOT cameras along the route.
*   **Weather:** Real-time weather data for the selected destination (NWS API).
*   **Avalanche Forecasts:**  Avalanche forecast for selected destination from CAIC.
*   **Resort Status:** Sortable list of resort snow reports and lift status (currently using mock data).
*   **Dark Mode:** Full dark theme support.

## Work Planned
*   **Utah Avalanche Forecasts:** Integration with Utah Avalanche Center API for avalanche forecasts.
*   **Utah Road Conditions:** Integration with Utah Department of Transportation API for road conditions. 
*   **Tahoe Avalanche Forecasts:** Integration with Tahoe Avalanche Center API for avalanche forecasts.
*   **Tahoe Road Conditions:** Integration with California/NV Department of Transportation API for road conditions. (?)
*   **Real Resort Data:** Integration with resort APIs (e.g., Epic/Ikon) for live lift status and snow reports. (?).  May need to roll our own.
*   **Mobile Optimization:** Improved touch controls and layout refinements for small screens.



## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure Environment:
    Create a `.env` file in the root directory and add your required API keys:
    - COtrip: road conditions and accidents/incidents
    - tomtom: routing
    ```env
    COTRIP_API_KEY=your_api_key_here
    TOMTOM_API_KEY=your_api_key_here
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Build for production:
    ```bash
    npm run build
    ```

## Tech Stack

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Vanilla CSS (with CSS Variables for theming)
*   **Icons:** Lucide React
*   **Data Sources:**
    *   COtrip API (Road Incidents & Conditions)
    *   TomTom (routing)
      - `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=${apiKey}&traffic=true`;
    *   National Weather Service API (Weather)
