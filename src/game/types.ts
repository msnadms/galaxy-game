import type { GalaxyConfig } from "./galaxyConfig";

export type StarType = 'G' | 'K' | 'M' | 'F' | 'A';

export interface StarSystem {
  id: number;
  x: number;
  y: number;
  name: string;
  starType: StarType;
  color: number;
  size: number;
  arm: number | null;
}

export interface Hyperlane {
  from: number;
  to: number;
}

export interface BackgroundStar {
  x: number;
  y: number;
  brightness: number;
}

export type Rng = () => number;

export interface Galaxy {
  systems: StarSystem[];
  hyperlanes: Hyperlane[];
  backgroundStars: BackgroundStar[];
  config: GalaxyConfig;
  seed: number;
}
