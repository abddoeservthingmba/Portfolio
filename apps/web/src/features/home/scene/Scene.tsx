import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createScene, TRAVEL_DEPTH, type SceneParts } from './createScene';

/**
 * The WebGL layer. The only component in the app that touches three.js, and it
 * is reached exclusively through SceneLayer's lazy import — so this file, and
 * the ~200KB library behind it, are absent from the main bundle.
 *
 * Responsibilities kept to three: own the canvas, run one animation frame loop,
 * clean up after itself. Everything about *what* the scene contains lives in
 * createScene.ts.
 */

/** How far the camera leans toward the pointer. Small — this is a hint, not a ride. */
const POINTER_LEAN = 1.4;

/** Seconds-ish smoothing factor for camera easing. Lower is heavier. */
const EASE = 0.055;

export default function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      // Context creation can still fail after the capability check passes —
      // a GPU blocklist, or too many live contexts. The page is unaffected.
      return;
    }

    // Capped at 2: beyond that the pixel count doubles again for a background
    // nobody is inspecting closely.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    let parts: SceneParts = createScene(window.innerWidth, window.innerHeight);

    // Targets are what input writes to; the rendered values chase them, which is
    // what turns a jumpy scroll position into a glide.
    const target = { scroll: 0, pointerX: 0, pointerY: 0 };
    const current = { scroll: 0, pointerX: 0, pointerY: 0 };

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target.scroll = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      target.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      target.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      parts.camera.aspect = window.innerWidth / window.innerHeight;
      parts.camera.updateProjectionMatrix();
      readScroll();
    };

    /**
     * Rebuilds the scene when the theme changes, so the shapes recolour with
     * the page. Cheap enough to do wholesale — it happens on a click, not on a
     * frame — and far simpler than mutating 34 materials in place.
     */
    const onThemeChange = () => {
      parts.dispose();
      parts = createScene(window.innerWidth, window.innerHeight);
      parts.camera.aspect = window.innerWidth / window.innerHeight;
      parts.camera.updateProjectionMatrix();
    };

    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    readScroll();

    // Passive: none of these ever preventDefault, and saying so keeps scrolling
    // off the main thread's critical path.
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let frame = 0;
    const clock = new THREE.Clock();

    // Pauses entirely when the tab is hidden. A background tab spinning a
    // render loop is the classic way a portfolio drains someone's battery.
    let visible = !document.hidden;
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) clock.getDelta(); // Discard the gap, or everything lurches.
    };
    document.addEventListener('visibilitychange', onVisibility);

    const render = () => {
      frame = requestAnimationFrame(render);
      if (!visible) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      current.scroll += (target.scroll - current.scroll) * EASE;
      current.pointerX += (target.pointerX - current.pointerX) * EASE;
      current.pointerY += (target.pointerY - current.pointerY) * EASE;

      // The journey: scrolling the page flies the camera through the field.
      parts.camera.position.z = 12 - current.scroll * TRAVEL_DEPTH;
      parts.camera.position.x = current.pointerX * POINTER_LEAN;
      parts.camera.position.y = -current.pointerY * POINTER_LEAN * 0.6;
      parts.camera.lookAt(0, 0, parts.camera.position.z - 10);

      for (const shape of parts.shapes) {
        shape.mesh.rotation.x += shape.spin.x * delta;
        shape.mesh.rotation.y += shape.spin.y * delta;
        shape.mesh.rotation.z += shape.spin.z * delta;
        shape.mesh.position.y =
          shape.baseY + Math.sin(elapsed * 0.5 + shape.bobPhase) * shape.bobAmplitude;
      }

      renderer.render(parts.scene, parts.camera);
    };

    render();

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      parts.dispose();
      // Releases the WebGL context itself. Browsers allow a limited number of
      // live contexts per page, and navigating away without this exhausts them.
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="scene-canvas"
      // Fades in once the first frames are on screen, so the scene arrives
      // rather than popping into place mid-read.
      style={{ animation: 'scene-in 1.2s var(--ease-out-expo) forwards' }}
    />
  );
}
