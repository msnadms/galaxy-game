import { create } from 'zustand';
import type { Galaxy } from '../game/types';
import { generateGalaxy } from '../game/galaxyGen';

interface GameState {
  galaxy: Galaxy;
  regenerate: (seed?: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  galaxy: generateGalaxy(),
  regenerate: (seed) => set({ galaxy: generateGalaxy(seed) }),
}));
