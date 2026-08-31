import { Suspense, lazy, useEffect, useState } from 'react';
import { useSceneCapability } from './useSceneCapability';

/**
 * The boundary that keeps three.js out of the main bundle.
 *
 * This file must never import from './Scene' or from 'three' at the top level.
 * A static import here would pull the whole library into the entry chunk and
 * defeat the entire arrangement — the lazy() call below is load-bearing, not a
 * stylistic choice.
 */
const Scene = lazy(() => import('./Scene'));

/**
 * Waits for the browser to be idle before allowing the import.
 *
 * The hero, the fonts and the first content fetch all matter more than the
 * background. Requesting a 200KB chunk while those are in flight makes the
 * page measurably slower to become useful, which is the opposite of the point.
 */
function useIdle(): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    // Safari has no requestIdleCallback; a timeout is a reasonable stand-in,
    // and being slightly late here costs nothing.
    if (typeof requestIdleCallback === 'undefined') {
      const timer = setTimeout(() => setIdle(true), 1200);
      return () => clearTimeout(timer);
    }

    const handle = requestIdleCallback(() => setIdle(true), { timeout: 2500 });
    return () => cancelIdleCallback(handle);
  }, []);

  return idle;
}

export function SceneLayer() {
  const capable = useSceneCapability();
  const idle = useIdle();

  // Both false on first render, so nothing here participates in first paint.
  if (!capable || !idle) return null;

  return (
    // A fallback of null, not a spinner: this is decoration. Nothing should
    // appear in its place, and nothing should reserve space for it.
    <Suspense fallback={null}>
      <Scene />
    </Suspense>
  );
}
