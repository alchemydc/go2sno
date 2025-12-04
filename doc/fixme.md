# bugs to fix
- weather card in Dashboard.tsx is blue, whether theme is light or dark.  make styling consistent with other cards.

# features to add
- multi-region support
  - utah
  - tahoe
  - BC?

will be non trivial to add as presently the follow data sources are region specific
  - CDOT road conditions / incidents
  - CAIC avalanche forecasts / events / etc.
  - Utah roads
  - Utah avalanche forecasting

- color coding of traffic delay(s) on route map in `src/components/RoutePlanner.tsx`

# chores
- move console.logging to DEBUG mode.  will need the debugging as dealing with conditions / incidents multi-region is going to require some work

# security 
- input validation for user provided params to `src/app/api/route/route.ts`.  params are passed onwards to tomtom api


