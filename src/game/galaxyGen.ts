import { Delaunay } from 'd3-delaunay';
import type { Galaxy, StarSystem, Hyperlane, StarType, BackgroundStar } from './types';
import {
  GALAXY_RADIUS,
  N_ARMS,
  GALAXY_ELLIPSE,
  SPIRAL_TWIST,
  BULGE_FRACTION,
  BULGE_RADIUS_FRACTION,
  BULGE_ELLIPSE,
  ARM_T_POWER,
  ARM_INNER_FRACTION,
  ARM_SPREAD,
  ARM_SPREAD_BASE,
  MAX_LANE_DIST,
  BACKGROUND_STAR_COUNT,
  BACKGROUND_STAR_AREA_X,
  BACKGROUND_STAR_AREA_Y,
  STAR_SIZE_MULTIPLIER,
  NUM_STARS,
} from './constants';

type Rng = () => number;

// Fast seedable PRNG (mulberry32). Returns a function that produces [0, 1) floats.
function mulberry32(seed: number): Rng {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let hash = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    hash = (hash + Math.imul(hash ^ (hash >>> 7), 61 | hash)) ^ hash;
    return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_COLORS: Record<StarType, number> = {
  G: 0xffe27a,
  K: 0xffaa55,
  M: 0xff7070,
  F: 0xfff5dd,
  A: 0xc8e0ff,
};

const STAR_SIZES: Record<StarType, [number, number]> = {
  G: [2.5, 4.0],
  K: [3.0, 4.5],
  M: [2.0, 3.5],
  F: [2.8, 4.0],
  A: [3.2, 4.8],
};

const STAR_TYPE_DIST: [StarType, number][] = [
  ['M', 0.45],
  ['K', 0.25],
  ['G', 0.15],
  ['F', 0.10],
  ['A', 0.05],
];

function pickStarType(rng: Rng): StarType {
  const roll = rng();
  let cumulative = 0;
  for (const [type, weight] of STAR_TYPE_DIST) {
    cumulative += weight;
    if (roll < cumulative) return type;
  }
  return 'M';
}

const PREFIXES = ['Ker', 'Sol', 'Vel', 'Tor', 'Ax', 'Cet', 'Dra', 'El', 'For', 'Gav', 'Hel', 'Ix', 'Jen', 'Kor', 'Lys', 'Mal', 'Nyx', 'Ora'];
const SUFFIXES = [' Prime', ' Major', ' Minor', ' Alpha', ' Beta', ' Centauri', '', '', ''];

function makeName(rng: Rng): string {
  const prefix1 = PREFIXES[Math.floor(rng() * PREFIXES.length)];
  const prefix2 = PREFIXES[Math.floor(rng() * PREFIXES.length)];
  const suffix  = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  return `${prefix1}${prefix2.toLowerCase()}${suffix}`;
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function canConnect(armA: number | null, armB: number | null): boolean {
  if (armA === null || armB === null) return true;
  return armA === armB;
}

// Union-find post-pass: adds the minimum set of cross-arm edges needed to
// guarantee the hyperlane graph is fully connected.
function bridgeComponents(
  hyperlanes: Hyperlane[],
  positions: [number, number][],
): Hyperlane[] {
  const parent = Array.from({ length: NUM_STARS }, (_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function union(a: number, b: number): void {
    const rootA = find(a), rootB = find(b);
    if (rootA !== rootB) parent[rootA] = rootB;
  }

  for (const { from, to } of hyperlanes) union(from, to);

  const bridges: Hyperlane[] = [];
  for (let i = 0; i < NUM_STARS; i++) {
    if (find(i) === find(0)) continue;
    let nearestDist = Infinity, nearestNode = -1;
    for (let j = 0; j < NUM_STARS; j++) {
      if (find(j) !== find(0)) continue;
      const deltaX = positions[i][0] - positions[j][0];
      const deltaY = positions[i][1] - positions[j][1];
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < nearestDist) { nearestDist = distance; nearestNode = j; }
    }
    if (nearestNode !== -1) {
      bridges.push({ from: i, to: nearestNode });
      union(i, nearestNode);
    }
  }

  return bridges;
}

export function generateGalaxy(seed = Date.now()): Galaxy {
  const rng = mulberry32(seed);
  const positions: [number, number][] = [];
  const armIndices: (number | null)[] = [];

  for (let i = 0; i < NUM_STARS; i++) {
    let x: number, y: number;

    if (rng() < BULGE_FRACTION) {
      const radius = Math.pow(rng(), 0.5) * GALAXY_RADIUS * BULGE_RADIUS_FRACTION;
      const angle = rng() * Math.PI * 2;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius * BULGE_ELLIPSE;
      armIndices.push(null);
    } else {
      const arm         = Math.floor(rng() * N_ARMS);
      const armFraction = Math.pow(rng(), ARM_T_POWER);
      const radius      = lerp(GALAXY_RADIUS * ARM_INNER_FRACTION, GALAXY_RADIUS, armFraction);
      const baseAngle   = (arm / N_ARMS) * Math.PI * 2;
      const spiralAngle = baseAngle + armFraction * Math.PI * SPIRAL_TWIST;
      const spread      = GALAXY_RADIUS * ARM_SPREAD * (ARM_SPREAD_BASE + armFraction);

      x = Math.cos(spiralAngle) * radius + (rng() - 0.5) * 2 * spread;
      y = Math.sin(spiralAngle) * radius * GALAXY_ELLIPSE + (rng() - 0.5) * 2 * spread;

      armIndices.push(arm);
    }

    positions.push([x, y]);
  }

  const systems: StarSystem[] = positions.map(([x, y], id) => {
    const starType = pickStarType(rng);
    const [minSize, maxSize] = STAR_SIZES[starType];
    return {
      id,
      x,
      y,
      name: makeName(rng),
      starType,
      color: STAR_COLORS[starType],
      size: lerp(minSize * STAR_SIZE_MULTIPLIER, maxSize * STAR_SIZE_MULTIPLIER, rng()),
      arm: armIndices[id],
    };
  });

  const delaunay = Delaunay.from(positions);
  const hyperlanes: Hyperlane[] = [];
  const visitedEdges = new Set<string>();
  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    const triangle = [delaunay.triangles[i], delaunay.triangles[i + 1], delaunay.triangles[i + 2]];
    const edges: [number, number][] = [[triangle[0], triangle[1]], [triangle[1], triangle[2]], [triangle[0], triangle[2]]];

    for (const [nodeA, nodeB] of edges) {
      const edgeKey = `${Math.min(nodeA, nodeB)}-${Math.max(nodeA, nodeB)}`;
      if (visitedEdges.has(edgeKey)) continue;
      visitedEdges.add(edgeKey);

      if (!canConnect(armIndices[nodeA], armIndices[nodeB])) continue;
      const deltaX = positions[nodeA][0] - positions[nodeB][0];
      const deltaY = positions[nodeA][1] - positions[nodeB][1];

      if (Math.hypot(deltaX, deltaY) < MAX_LANE_DIST) {
        hyperlanes.push({ from: nodeA, to: nodeB });
      }
    }
  }

  const bridges = bridgeComponents(hyperlanes, positions);
  hyperlanes.push(...bridges);

  const backgroundStars: BackgroundStar[] = Array.from({ length: BACKGROUND_STAR_COUNT }, () => ({
    x: (rng() - 0.5) * BACKGROUND_STAR_AREA_X,
    y: (rng() - 0.5) * BACKGROUND_STAR_AREA_Y,
    brightness: rng(),
  }));

  return { systems, hyperlanes, backgroundStars, seed };
}
