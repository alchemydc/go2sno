# go2sno

A real-time dashboard for snow-philes of all stripes to check travel times, road conditions, avalanche forecasts, weather, and resort status (lifts/terrain). Inspired by [snowgogo.com](https://snowgogo.com) which is awesome, but unfortunately only supports Tahoe.

## Features

*   **Multi-Region Support:** Seamlessly switch between **Colorado**, **Utah**, **Tahoe**, **Pacific Northwest**, **Japan**, **New Zealand**, and **East Coast**.
*   **Trip Planner:** Interactive map with routing to and from major snow destinations (Gateways to Resorts).
*   **Real-time Travel Alerts:** Integration with CDOT (COtrip) and TomTom for active road incidents and travel times.
*   **Road Cameras:** Live HLS streaming video feeds from CDOT and Caltrans.
    *   *Smart Prioritization:*  Cameras are dynamically ranked by relevance to your route, prioritizing those near active incidents, adverse weather, or key regional landmarks.
*   **Weather:** Real-time weather data and forecasts (NWS API).
*   **Resort Status:** Unified view of lift & trail status across different ownership groups (Epic, Ikon, Independent).
    *   *Data Sources:* Direct API integration (Epic Mix), Web Scraping (Micrawl fallback), and Weather-based inference.
    *   *Metrics:* Open lifts, terrain park status, and 24h snow totals (rounded for clarity).
    *   *Sorting:* Sort by Snow Report or **Pass Affiliation** (Epic, Ikon, Independent).
*   **Avalanche Forecasts:**  Regional avalanche danger ratings from CAIC (Colorado). Stubs in place for other regions.

## Known Issues

*   **Routing (TomTom):** Route calculation to Stevens Pass (PNW) may occasionally fail due to API data issues in that specific area.
*   **Snow Data Discrepancy:** Open-Meteo provides **weather model estimates**, not actual measurements. Resort-reported snow (from Epic/Ikon APIs) represents physical snow stake measurements and is significantly more accurate. Large discrepancies (e.g., 12" reported vs 0.4" modeled) are expected for mountain environments where models struggle with orographic effects and microclimates. The comparison is intentionally shown to help identify potential over-reporting by resorts.

## Architecture

This project uses a modern, extensible architecture designed to support multiple regions and diverse data sources.

### Core Concepts

1.  **Region Configuration (`src/config/regions.ts`)**: 
    - The app is driven by a configuration file that defines regions (e.g., `co`, `ut`, `tahoe`, `pnw`, `japan`, `nz`, `us-east`). 
    - Each region defines its map bounds, resorts, active service providers (e.g., which Road API to use), and **prioritization keywords** for road cameras.

2.  **Service Factory (`src/services/factory.ts`)**: 
    - A central factory instantiates the correct services based on the selected region.
    - **Road Service:** Returns `IRoadService` (e.g., `CdotRoadService` for CO, `CaltransRoadService` for Tahoe, `StubRoadService` for others).
    - **Avalanche Service:** Returns `IAvalancheService` (e.g., `CaicAvalancheService` for CO).

3.  **Unified Resort Data (`src/services/snow-report`)**:
    - **`ResortStatusManager`**: A robust orchestrator that fetches data from multiple providers.
    - **Providers**: 
        - `EpicMixProvider`: Fetches real-time status for Vail Resorts.
        - `MicrawlProvider`: Scrapes resort websites as a fallback.
        - `OpenMeteoProvider`: Provides weather and snow data.
    - **Domain Model**: All data is normalized into a shared `ResortStatus` interface, isolating the UI from API differences.

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
    MICRAWL_API_URL=your_micrawl_api_url_here
    # note: ikon API key must be forcibly extracted from ikon mobile app :(
    IKON_API_KEY=your_ikon_api_key_here
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
*   **Mapping:** MapLibre GL
*   **Data Sources:**
    *   COtrip API / Caltrans (Roads)
    *   TomTom (Routing)
    *   National Weather Service (Weather)
    *   Open-Meteo (Snow Reports)
    *   CAIC (Avalanche)
    *   EpicMix (Resort Status) (public, undocumented)
    *   Ikon (Resort Status) (private, undocumented)
