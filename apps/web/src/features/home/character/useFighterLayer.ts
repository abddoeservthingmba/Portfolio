import { useEffect, useState } from 'react';

/**
 * Whether the fighter layer should run, and how much of it.
 *
 * Two answers rather than one, because the cursor and the background runner
 * fail for different reasons. Replacing the native cursor on a touch device is
 * meaningless — there is no cursor. A background runner on a touch device is
 * merely unnecessary. Collapsing them into one boolean would tie the two
 * decisions together for no reason.
 *
 * Both stay false on the first render, so nothing here is part of first paint.
 */
export function useFighterLayer(): { cursor: boolean; runner: boolean } {
  const [state, setState] = useState({ cursor: false, runner: false });

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

    const evaluate = () => {
      // A moving figure across the page is exactly what a reduced-motion
      // setting is asking not to see, so it gates both.
      const motionOk = !motion.matches;

      setState({
        // The cursor also needs a real cursor to replace, and enough width that
        // a 56px sprite is not covering a meaningful part of the screen.
        cursor: motionOk && fine.matches && window.innerWidth >= 1024,
        runner: motionOk,
      });
    };

    evaluate();

    // Someone can change the OS motion setting, or plug in a mouse, without
    // reloading the page.
    motion.addEventListener('change', evaluate);
    fine.addEventListener('change', evaluate);
    window.addEventListener('resize', evaluate, { passive: true });

    return () => {
      motion.removeEventListener('change', evaluate);
      fine.removeEventListener('change', evaluate);
      window.removeEventListener('resize', evaluate);
    };
  }, []);

  return state;
}
