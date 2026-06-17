import { GalaxyStage } from './pixi/GalaxyStage';
import { Supercluster } from './pixi/Supercluster';
import { ConfigPanel } from './ui/ConfigPanel';
import { useUIStore } from './store/uiStore';
import { useGameStore } from './store/gameStore';
import { generateGalaxyName } from './game/superclusters';
import type { StarType } from './game/types';
import './App.css';
import { Address } from './ui/Address';

const STAR_TYPE_LABELS: Record<StarType, string> = {
  G: 'G-class (Yellow Dwarf)',
  K: 'K-class (Orange Dwarf)',
  M: 'M-class (Red Dwarf)',
  F: 'F-class (Yellow-White)',
  A: 'A-class (White)',
};

export default function App() {
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const selectedId = useUIStore((s) => s.selectedSystemId);
  const selectSystem = useUIStore((s) => s.selectSystem);
  const popAddress = useUIStore((s) => s.popAddress);
  const galaxySeed = useGameStore((s) => s.galaxy.seed);
  const galaxy = useGameStore((s) => s.galaxy);
  const system = selectedId !== null ? galaxy.systems[selectedId] : null;

  return (
    <div className="app">
      {view === 'galaxy' ? <GalaxyStage /> : <Supercluster />}
      <div className="top-left">
        {view === 'galaxy' && (
          <button className="back-btn" onClick={() => { if (selectedId !== null) { popAddress(); selectSystem(null); } popAddress(); setView('supercluster'); }}>
            ← Supercluster
          </button>
        )}
        <ConfigPanel />
      </div>
      <Address />
      {view === 'galaxy' && (
        <div className="galaxy-title">{generateGalaxyName(galaxySeed)}</div>
      )}
      {view === 'galaxy' && system && (
        <div className="system-panel">
          <div className="system-panel-name">{system.name}</div>
          <div className="system-panel-type">{STAR_TYPE_LABELS[system.starType]}</div>
          <div className="system-panel-coords">
            {Math.round(system.x)}, {Math.round(system.y)}
          </div>
        </div>
      )}
    </div>
  );
}
