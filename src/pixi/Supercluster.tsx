import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics, Ticker, BlurFilter, Text } from 'pixi.js';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import type { SuperclusterDot } from '../game/types';
import { useCamera } from './useCamera';
import { createDisplacementSetup } from './textures';
import { SC_CAMERA_INITIAL_SCALE } from '../game/constants';

extend({ Container, Graphics });

const BRIGHTNESS_TIERS = [
  { min: 0.80, radius: 3.5, color: 0xffee00, alpha: 1.00 },
  { min: 0.60, radius: 2.8, color: 0xff8800, alpha: 0.96 },
  { min: 0.40, radius: 2.3, color: 0xff0088, alpha: 0.88 },
  { min: 0.20, radius: 1.8, color: 0xaa00ff, alpha: 0.75 },
  { min: -Infinity, radius: 1.4, color: 0x6600cc, alpha: 0.55 },
];

export function Supercluster() {
  return (
    <Application resizeTo={window} background={0x050810}>
      <SuperclusterWorld />
    </Application>
  );
}

function SuperclusterWorld() {
  const { app, isInitialised } = useApplication();

  const scData = useGameStore((s) => s.supercluster);
  const regenerateGalaxy = useGameStore((s) => s.regenerateGalaxy);
  const setView = useUIStore((s) => s.setView);

  const worldRef = useRef<Container>(null);
  const { camera, isReady } = useCamera(worldRef, SC_CAMERA_INITIAL_SCALE);

  useEffect(() => {
    if (!isInitialised || !worldRef.current) return;
    const world = worldRef.current;
    const stage = app.stage;
    const renderer = app.renderer;

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

    const blurFilter = new BlurFilter({ strength: 0.25 });
    dotGfx.filters = [blurFilter];
    dotGfx.blendMode = 'screen';

    const visitedGfx = new Graphics();
    for (const d of visitedDots) visitedGfx.circle(d.x, d.y, 8);
    visitedGfx.stroke({ color: 0xffffff, width: 1.5, alpha: 0.75 });
    for (const d of visitedDots) visitedGfx.circle(d.x, d.y, 11);
    visitedGfx.stroke({ color: 0xffffff, width: 0.5, alpha: 0.25 });

    const disp = createDisplacementSetup(scContainer, 5);

    scContainer.addChild(dotGfx);
    scContainer.addChild(visitedGfx);

    world.addChild(scContainer);

    // Starfield pulse animation
    let elapsedSecs = 0;
    const tick = (ticker: Ticker) => {
      elapsedSecs += ticker.deltaMS / 1000;
      dimGfx.alpha = 0.25 + Math.abs(Math.sin(elapsedSecs * 1.5)) * 0.55;
      brightGfx.alpha = 0.5 + Math.abs(Math.sin(elapsedSecs * 2.0 + 1.0)) * 0.5;
      disp.update(elapsedSecs, 1.5 / camera.current.scale);
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

    const titleLabel = new Text({
      text: scData.name,
      style: { fontFamily: 'sans-serif', fontSize: 90, fill: 0xddeeff, align: 'center' },
    });
    titleLabel.anchor.set(0.5, 1.0);
    titleLabel.position.set(0, -1400);
    world.addChild(titleLabel);

    const labelContainer = new Container();
    for (const att of scData.attractors) {
      const label = new Text({
        text: att.name,
        style: { fontFamily: 'sans-serif', fontSize: 40, fill: 0xaabbff, align: 'center' },
      });
      label.anchor.set(0.5, 1.0);
      label.position.set(att.x, att.y - 150);
      labelContainer.addChild(label);
    }
    world.addChild(labelContainer);

    const tick = () => { labelContainer.visible = camera.current.scale > 0.5; };
    Ticker.shared.add(tick);

    return () => {
      Ticker.shared.remove(tick);
      world.removeChild(titleLabel);
      world.removeChild(labelContainer);
      titleLabel.destroy();
      labelContainer.destroy({ children: true });
    };
  }, [scData, isInitialised]);

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
      setView('galaxy');
    };

    stage.on('pointertap', onTap);
    return () => { stage.off('pointertap', onTap); };
  }, [scData, app, isInitialised, regenerateGalaxy, setView]);

  return <pixiContainer ref={worldRef} visible={isReady} />;
}
