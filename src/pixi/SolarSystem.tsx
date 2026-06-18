import { Application, useApplication } from "@pixi/react";
import { useCamera } from "./useCamera";
import { CAMERA_INITIAL_SCALE, SYSTEM_CAMERA_MIN_SCALE } from "../game/constants";
import { Container, Graphics, Sprite, Texture, Ticker } from "pixi.js";
import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { useUIStore } from "../store/uiStore";
import { BackgroundStars } from "./BackgroundStars";
import { createRng } from "../game/galaxyGen";
import { createSunTexture, createNebulaGlowTexture, createGasGiantTexture } from "./textures";
import type { Rng } from "../game/types";

type MoonState = { gfx: Graphics; angle: number; speed: number; dist: number };
type PlanetState = { container: Container; angle: number; speed: number; orbitRadius: number; moons: MoonState[] };

function createPlanetRings(rx: number, ry: number): { back: Graphics; front: Graphics } {
  const k = 0.5522847498;
  const s1 = { color: 0xddcc99, width: 5, alpha: 0.65 };
  const s2 = { color: 0xeeddbb, width: 2, alpha: 0.35 };

  const back = new Graphics();
  back.moveTo(rx, 0).bezierCurveTo(rx, -k*ry, k*rx, -ry, 0, -ry).bezierCurveTo(-k*rx, -ry, -rx, -k*ry, -rx, 0).stroke(s1);
  back.moveTo(rx*0.78, 0).bezierCurveTo(rx*0.78, -k*ry*0.78, k*rx*0.78, -ry*0.78, 0, -ry*0.78).bezierCurveTo(-k*rx*0.78, -ry*0.78, -rx*0.78, -k*ry*0.78, -rx*0.78, 0).stroke(s2);
  back.rotation = 0.3;

  const front = new Graphics();
  front.moveTo(-rx, 0).bezierCurveTo(-rx, k*ry, -k*rx, ry, 0, ry).bezierCurveTo(k*rx, ry, rx, k*ry, rx, 0).stroke(s1);
  front.moveTo(-rx*0.78, 0).bezierCurveTo(-rx*0.78, k*ry*0.78, -k*rx*0.78, ry*0.78, 0, ry*0.78).bezierCurveTo(k*rx*0.78, ry*0.78, rx*0.78, k*ry*0.78, rx*0.78, 0).stroke(s2);
  front.rotation = 0.3;

  return { back, front };
}

function createBodyGfx(radius: number, color: number, highlightAlpha: number): Graphics {
  const gfx = new Graphics();
  gfx.circle(0, 0, radius).fill({ color });
  gfx.circle(-radius * 0.28, -radius * 0.28, radius * 0.4).fill({ color: 0xffffff, alpha: highlightAlpha });
  return gfx;
}

const ASTEROID_COLORS = [0x888888, 0x999999, 0xaaaaaa, 0x776655, 0x887766, 0x998877];

function createAsteroidBelt(rng: () => number, planets: PlanetState[]): Container | null {
  if (planets.length < 2 || rng() > 0.4) return null;
  const gapIdx = Math.floor(rng() * (planets.length - 1));
  const beltInnerR = planets[gapIdx].orbitRadius * 1.12;
  const beltOuterR = beltInnerR * 1.10;
  const beltCenter = (beltInnerR + beltOuterR) / 2;
  const beltSigma = (beltOuterR - beltInnerR) / 1.5;

  type Particle = { x: number; y: number; r: number; a: number };
  const batches = new Map<number, Particle[]>();

  const numAsteroids = (Math.floor(rng() * 1250) + 1250) * gapIdx;
  for (let i = 0; i < numAsteroids; i++) {
    const u1 = Math.max(rng(), 1e-10);
    const u2 = rng();
    const radius = beltCenter + beltSigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    if (radius <= 0) continue;
    const theta = rng() * Math.PI * 2;
    const size = rng() * 5 + 1;
    const color = ASTEROID_COLORS[Math.floor(rng() * ASTEROID_COLORS.length)];
    const alpha = 0.35 + rng() * 0.55;
    let batch = batches.get(color);
    if (!batch) { batch = []; batches.set(color, batch); }
    batch.push({ x: Math.cos(theta) * radius, y: Math.sin(theta) * radius, r: size, a: alpha });
  }

  const beltGfx = new Graphics();
  for (const [color, particles] of batches) {
    const avgAlpha = particles.reduce((sum, p) => sum + p.a, 0) / particles.length;
    for (const p of particles) beltGfx.circle(p.x, p.y, p.r);
    beltGfx.fill({ color, alpha: avgAlpha });
  }

  const belt = new Container();
  belt.addChild(beltGfx);
  return belt;
}

function createNebulaSprite(color: number, sunRadius: number): Sprite {
  const texture = createNebulaGlowTexture(color);
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  const size = Math.max(sunRadius * 30, 3000);
  sprite.width = size;
  sprite.height = size;
  sprite.blendMode = 'screen';
  return sprite;
}

function createCorona(rng: Rng, color: number, sunRadius: number): Container {
  const container = new Container();
  container.blendMode = 'screen';
  const gfx = new Graphics();

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const len = sunRadius * (2.4 + rng() * 3.0);
    const alpha = 0.09 + rng() * 0.18;
    const width = 1.0 + rng() * 2.2;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    gfx.moveTo(dx * sunRadius * 0.9, dy * sunRadius * 0.9)
       .lineTo(dx * len, dy * len)
       .stroke({ color, width, alpha });
  }
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2 + Math.PI / 22;
    const len = sunRadius * (1.1 + rng() * 1.3);
    const alpha = 0.12 + rng() * 0.22;
    const width = 0.6 + rng() * 0.9;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    gfx.moveTo(dx * sunRadius * 0.85, dy * sunRadius * 0.85)
       .lineTo(dx * len, dy * len)
       .stroke({ color: 0xffffff, width, alpha });
  }

  container.addChild(gfx);
  return container;
}

const HOT_ZONE_COLORS      = [0x8B4513, 0xA0522D, 0xD2691E, 0xC2956C, 0xB22222, 0xCC4422];
const HABITABLE_ZONE_COLORS = [0x4682B4, 0x5F9EA0, 0x6B8E23, 0x8FBC8F, 0x87CEEB, 0xC2956C];
const GAS_GIANT_COLORS      = [0xDAA520, 0xCD853F, 0xF4A460, 0xE8C878, 0xC8A060, 0xDDB060];
const ICE_GIANT_COLORS      = [0x4A90C4, 0x5599CC, 0x6699BB, 0x8899BB, 0x9370DB, 0x7B68EE];

const HOT_MOON_COLORS      = [0x5a3a2a, 0x6b4030, 0x7a4a35, 0x4a3020, 0x3d2a1e];
const HABITABLE_MOON_COLORS = [0x8a8f96, 0xa0a8b0, 0x7a8090, 0xb0b8c0, 0x909898, 0xc8c0a8];
const GAS_MOON_COLORS       = [0xc8a050, 0xd4b870, 0x8a9090, 0xe8d8a0, 0xb09060, 0xa09898];
const ICE_MOON_COLORS       = [0xc0d8e8, 0xd0e4f0, 0xa8b8cc, 0xe0ecf4, 0xb0c8d8, 0x9090a8];

const ORBITAL_K = 3500;
const MOON_K = 430;

type ZoneType = 'hot' | 'habitable' | 'gas' | 'ice';

type ZoneConfig = {
  radiusMin: number;
  radiusSpread: number;
  colors: readonly number[];
  moonColors: readonly number[];
  ringThreshold: number;
  moonThreshold: number;
  maxMoons: number;
};

function getPlanetZone(idx: number, total: number): ZoneType {
  const f = idx / total;
  if (f < 0.30) return 'hot';
  if (f < 0.50) return 'habitable';
  if (f < 0.75) return 'gas';
  return 'ice';
}

function getZoneConfig(zone: ZoneType): ZoneConfig {
  switch (zone) {
    case 'hot': return { radiusMin: 10, radiusSpread: 13, colors: HOT_ZONE_COLORS, moonColors: HOT_MOON_COLORS, ringThreshold: 1.1,  moonThreshold: 0.90, maxMoons: 1 };
    case 'habitable': return { radiusMin: 16, radiusSpread: 17, colors: HABITABLE_ZONE_COLORS, moonColors: HABITABLE_MOON_COLORS, ringThreshold: 1.1,  moonThreshold: 0.60, maxMoons: 2 };
    case 'gas': return { radiusMin: 75, radiusSpread: 50, colors: GAS_GIANT_COLORS, moonColors: GAS_MOON_COLORS, ringThreshold: 0.40, moonThreshold: 0.15, maxMoons: 5 };
    case 'ice': return { radiusMin: 28, radiusSpread: 22, colors: ICE_GIANT_COLORS, moonColors: ICE_MOON_COLORS, ringThreshold: 0.62, moonThreshold: 0.28, maxMoons: 3 };
  }
}

export function SolarSystemStage() {
  return (
    <Application resizeTo={window} background={0x050810}>
        <SolarSystem />
    </Application>
  )
}

function SolarSystem() {
  const { app, isInitialised } = useApplication();
  const worldRef = useRef<Container>(null);
  const backgroundStars = useGameStore((s) => s.galaxy.backgroundStars);
  const system = useGameStore((s) => s.system);
  const showOrbitRings = useUIStore((s) => s.showOrbitRings);
  const showOrbitRingsRef = useRef(showOrbitRings);
  showOrbitRingsRef.current = showOrbitRings;
  const orbitGfxRef = useRef<Graphics[]>([]);
  useCamera(worldRef, CAMERA_INITIAL_SCALE - 0.3, undefined, SYSTEM_CAMERA_MIN_SCALE);

  useEffect(() => {
    for (const gfx of orbitGfxRef.current) gfx.visible = showOrbitRings;
  }, [showOrbitRings]);

  useEffect(() => {
    if (!isInitialised || !worldRef.current || !system) return;
    const world = worldRef.current;
    const rng = createRng(system.seed);
    const systemContainer = new Container();
    const systemGfx = new Graphics();
    const planets: PlanetState[] = [];

    const allOrbitGfx: Graphics[] = [systemGfx];
    const planetTextures: Texture[] = [];

    const numRings = Math.floor(rng() * 5) + 3;
    let orbitRadius = 380 + rng() * 120;

    for (let ring = 0; ring < numRings; ring++) {
      const zone = getPlanetZone(ring, numRings);
      const cfg = getZoneConfig(zone);

      const planetRadius = Math.floor(rng() * cfg.radiusSpread) + cfg.radiusMin;
      const color = cfg.colors[Math.floor(rng() * cfg.colors.length)];

      const angle = rng() * Math.PI * 2;
      const speed = ORBITAL_K / Math.pow(orbitRadius, 1.5);

      const planetContainer = new Container();
      planetContainer.x = Math.cos(angle) * orbitRadius;
      planetContainer.y = Math.sin(angle) * orbitRadius;

      const planet: PlanetState = { container: planetContainer, angle, speed, orbitRadius, moons: [] };

      systemGfx.circle(0, 0, orbitRadius);

      const atmosphereGfx = new Graphics();
      atmosphereGfx.circle(0, 0, planetRadius * 1.8).fill({ color, alpha: 0.08 });
      atmosphereGfx.circle(0, 0, planetRadius * 1.3).fill({ color, alpha: 0.14 });
      planetContainer.addChild(atmosphereGfx);

      const hasRings = rng() > cfg.ringThreshold;
      const rings = hasRings ? createPlanetRings(planetRadius * 2.4, planetRadius * 0.5) : null;
      if (rings) planetContainer.addChild(rings.back);

      const hasMoon = rng() > cfg.moonThreshold;
      if (hasMoon) {
        const numMoons = Math.ceil(rng() * cfg.maxMoons);
        for (let moonIdx = 0; moonIdx < numMoons; moonIdx++) {
          const moonDist = planetRadius * 2.5 + Math.floor(rng() * 50) + 45 * (moonIdx + 1);
          const moonAngle = rng() * Math.PI * 2;
          const moonRadius = Math.max(4, Math.floor(planetRadius * Math.abs(rng() - 0.5)));
          const moonSpeed = MOON_K / Math.pow(moonDist, 1.5);

          const moonOrbitGfx = new Graphics();
          moonOrbitGfx.circle(0, 0, moonDist).stroke({ color: 0xffffff, width: 2, alpha: 0.25 });
          allOrbitGfx.push(moonOrbitGfx);
          planetContainer.addChild(moonOrbitGfx);

          const moonColor = cfg.moonColors[Math.floor(rng() * cfg.moonColors.length)];
          const moonGfx = createBodyGfx(moonRadius, moonColor, 0.18);
          moonGfx.x = Math.cos(moonAngle) * moonDist;
          moonGfx.y = Math.sin(moonAngle) * moonDist;
          planetContainer.addChild(moonGfx);

          const moon = { gfx: moonGfx, angle: moonAngle, speed: moonSpeed, dist: moonDist };
          planet.moons.push(moon);
        }
      }

      if (zone === 'gas' || zone === 'ice') {
        const tex = createGasGiantTexture(color, rng, zone === 'ice');
        planetTextures.push(tex);
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.width = planetRadius * 2;
        sprite.height = planetRadius * 2;
        planetContainer.addChild(sprite);
      } else {
        planetContainer.addChild(createBodyGfx(planetRadius, color, 0.22));
      }
      if (rings) planetContainer.addChild(rings.front);
      systemContainer.addChild(planetContainer);
      planets.push(planet);

      orbitRadius *= 1.55 + rng() * 0.65;
    }
    systemGfx.stroke({ color: 0xffffff, width: 5, alpha: 0.25 });

    for (const gfx of allOrbitGfx) gfx.visible = showOrbitRingsRef.current;
    orbitGfxRef.current = allOrbitGfx;

    const asteroidBelt = createAsteroidBelt(rng, planets);

    const sunRadius = system.size * 120;
    const sunTexture = createSunTexture(system.color);
    const sunSprite = new Sprite(sunTexture);
    sunSprite.anchor.set(0.5);
    sunSprite.width = sunRadius * 4;
    sunSprite.height = sunRadius * 4;
    const sunBaseScale = sunSprite.scale.x;

    const nebulaSprite = createNebulaSprite(system.color, sunRadius);
    const nebulaTexture = nebulaSprite.texture;
    const coronaContainer = createCorona(rng, system.color, sunRadius);

    systemContainer.addChildAt(nebulaSprite, 0);
    systemContainer.addChildAt(systemGfx, 1);
    if (asteroidBelt) systemContainer.addChildAt(asteroidBelt, 2);
    systemContainer.addChild(coronaContainer);
    systemContainer.addChild(sunSprite);
    world.addChildAt(systemContainer, 0);

    let elapsed = 0;
    function onTick(ticker: Ticker) {
      const dt = ticker.deltaMS / 1000;
      elapsed += dt;
      sunSprite.scale.set(sunBaseScale * (1 + Math.sin(elapsed * 0.9) * 0.07));
      coronaContainer.rotation += 0.018 * dt;
      coronaContainer.alpha = 0.8 + 0.2 * Math.sin(elapsed * 0.55);
      nebulaSprite.alpha = 0.65 + 0.15 * Math.sin(elapsed * 0.22);
      if (asteroidBelt) asteroidBelt.rotation += 0.025 * dt;
      for (const p of planets) {
        p.angle += p.speed * dt;
        p.container.x = Math.cos(p.angle) * p.orbitRadius;
        p.container.y = Math.sin(p.angle) * p.orbitRadius;
        if (!p.moons) continue;
        for (const moon of p.moons) {
          moon.angle += moon.speed * dt;
          moon.gfx.x = Math.cos(moon.angle) * moon.dist;
          moon.gfx.y = Math.sin(moon.angle) * moon.dist;
        }
      }
    }
    Ticker.shared.add(onTick);

    return () => {
      orbitGfxRef.current = [];
      Ticker.shared.remove(onTick);
      world.removeChild(systemContainer);
      systemContainer.destroy({ children: true });
      sunTexture.destroy(true);
      nebulaTexture.destroy(true);
      for (const tex of planetTextures) tex.destroy(true);
    }
  }, [system, app, isInitialised])
  return (
    <>
      <BackgroundStars stars={backgroundStars} />
      <pixiContainer ref={worldRef} />
    </>
  )
}