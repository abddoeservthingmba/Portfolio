import { useEffect, useRef } from 'react';
import { CharacterSprite } from './CharacterSprite';
import { getCharacter, type CharacterId } from './characters';

/**
 * The fighter sprinting across the page behind the content.
 *
 * Scroll position drives horizontal position, so the character is genuinely
 * running the length of the journey rather than looping on a timer. Scroll up
 * and he turns around and runs back.
 *
 * Low opacity, `pointer-events: none`, and behind every stage. He is scenery —
 * if he ever competes with the text for attention, the opacity in the
 * stylesheet is the dial, not this file.
 *
 * Imperative for the same reason as the cursor: this updates on every scroll
 * frame, and routing that through React state would re-render the sprite for
 * the whole length of the page.
 */

/** Below this the sprite is stationary and the run cycle stops. */
const IDLE_EPSILON = 0.0004;

export function BackgroundRunner({ characterId }: { characterId: CharacterId }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let target = 0;
    let eased = 0;
    let facing = 1;
    let frame = 0;

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    };

    const render = () => {
      frame = requestAnimationFrame(render);

      const delta = target - eased;
      eased += delta * 0.07;

      // Turn to face the way he is travelling, with a deadzone so a scroll that
      // has all but settled does not make him pivot on the spot.
      if (Math.abs(delta) > IDLE_EPSILON) facing = delta > 0 ? 1 : -1;

      // Runs the full width with a margin either side, so he enters and exits
      // the frame rather than sitting pinned to an edge.
      const x = -12 + eased * 124;

      root.style.transform = `translate3d(${x}vw, 0, 0)`;
      root.dataset.pose = Math.abs(delta) > IDLE_EPSILON ? 'run' : 'idle';
      root.dataset.facing = String(facing);
    };

    readScroll();
    render();
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
    };
  }, []);

  const { colors } = getCharacter(characterId);

  return (
    <div
      ref={rootRef}
      className="fighter-runner"
      data-pose="idle"
      data-facing="1"
      aria-hidden="true"
      style={{ '--aura': colors.aura } as React.CSSProperties}
    >
      {/* Speed lines trailing behind him. Pure anime shorthand for velocity. */}
      <span className="fighter-runner-lines" />
      <CharacterSprite characterId={characterId} className="fighter-runner-svg" />
    </div>
  );
}
