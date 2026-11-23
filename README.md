[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/c/gta6-01)
[![rank](https://make.fun/badge/gta6-01/kacky000/coralport/rank.svg)](https://make.fun/c/gta6-01)
[![reward](https://make.fun/badge/gta6-01/kacky000/coralport/reward.svg)](https://make.fun/c/gta6-01)

# Coralport

An original 3D open-world crime game set in the sun-soaked coastal city of Coralport. Built entirely with procedural geometry in three.js — no external assets, no build step, runs from static files in any browser.

## The City

Coralport has five distinct districts:
- **Palm Beach** — beachfront bars, palm trees, and low-rise shops
- **Downtown** — glass towers, busy intersections, the financial heart
- **Harbor District** — cranes, warehouses, shipping containers
- **Canal District** — waterways, colorful low-rises, hidden alleys
- **Coral Heights** — hillside mansions overlooking the city

## Story

You play as **Marco Reyes**, a drifter who arrives in Coralport looking for work. Your first contact, **Lucia Vega**, runs the Sunset Shack beach bar and pulls you into the criminal underworld. Through 6 story missions you'll work for crime boss **Don Salazar**, face off against corrupt **Detective Cruz**, race street racer **Tommy Kai**, and fight to claim your place in the city.

## Features

- **Open world** — explore a full city on foot or by car with five named districts
- **Vehicles** — steal and drive cars with arcade physics (acceleration, braking, drifting)
- **Traffic system** — NPC cars follow roads and stop at traffic lights
- **Pedestrians** — NPCs walk sidewalks and flee from danger
- **Wanted level** — 1-5 stars with police cars that chase and form roadblocks
- **Escape mechanic** — lose the cops by getting outside their search radius
- **Combat** — fists, pistol, and SMG with muzzle flash and hit effects
- **6 story missions** — with named characters, dialogue, timers, objectives, and cash rewards
- **HUD** — minimap, health/armor bars, money, wanted stars, weapon/ammo, speed, district name
- **Minimap** — rotates with the camera, shows roads, player arrow, mission and police blips
- **Map screen** — press M to see the full city map with districts and mission list
- **Save/Load** — progress saved to localStorage
- **Start screen** — New Game / Continue with controls guide
- **Pause menu** — resume, save, quit
- **Sound** — synthesized engine, gunshots, sirens, impacts, and in-car radio with 3 stations
- **Golden-hour lighting** — directional sun, shadows, warm fog, sky shader
- **Procedural ocean** — animated water with reflections and wave shader
- **Day atmosphere** — palm trees, street lights, harbor cranes, rooftop details

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move / Drive |
| Mouse | Look around |
| Shift | Run |
| Space | Jump / Handbrake |
| F | Enter / Exit vehicle |
| Click | Attack / Shoot |
| 1-3 | Switch weapon |
| R | Switch radio station (in car) |
| M | Toggle map |
| ESC | Pause |

## How to Run

```bash
node serve.ts
# Open http://localhost:8080 in Chrome
```

## Tech

- **three.js** (r170) for 3D rendering, vendored as a single minified module
- All art is procedural: buildings, vehicles, characters, trees, water, sky — generated in code
- All sound is synthesized with WebAudio
- ES modules split across 25+ files with clear responsibilities
- No build step, no bundler, no network requests — pure static files
