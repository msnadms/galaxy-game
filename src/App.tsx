import { memo, useCallback, useEffect, useState } from 'react';
import { PixiApp } from './pixi/PixiApp';
import { ConfigPanel } from './ui/ConfigPanel';
import { useUIStore } from './store/uiStore';
import { useGameStore } from './store/gameStore';
import { generateGalaxyName } from './game/superclusters';
import './App.css';
import { AuthButton } from './ui/AuthButton';
import { ShipHUD } from './ui/ShipHUD';
import { PlanetPanel } from './ui/PlanetPanel';
import { useSettingsPersist } from './hooks/useSettingsPersist';
import { useQuestPersist } from './hooks/useQuestPersist';
import { initAuth, useAuthStore } from './store/authStore';
import { InfoPanel } from './ui/InfoPanel';
import { BootSequence } from './ui/BootSequence';
import { LoginScreen } from './ui/LoginScreen';

const COORD_TYPES = new Set(['supercluster', 'galaxy', 'system']);

const GalaxyTitle = memo(function GalaxyTitle() {
  const galaxySeed = useGameStore((s) => s.galaxy.seed);
  return <div className="galaxy-title">{generateGalaxyName(galaxySeed)}</div>;
});

function AddressBar() {
  const address = useUIStore((s) => s.address);
  const coords = address
    .filter((s) => COORD_TYPES.has(s.type))
    .map((s) => { const z = Math.round(s.z); return `${Math.round(s.x)}.${Math.round(s.y)}${z !== 0 ? `.${z}` : ''}`; })
    .join(':');
  return (
    <div className="hud-address-bar">
      <div className="hud-address-breadcrumb">
        {address.map((segment, i) => (
          <span key={i}>
            {i > 0 && <span className="hud-address-sep">›</span>}
            <span className={`hud-address-seg${i === address.length - 1 ? ' hud-address-seg--current' : ''}`}>
              {segment.name}
            </span>
          </span>
        ))}
      </div>
      {coords && <div className="hud-address-coords">{coords}</div>}
    </div>
  );
}

export default function App() {
  useSettingsPersist();
  useQuestPersist();
  useEffect(() => initAuth(), []);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const view = useUIStore((s) => s.view);
  const showHUD = useUIStore((s) => s.showHUD);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showBoot] = useState(true);
  const [isFirstVisit] = useState(() => {
    const firstTime = !localStorage.getItem('galaxy-game-booted');
    if (firstTime) localStorage.setItem('galaxy-game-booted', '1');
    return firstTime;
  });
  const [infoPanelOpenReq, setInfoPanelOpenReq] = useState(0);

  const handleBootComplete = useCallback(() => {
    if (isFirstVisit) setInfoPanelOpenReq(r => r + 1);
  }, [isFirstVisit]);

  if (authLoading || !user) return <LoginScreen />;

  return (
    <div className="app">
      <PixiApp />
      {showBoot && <BootSequence onComplete={handleBootComplete} isFirstVisit={isFirstVisit} />}
      <InfoPanel onOpenChange={setInfoOpen} openRequest={infoPanelOpenReq} />
      <div className="top-left">
        <ConfigPanel hidden={infoOpen} />
      </div>
      <div className="top-right">
        <AuthButton />
      </div>
      {showHUD && (
        <div className="hud-wrap">
          <ShipHUD />
        </div>
      )}
      {showHUD && <AddressBar />}
      {view === 'galaxy' && <GalaxyTitle />}
      {view === 'system' && <PlanetPanel />}
    </div>
  );
}
