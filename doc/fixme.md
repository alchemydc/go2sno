# bugs to fix
- [ ] weather card in Dashboard.tsx is blue, whether theme is light or dark.  make styling consistent with other cards.
- [ ] routeplanner shows "dry" conditions on map, which clutters the map and is not useful information

# features to add
- multi-region support
  - [ ] utah: partially supported
    - [x] route planning
    - [x] weather
    - [x] lift status, trail and park status
    - [ ] road cameras
    - [ ] avalanche forecast
    - [ ] road conditions
    - [ ] road incidents
  - [ ] tahoe: partially supported
      - [x] route planning
      - [x] weather
      - [x] lift status, trail and park status
      - [x] road cameras
      - [x] road conditions
      - [x] road incidents
      - [ ] avalanche forecast
  - [ ] BC?

- [ ] color coding of traffic delay(s) on route map in `src/components/RoutePlanner.tsx`

# chores
- [ ] move console.logging to DEBUG mode.  will need the debugging as dealing with conditions / incidents multi-region is going to require some work

# security 
- [ ] input validation for user provided params to `src/app/api/route/route.ts`.  params are passed onwards to tomtom api


