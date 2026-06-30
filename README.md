# Laniakea

An interactive, procedurally generated universe explorer built with Vite, React 19, TypeScript, and PixiJS v8. Navigate from the scale of superclusters down to individual star systems, all rendered in real-time with animated nebulae, hyperlane networks, and orbiting planets.

## Overview

The game lets you explore a simulated cosmos across three zoom levels:

1. **Supercluster view** — A 900-million-light-year wide field of thousands of galaxies grouped into clusters and filaments. Tap any galaxy dot to enter it.
2. **Galaxy view** — A procedurally generated spiral galaxy with hundreds of named star systems connected by hyperlanes. Click a system to visit it.
3. **System view** — An animated solar system for the selected star: 3–7 planets across four orbital zones (hot rocky inner planets, habitable worlds, gas giants, ice giants) with moons, rings, asteroid belts, a pulsing corona, and a nebula glow, all orbiting in real time.

A breadcrumb address bar tracks your position through the hierarchy: `Observable Universe > Supercluster > Attractor > Galaxy > System`.

## Features

- **Fully deterministic generation** — Every galaxy, star, hyperlane, and planet is derived from a single integer seed using the mulberry32 PRNG. The same seed always produces the same universe.
- **Spiral galaxy generation** — Configurable arm count (2–5), ellipse shape, and spiral twist. Stars are split across three populations: central bulge, spiral arms, and inter-arm disk.
- **Star classification** — Five spectral types (A, F, G, K, M) with realistic color and size distributions: hot blue/white A-class stars in inner arms grading to cool red M-class dwarfs in the bulge and outer disk.
- **Hyperlane network** — Lanes are derived from Delaunay triangulation with distance cutoffs: generous within arms, tight across arms, creating the feel of a real starmap.
- **Animated nebulae** — Particle-based nebula rendered with blur and displacement filters that animate organically each frame. Inner arms are blue/violet; outer arms use a per-galaxy color palette; the galactic core glows warm white/gold.
- **Supercluster simulation** — Galaxy dots are clustered around 12 named gravitational attractors and connected by filaments, scaled to 900 million light years across.
- **Pan and zoom** — Cursor-anchored zoom via scroll wheel and pointer drag, across all three views.
- **Procedural solar systems** — Each star generates 3–7 planets using zone-based rules: hot rocky inner planets, habitable worlds, gas giants, and ice giants. Orbital speed follows Kepler-like scaling. Planets can have rings (split back/front so the body renders inside the ring plane), moons, and atmospheric glow. A 40% chance asteroid belt is inserted between orbits using Gaussian radial particle distribution.
- **Star rendering** — The sun is rendered with a texture-based gradient, a pulsing scale animation, and a procedural corona (12 long rays + 22 short white rays in screen blend mode that rotates and breathes). A large nebula glow sprite behind the system uses the star's color.
- **Planet resources** — Each planet and moon carries typed resources matching its zone: alloys in the hot zone, nutrients + alloys in the habitable zone, exotic matter from gas and ice giants.
- **Toggleable overlays** — Hyperlane network, attractor labels, and orbit rings can be toggled on/off from the config panel.
- **Resource economy** — Place mining stations on planet resources, settle habitable worlds into colonies, and automate collection with drone logistics routes (see [Gameplay: Extraction & Automation](#gameplay-extraction--automation) below).

## Gameplay: Extraction & Automation

Beyond exploring, you run a ship that mines and ferries resources across the galaxy.

- **Mining stations** — Open a planet's panel and place a station (200 alloys) on one of its surface or moon resources. Stations passively accumulate that resource over time, up to a hold cap, and must be collected before they fill up.
- **Colonies** — Settle a habitable planet (2000 alloys, 500 He-3, 2000 nutrients, 500 metallic hydrogen) to unlock colony production slots that craft upgrade modules over ~24h once fed enough resources.
- **Drone logistics** — The "AUTO" button on the ship HUD opens a network panel where you build multi-stop routes between stations/colonies and dispatch a drone to collect everything along the way, instead of flying to each one yourself.

### Tips for automating extraction

- **Unlock logistics before scaling up.** Drone routes are locked until you put at least one point into the **Logistics-A** workshop track. That first point also raises your station cap from 5 to 8 and grants your first route slot; each additional tier adds +3 stations and +1 route (up to 17 stations / 4 routes at max tier).
- **Logistics-B is throughput, not capacity.** It speeds up how fast stations fill (1.0×→2.0× at max tier) — invest here once you have more stations than your routes can keep collected.
- **Chain stops instead of running many short routes.** Every dispatch pays the same flat base fee (scaled down by Drive-A/B) regardless of stop count, plus distance-based travel cost per hop — bundling nearby stations and colonies into one route avoids paying that base fee over and over.
- **Dispatch is gated, not just a button press.** A route only dispatches once it has ≥2 stops, something to actually collect (accumulated station cargo or a finished colony item), and enough exotic matter/helium-3 on hand to cover the trip — check each route card's cost preview first.
- **Mind the detection warning.** Routing through a region with more than 4 active, undampened stations raises your detection rating. Equip a **Signal Dampener** module on stations there to exempt them from that check.
- **Upgrade modules come from colonies, not a shop.** Assign a colony's production slot to a module recipe, dispatch resources to it until production completes, then collect the finished module on a later run. Each station has two module slots (rate, storage, or detection effects) managed from the Logistics panel's Inventory tab.
- **Drive upgrades compound with logistics.** Drive-A/B reduce both the flat dispatch fee and per-hop travel cost, so they pay off fastest once your network spans multiple systems or galaxies.

## Getting Started

```bash
npm install
npm run dev       # Start dev server with HMR at localhost:5173
npm run build     # Type-check then build for production
npm run preview   # Serve the production build locally
npm run lint      # ESLint
```

## Tech Stack

| Layer | Technology |
|---|---|
| Bundler | Vite |
| UI framework | React 19 + TypeScript |
| Rendering | PixiJS v8 via `@pixi/react` |
| State | Zustand |
| Spatial math | `d3-delaunay` (Delaunay triangulation for hyperlanes) |

## Project Structure

```
src/
  game/       — Pure logic, no rendering (generation, types, constants)
  store/      — Zustand stores (gameStore, uiStore, extractorStore, settlementStore, logisticsStore)
  pixi/       — PixiJS scene components (GalaxyStage, Supercluster, SolarSystem)
  ui/         — React DOM overlay components (address bar, config panel)
```

## Controls

| Action | Input |
|---|---|
| Pan | Click and drag |
| Zoom | Scroll wheel (cursor-anchored) |
| Enter galaxy | Click a supercluster dot (zoom ≥ 0.5) |
| Enter system | Click a star in galaxy view |
| Navigate back | Click any breadcrumb segment |
| Toggle hyperlanes | Config panel |
| Toggle labels | Config panel |
| Toggle orbit rings | Config panel |
| New galaxy | Config panel seed input |
