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

export interface SuperclusterAttractor {
  x: number;
  y: number;
  strength: number;
  name: string;
}

export interface SuperclusterFilament {
  from: number;
  to: number;
}

export interface SuperclusterDot {
  x: number;
  y: number;
  brightness: number;
  seed: number;
  name: string;
  visited: boolean;
}

export interface SuperclusterData {
  name: string;
  attractors: SuperclusterAttractor[];
  filaments: SuperclusterFilament[];
  dots: SuperclusterDot[];
  backgroundStars: BackgroundStar[];
  seed: number;
}

type AddressComponentType = 'universe' | 'supercluster' | 'galaxy' | 'system'

export interface AddressComponent {
  name: string;
  x: number;
  y: number;
  type: AddressComponentType
}

export function buildAddressComponent(name: string, x: number, y: number, type: AddressComponentType) {
  return { name, x, y, type } as AddressComponent
}
