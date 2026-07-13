# Trip Command Center

Plan any trip like an operation: optimized routes, arrival times, weather for every stop,
day plans, meals, stays, expense splits, and a giant map — inspired by
[palantir-for-family-trips](https://github.com/andrewjiang/palantir-for-family-trips),
rebuilt to be **completely free to run**. No API keys, no accounts, no billing, no backend.

![Dashboard](docs/dashboard-overview.png)

## What it does

- **Trip setup** — enter start/end dates, a start location, a final destination, optional
  overnight stops, and every place you want to visit (live location search, worldwide).
- **Best-path planning** — real travel times between all stops, auto-ordered for the
  shortest total route (nearest-neighbor + 2-opt over the OSRM duration matrix). Toggle to
  **manual order** and drag stops to rearrange; times recalculate live.
- **Travel modes** — plan the same trip by **car, bike, or on foot**; travel times, the
  optimized path, and the schedule all follow the chosen mode.
- **Planned path manifest** — travel time and distance for every leg, arrival/departure
  time at every stop scheduled across your days, and an on-schedule / overrun check
  against your end date.
- **Weather for each location** — Open-Meteo daily forecast on each stop's arrival date
  (high/low, conditions, precipitation) in the inspector, the map overlay, and the
  day-by-day timeline.
- **Map modes** — switch the big map between dark ops, light, streets, satellite, and
  terrain base layers. **Right-click anywhere on the map to add a stop** (named by
  reverse geocoding).
- **Command dashboard** — numbered stops, route lines, inbound routes for each travel
  group, a day-by-day timeline, and timeline playback that animates everyone across the
  map.
- **Departure day launch** — a countdown overlay for the day you leave, because group
  travel deserves drama.
- **Full logistics surfaces** — day plans with backup plans, meal plan, stays, expense
  ledger with even-split settlement, and travel groups.
- **Easy add & remove everywhere** — every stop, day plan, meal, stay, expense, group,
  checklist item, and trip has an obvious add control and a one-click remove.
- **Autosave** — everything persists to your browser's localStorage. Export/import trips
  as JSON. Multiple trips, deletable at any time.

![Route setup](docs/route-setup.png)
![Departure day launch](docs/mission-launch.png)

## Zero-cost by design

| Capability | Service | Cost |
|---|---|---|
| Map tiles (5 modes) | [CARTO](https://carto.com/attributions) dark/light, [OpenStreetMap](https://www.openstreetmap.org) streets, Esri satellite imagery, [OpenTopoMap](https://opentopomap.org) terrain | Free with attribution |
| Travel times & routes | [FOSSGIS OSRM](https://routing.openstreetmap.de/) (car / bike / foot) + [OSRM demo](https://project-osrm.org/) fallback | Free, keyless |
| Location search & reverse geocoding | [Photon](https://photon.komoot.io/) (OpenStreetMap geocoder) | Free, keyless |
| Weather | [Open-Meteo](https://open-meteo.com/) | Free, keyless (non-commercial) |
| Fonts | Inter + Geist Mono, bundled locally via Fontsource | Free, open source |
| Storage | Browser localStorage | Free |
| Hosting | Static files — GitHub Pages / Netlify / Vercel free tiers | Free |

There is no `.env`, no key to provision, and nothing that can ever send you a bill.

The public OSRM and Photon instances are fair-use community services — the app debounces
autocomplete, caches every matrix/route/forecast response, and issues one table call per
replan. If a service is unreachable, the planner degrades to straight-line estimates and
shows an amber `OFFLINE ESTIMATE` chip instead of failing. For a heavily trafficked public
deployment, consider [self-hosting OSRM](https://github.com/Project-OSRM/osrm-backend) and
[Photon](https://github.com/komoot/photon).

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). A demo trip loads on first visit —
open **Setup** (second sidebar icon) to plan your own, or press **Load demo trip** to get
the sample back.

```bash
npm run build   # static production build in dist/
```

## Deploy to GitHub Pages

A workflow at `.github/workflows/deploy-pages.yml` builds and publishes the site on every
push to the default branch. One-time setup: in the repository's **Settings → Pages**, set
**Source** to **GitHub Actions**. The site then goes live at
`https://<your-username>.github.io/tripplanner/` (the build uses relative asset paths, so
it works from any URL). You can also trigger a deploy manually from the Actions tab.

## Stack

React 19 · Vite · Leaflet + react-leaflet · Framer Motion · Lucide icons · date-fns.
State is plain JSON in localStorage — no server, no database.

## Where things live

- `src/state/` — trip data model, localStorage persistence, demo seed, app context
- `src/lib/` — geocoding (search + reverse), OSRM routing per travel mode with caching and
  offline fallback, path optimizer, day-by-day scheduler, Open-Meteo weather, map base
  layers, playback interpolation
- `src/views/` — one file per surface (dashboard, setup, day planner, meals, stays,
  expenses, groups); dashboard subcomponents in `src/views/dashboard/`
- `src/overlays/MissionLaunch.jsx` — the departure-day countdown overlay
- `src/index.css` — the whole design system (dark-only tokens per the reference's
  Palantir-style spec)
