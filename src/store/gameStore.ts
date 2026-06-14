import { create } from 'zustand';
import type { Galaxy } from '../game/types';
import { generateGalaxy } from '../game/galaxyGen';

interface GameState {
  galaxy: Galaxy;
}

export const useGameStore = create<GameState>(() => ({
  galaxy: generateGalaxy(),
}));
