import { create } from 'zustand';
import type { AddressComponent } from '../game/types';

export type AppView = 'galaxy' | 'supercluster';

interface UIState {
  selectedSystemId: number | null;
  selectSystem: (id: number | null) => void;
  showHyperlanes: boolean;
  toggleHyperlanes: () => void;
  view: AppView;
  setView: (view: AppView) => void;
  address: AddressComponent[];
  pushAddress: (segment: AddressComponent) => void;
  popAddress: () => void;
}

const obsUniverse: AddressComponent = {
  name: 'Observable Universe',
  x: 0,
  y: 0,
  type: 'universe'
}

function upsertAddress(address: AddressComponent[], component: AddressComponent) {
  if (address.some((a) => a.type === component.type))
    return address.map((a) => (a.type === component.type ? component : a));
  return [...address, component];
}

export const useUIStore = create<UIState>((set) => ({
  selectedSystemId: null,
  selectSystem: (id) => set({ selectedSystemId: id }),
  showHyperlanes: true,
  toggleHyperlanes: () => set((s) => ({ showHyperlanes: !s.showHyperlanes })),
  view: 'supercluster',
  setView: (view) => set({ view }),
  address: [obsUniverse],
  pushAddress: (segment) => set((s) => ({ address: upsertAddress(s.address, segment) })),
  popAddress: () => set((s) => ({ address: s.address.slice(0, -1) })),
}));
