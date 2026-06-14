import { GalaxyStage } from './pixi/GalaxyStage';
import { ConfigPanel } from './ui/ConfigPanel';
import { useUIStore } from './store/uiStore';
import { useGameStore } from './store/gameStore';
import './App.css';

const STAR_TYPE_LABELS: Record<string, string> = {
  G: 'G-class (Yellow Dwarf)',
  K: 'K-class (Orange Dwarf)',
  M: 'M-class (Red Dwarf)',
  F: 'F-class (Yellow-White)',
  A: 'A-class (White)',
};

export default function App() {
  const selectedId = useUIStore((s) => s.selectedSystemId);
  const galaxy = useGameStore((s) => s.galaxy);
  const system = selectedId !== null ? galaxy.systems[selectedId] : null;

  return (
    <div className="app">
      <GalaxyStage />
      <ConfigPanel />
      {system && (
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
