import { create } from 'zustand';
import type { Galaxy, StarSystem, SuperclusterData } from '../game/types';
import { generateGalaxy } from '../game/galaxyGen';
import { generateSupercluster } from '../game/superclusters';

interface GameState {
  galaxy: Galaxy;
  supercluster: SuperclusterData;
  system: StarSystem | null;
  visitedSystemsByGalaxySeed: Record<number, number[]>;
  regenerateGalaxy: (seed?: number) => void;
  regenerateSupercluster: (seed?: number) => void;
  setSystem: (system: StarSystem | null) => void;
  markDotVisited: (seed: number) => void;
  markSystemVisited: (id: number) => void;
}

function applyVisited(galaxy: Galaxy, visited: number[] | undefined): Galaxy {
  if (!visited || visited.length === 0) return galaxy;
  const visitedSet = new Set(visited);
  return {
    ...galaxy,
    systems: galaxy.systems.map((s) => visitedSet.has(s.id) ? { ...s, visited: true } : s),
  };
}

export const useGameStore = create<GameState>((set) => ({
  galaxy: generateGalaxy(),
  supercluster: generateSupercluster(),
  system: null,
  visitedSystemsByGalaxySeed: {},
  regenerateGalaxy: (seed) => set((state) => {
    const galaxy = generateGalaxy(seed);
    return {
      galaxy: applyVisited(galaxy, state.visitedSystemsByGalaxySeed[galaxy.seed]),
      system: null,
    };
  }),
  regenerateSupercluster: (seed) => set({ supercluster: generateSupercluster(seed), visitedSystemsByGalaxySeed: {} }),
  setSystem: (system) => set({ system }),
  markDotVisited: (seed) => set((state) => ({
    supercluster: {
      ...state.supercluster,
      dots: state.supercluster.dots.map((d) => d.seed === seed ? { ...d, visited: true } : d),
    },
  })),
  markSystemVisited: (id) => set((state) => {
    const galaxySeed = state.galaxy.seed;
    const existing = state.visitedSystemsByGalaxySeed[galaxySeed] ?? [];
    const alreadyVisited = existing.includes(id);
    return {
      galaxy: {
        ...state.galaxy,
        systems: state.galaxy.systems.map((s) => s.id === id ? { ...s, visited: true } : s),
      },
      visitedSystemsByGalaxySeed: alreadyVisited ? state.visitedSystemsByGalaxySeed : {
        ...state.visitedSystemsByGalaxySeed,
        [galaxySeed]: [...existing, id],
      },
    };
  }),
}));
