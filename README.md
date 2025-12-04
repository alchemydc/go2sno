# Colorado Snow Go

A real-time dashboard for Colorado skiers to check I-70 road conditions, weather, and resort status. Inspired by [snowgogo.com](https://snowgogo.com).

## Features

*   **Dashboard:** Aggregated view of route, cameras, weather, and resorts.
*   **Route Planner:** Interactive map with routing from Boulder/Denver to major ski destinations (Leadville, Vail, Breckenridge, etc.).
*   **Real-time Alerts:** Integration with COtrip API for active road incidents and travel alerts.
*   **Road Cameras:** Live camera feeds (currently placeholders) for key I-70 locations.
*   **Weather:** Real-time weather data for the selected destination.
*   **Resort Status:** Sortable list of resort snow reports and lift status (mock data).
*   **Dark Mode:** Full dark theme support.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure Environment:
    Create a `.env` file in the root directory and add your COtrip API key:
    ```env
    COTRIP_API_KEY=your_api_key_here
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
    *   National Weather Service API (Weather)
