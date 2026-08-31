import { useEffect, useState } from 'react';

/**
 * Decides whether the WebGL scene should run.
 *
 * This file deliberately imports nothing from three.js. It is the gate that
 * runs *before* the 200KB chunk is requested, so if it lived downstream of that
 * import it would already have cost the thing it exists to avoid.
 *
 * The bar is high on purpose. A decorative background that makes a mid-range
 * phone drop frames is worse than no background at all — the page it is
 * decorating becomes harder to read and slower to scroll.
 */

/** Network Information API — Chromium only, hence the hand-written type. */
interface Connection {
  saveData?: boolean;
  effectiveType?: string;
}

function reason(): string | null {
  if (typeof window === 'undefined') return 'no window';

  // Not a performance question. Someone who has asked their system for less
  // motion has asked for less motion, and drifting geometry is motion.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'reduced motion';
  }

  const nav = navigator as Navigator & {
    connection?: Connection;
    deviceMemory?: number;
  };

  if (nav.connection?.saveData) return 'data saver';

  // 'slow-2g' | '2g' | '3g' | '4g'. Anything below 4g means a chunk this size
  // is a meaningful part of the visitor's page load.
  if (nav.connection?.effectiveType && nav.connection.effectiveType !== '4g') {
    return `slow connection (${nav.connection.effectiveType})`;
  }

  // Both are absent on Safari and Firefox, where the check simply passes —
  // undefined < 4 is false. That is the intended behaviour: gate on evidence
  // of a weak device, not on absence of evidence.
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return 'few cores';
  if (nav.deviceMemory && nav.deviceMemory < 4) return 'low memory';

  // A coarse pointer on a small screen is a phone. The scene renders behind
  // text that has to stay readable on 375px, where it adds noise rather than
  // depth, and where the GPU is doing the most work for the least benefit.
  if (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900) {
    return 'small touch screen';
  }

  if (!hasWebGL2()) return 'no webgl2';

  return null;
}

/** Probes for a real context rather than trusting feature detection. */
function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

/**
 * False on the first render for everyone, so the scene is never part of the
 * initial paint. It flips to true one effect later, and only if the device
 * qualifies.
 */
export function useSceneCapability(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const declined = reason();
    if (declined) return;

    setEnabled(true);
  }, []);

  return enabled;
}
