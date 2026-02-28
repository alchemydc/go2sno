# go2sno

A real-time dashboard for snow-philes of all stripes to check travel times, road conditions, avalanche forecasts, weather, and resort status (lifts/terrain). Inspired by [snowgogo.com](https://snowgogo.com) which is awesome, but unfortunately only supports Tahoe.

## Features

*   **Multi-Region Support:** Seamlessly switch between **Colorado**, **Utah**, **Tahoe**, **SoCal**, **Pacific Northwest**, **Japan**, **New Zealand**, and **East Coast**. Region selection persists across sessions via localStorage.
*   **Trip Planner:** Interactive MapLibre GL map with routing between gateways and resorts. Displays travel time, delays, and route geometry. Origin/destination dropdowns are region-aware.
*   **Real-time Travel Alerts:** Road incidents and conditions from CDOT (Colorado) and Caltrans (Tahoe/SoCal). Markers plotted on the map with incident type, description, and timestamps.
*   **Road Cameras:** Live HLS streaming video and still-image feeds from CDOT and Caltrans.
    *   *Smart Prioritization:* Cameras are dynamically ranked by proximity to your active route (~1 mi buffer), weighted by active incidents, adverse weather, and configurable regional keywords.
*   **Weather:** Real-time weather data and forecasts via the National Weather Service API.
*   **Resort Status:** Unified view of lift, trail, and terrain park status across different ownership groups (Epic, Ikon, Independent).
    *   *Data Sources:* Multi-provider fallback — Epic Mix API → Ikon API → Micrawl web scraping → Open-Meteo weather modeling. The `ResortStatusManager` tries providers in order and merges results.
    *   *Metrics:* Open lifts, open/total percentage, terrain park status, and 24h snow totals (both resort-reported and weather-modeled).
    *   *Sorting:* Sort by Snow Report, alphabetically, or by **Pass Affiliation** (Epic, Ikon, Independent).
    *   *Overlays:* Detailed lift status and terrain park modals with open/scheduled/hold/closed groupings.
*   **Avalanche Forecasts:** Regional avalanche danger ratings (1–5 scale with color coding) from CAIC (Colorado). Stubs in place for UAC (Utah), SAC (Tahoe), and other regions.

## Region Status

| Region | Resorts | Roads | Avalanche | Notes |
|--------|---------|-------|-----------|-------|
| Colorado | ✅ Epic + Ikon + Independent | ✅ CDOT (COtrip) | ✅ CAIC | Work in progress |
| Utah | ✅ Epic + Ikon + Independent | 🔲 UDOT (stub) | 🔲 UAC (stub) | Resort status works; road/avy pending |
| Tahoe | ✅ Epic + Ikon + Independent | ✅ Caltrans | 🔲 SAC (stub) | |
| SoCal | ✅ Epic + Ikon + Independent | ✅ Caltrans | — | No avalanche center |
| PNW | ✅ Epic + Ikon + Independent | 🔲 Stub | 🔲 Stub | Resort status works |
| Japan | ✅ Epic + Ikon | 🔲 Stub | 🔲 Stub | Resort status works |
| New Zealand | ✅ Ikon | 🔲 Stub | 🔲 Stub | Resort status works |
| East Coast | ✅ Epic + Ikon + Independent | 🔲 Stub | 🔲 Stub | Resort status works |

## Known Issues

*   **Snow Data Discrepancy:** Open-Meteo provides **weather model estimates**, not actual measurements. Resort-reported snow (from Epic/Ikon APIs) represents physical snow stake measurements and is significantly more accurate. Large discrepancies (e.g., 12" reported vs 0.4" modeled) are expected for mountain environments where models struggle with orographic effects and microclimates. The comparison is intentionally shown to help identify potential over-reporting by resorts.

## Architecture

This project uses a modern, extensible architecture designed to support multiple regions and diverse data sources.

### Core Concepts

1.  **Region Configuration (`src/config/regions.ts`)**:
    - The app is driven by a configuration file that defines regions (`co`, `ut`, `tahoe`, `socal`, `pnw`, `japan`, `nz`, `us-east`).
    - Each region defines its map center/zoom/bounds, location lists (gateways, towns, resorts), active service providers, service support flags, and **prioritization keywords** for road cameras.

2.  **Service Factory (`src/services/factory.ts`)**:
    - A central factory instantiates the correct services based on the selected region's `providers` config.
    - **Road Service:** Returns `IRoadService` — `CdotRoadService` (CO), `CaltransRoadService` (Tahoe/SoCal), `UdotRoadService` (UT), or `StubRoadService`.
    - **Avalanche Service:** Returns `IAvalancheService` — `ColoradoAvalancheService` (CO), `UtahAvalancheService` (UT), or `StubAvalancheService`.

3.  **Unified Resort Data (`src/services/snow-report/`)**:
    - **`ResortStatusManager`**: Orchestrates multi-provider data fetching with fallback.
    - **Providers (tried in order)**:
        - `EpicMixProvider`: Direct API integration for Vail Resorts properties (lifts, trails, parks, daily stats).
        - `IkonApiProvider`: Direct API integration for Ikon-affiliated resorts (lifts, trails, summary stats).
        - `MicrawlProvider`: Web scraping fallback for resorts without API access (cached 5 min).
        - `OpenMeteoProvider`: Always fetched as weather supplement (temperature, modeled snowfall).
    - **Merge Logic**: Reported snow from primary providers is preserved; calculated snow from Open-Meteo is overlaid. Primary provider data always wins for lift/trail status.
    - **Domain Model**: All data is normalized into a shared `ResortStatus` interface (`src/types/domain.ts`), isolating the UI from API differences.

4.  **API Layer (`src/app/api/v1/`)**:
    - `/roads/incidents` — CDOT JSON / Caltrans KML parsing
    - `/roads/conditions` — Road conditions by region
    - `/roads/cameras` — HLS camera feeds filtered by region
    - `/roads/weather-stations` — Caltrans RWIS data
    - `/avalanche` — CAIC forecasts by zone
    - `/resorts/[id]/status` — Resort status via `ResortStatusManager`
    - `/route` — TomTom routing
    - `/weather` — NWS weather by lat/lon

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure Environment:
    Create a `.env` file in the root directory and add your required API keys:
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

4.  Run tests:
    ```bash
    npm test              # watch mode
    npm run test:unit     # single run
    npm run test:coverage # with coverage
    ```

5.  Build for production:
    ```bash
    npm run build
    ```

## Tech Stack

*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript 5.9
*   **UI:** React 19
*   **Styling:** Vanilla CSS (with CSS Variables for theming)
*   **Icons:** Lucide React
*   **Mapping:** MapLibre GL
*   **Testing:** Vitest + React Testing Library
*   **Data Sources:**
    *   COtrip API (Colorado roads, cameras)
    *   Caltrans QuickMap (Tahoe/SoCal roads, cameras, weather stations)
    *   TomTom (Routing)
    *   National Weather Service (Weather)
    *   Open-Meteo (Modeled snow/temperature)
    *   CAIC (Colorado avalanche forecasts)
    *   Epic Mix API (Vail Resorts lift/trail/park status) — public, undocumented
    *   Ikon / MtnPowder API (Ikon resort lift/trail status) — private, undocumented
    *   Micrawl (Web scraping fallback for resort status)
