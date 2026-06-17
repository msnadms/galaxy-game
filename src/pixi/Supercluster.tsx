import { Application, useApplication } from '@pixi/react';
import { Container, Graphics, Ticker, BlurFilter } from 'pixi.js';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { buildAddressComponent, type SuperclusterDot } from '../game/types';
import { useCamera } from './useCamera';
import { createDisplacementSetup } from './textures';
import { SC_CAMERA_INITIAL_SCALE, SC_WORLD_HALF, SC_WORLD_HALF_MLY, SC_ATTRACTOR_LABEL_MAX_DIST } from '../game/constants';
import { ScaleBar } from './ScaleBar';
import { createRng } from '../game/galaxyGen';
import { createPointerLabel } from './labels';

const BRIGHTNESS_TIERS = [
  { min: 0.80, radius: 3.5, color: 0xffee00, alpha: 1.00 },
  { min: 0.60, radius: 2.8, color: 0xff8800, alpha: 0.96 },
  { min: 0.40, radius: 2.3, color: 0xff0088, alpha: 0.88 },
  { min: 0.20, radius: 1.8, color: 0xaa00ff, alpha: 0.75 },
  { min: -Infinity, radius: 1.4, color: 0x6600cc, alpha: 0.55 },
];

export function Supercluster() {
  return (
    <Application resizeTo={window} background={0x050810} antialias>
      <SuperclusterWorld />
    </Application>
  );
}

function SuperclusterWorld() {
  const { app, isInitialised } = useApplication();

  const scData = useGameStore((s) => s.supercluster);
  const regenerateGalaxy = useGameStore((s) => s.regenerateGalaxy);
  const setView = useUIStore((s) => s.setView);
  const pushAddress = useUIStore((s) => s.pushAddress);
  const removeAddressType = useUIStore((s) => s.removeAddressType);
  const showAttractorLabels = useUIStore((s) => s.showAttractorLabels);

  const worldRef = useRef<Container>(null);
  const { camera, isReady } = useCamera(worldRef, SC_CAMERA_INITIAL_SCALE);

  useEffect(() => {
    if (!isInitialised || !worldRef.current) return;
    const world = worldRef.current;
    const stage = app.stage;
    const renderer = app.renderer;
    const rng = createRng(scData.seed);
    const [x, y, z] = [rng() * 1_000_000_000, rng() * 1_000_000_000, rng() * 1_000_000_000];
    pushAddress(buildAddressComponent(scData.name, x, y, z, 'supercluster'))

    // Background starfield (fixed to screen, not panning with world)
    const dimGfx = new Graphics();
    const brightGfx = new Graphics();

    for (const star of scData.backgroundStars) {
      if (star.brightness <= 0.7) dimGfx.circle(star.x, star.y, 0.6);
      else brightGfx.circle(star.x, star.y, 1.0);
    }
    dimGfx.fill({ color: 0xffffff });
    brightGfx.fill({ color: 0xffffff });

    const bgContainer = new Container();
    bgContainer.position.set(app.screen.width / 2, app.screen.height / 2);
    bgContainer.addChild(dimGfx);
    bgContainer.addChild(brightGfx);
    stage.addChildAt(bgContainer, 0);

    const onResize = () => bgContainer.position.set(app.screen.width / 2, app.screen.height / 2);
    renderer.on('resize', onResize);

    const buckets: SuperclusterDot[][] = BRIGHTNESS_TIERS.map(() => []);
    const visitedDots: SuperclusterDot[] = [];
    for (const dot of scData.dots) {
      buckets[BRIGHTNESS_TIERS.findIndex(t => dot.brightness > t.min)].push(dot);
      if (dot.visited) visitedDots.push(dot);
    }
    
    const scContainer = new Container();
    const dotGfx = new Graphics();
    for (let i = 0; i < BRIGHTNESS_TIERS.length; i++) {
      for (const d of buckets[i]) dotGfx.circle(d.x, d.y, BRIGHTNESS_TIERS[i].radius);
      dotGfx.fill({ color: BRIGHTNESS_TIERS[i].color, alpha: BRIGHTNESS_TIERS[i].alpha });
    }

    const blurFilter = new BlurFilter({ strength: 0.05 });
    dotGfx.filters = [blurFilter];
    dotGfx.blendMode = 'screen';

    const visitedGfx = new Graphics();
    for (const d of visitedDots) visitedGfx.circle(d.x, d.y, 8);
    visitedGfx.stroke({ color: 0xffffff, width: 1.5, alpha: 0.75 });
    for (const d of visitedDots) visitedGfx.circle(d.x, d.y, 11);
    visitedGfx.stroke({ color: 0xffffff, width: 0.5, alpha: 0.25 });

    const disp = createDisplacementSetup(scContainer, 8);

    scContainer.addChild(dotGfx);
    scContainer.addChild(visitedGfx);

    world.addChild(scContainer);

    // Starfield pulse animation
    let elapsedSecs = 0;
    const tick = (ticker: Ticker) => {
      elapsedSecs += ticker.deltaMS / 1000;
      dimGfx.alpha = 0.25 + Math.abs(Math.sin(elapsedSecs * 1.5)) * 0.55;
      brightGfx.alpha = 0.5 + Math.abs(Math.sin(elapsedSecs * 2.0 + 1.0)) * 0.5;
      disp.update(elapsedSecs, Math.max(camera.current.scale * 10 - 5, 0));
    };
    Ticker.shared.add(tick);

    return () => {
      Ticker.shared.remove(tick);
      renderer.off('resize', onResize);
      world.removeChild(scContainer);
      stage.removeChild(bgContainer);
      scContainer.destroy({ children: true });
      blurFilter.destroy();
      disp.destroy();
      bgContainer.destroy({ children: true });
    };
  }, [scData, app, isInitialised]);

  useEffect(() => {
    if (!isInitialised || !worldRef.current) return;
    const world = worldRef.current;

    const titleGroup = createPointerLabel(scData.name, 90, {
      lineLength: 1600,
      dotRadius: 8,
      alpha: 0.8,
    });
    titleGroup.position.set(0, 0);
    world.addChild(titleGroup);

    const labelContainer = new Container();
    for (const att of scData.attractors) {
      const group = createPointerLabel(att.name, 40, { lineLength: 120 });
      group.position.set(att.x, att.y);
      labelContainer.addChild(group);
    }
    world.addChild(labelContainer);

    const tick = () => { labelContainer.visible = showAttractorLabels && camera.current.scale > 0.25; };
    Ticker.shared.add(tick);

    return () => {
      Ticker.shared.remove(tick);
      world.removeChild(titleGroup);
      world.removeChild(labelContainer);
      titleGroup.destroy({ children: true });
      labelContainer.destroy({ children: true });
    };
  }, [scData, isInitialised, showAttractorLabels]);


  useEffect(() => {
    if (!isInitialised || !worldRef.current) return;
    const world = worldRef.current;
    const stage = app.stage;

    const onTap = (e: { global: { x: number; y: number } }) => {
      if (camera.current.scale < 0.5) return;
      const local = world.toLocal(e.global);
      let nearest = scData.dots[0];
      let nearestDist = Infinity;
      for (const dot of scData.dots) {
        const d = Math.hypot(dot.x - local.x, dot.y - local.y);
        if (d < nearestDist) { nearestDist = d; nearest = dot; }
      }
      const maxDist = 15 / camera.current.scale;
      if (nearestDist > maxDist) return;
      nearest.visited = true;
      regenerateGalaxy(nearest.seed);

      let nearestAttractorDist = Infinity;
      let nearestAttractor = scData.attractors[0];
      for (const att of scData.attractors) {
        const d = Math.hypot(nearest.x - att.x, nearest.y - att.y);
        if (d < nearestAttractorDist) { nearestAttractorDist = d; nearestAttractor = att; }
      }
      if (nearestAttractorDist <= SC_ATTRACTOR_LABEL_MAX_DIST) {
        pushAddress(buildAddressComponent(nearestAttractor.name, nearestAttractor.x, nearestAttractor.y, nearestAttractor.z, 'attractor'));
      } else {
        removeAddressType('attractor');
      }

      pushAddress(buildAddressComponent(nearest.name, nearest.x, nearest.y, nearest.z, 'galaxy'));
      setView('galaxy');
    };

    stage.on('pointertap', onTap);
    return () => { stage.off('pointertap', onTap); };
  }, [scData, app, isInitialised, regenerateGalaxy, setView, pushAddress, removeAddressType]);

  return (
    <>
      <pixiContainer ref={worldRef} visible={isReady} />
      <ScaleBar
        camera={camera}
        unitsPerWorldPx={SC_WORLD_HALF_MLY / SC_WORLD_HALF}
        unit="Million Light Years"
        niceValues={[5, 10, 25, 50, 100, 150, 200, 300, 500]}
      />
    </>
  );
}
