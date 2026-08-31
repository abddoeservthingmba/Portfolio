import { useEffect, useRef } from 'react';
import { CharacterSprite } from './CharacterSprite';
import { getCharacter, type CharacterId } from './characters';

/**
 * The chosen fighter, following the pointer.
 *
 * Everything here is imperative on purpose. A cursor updates every frame, and
 * driving that through React state would re-render the sprite sixty times a
 * second for no benefit. The frame loop writes transforms and one data
 * attribute; React renders this component exactly once per character change.
 *
 * The native cursor is hidden and replaced by a small dot at the true pointer
 * position, with the character trailing behind it. Without that dot the
 * character *is* the hit target and nothing lines up — the pointer would be
 * somewhere inside a 56px sprite and clicking would feel broken.
 */

/** How hard the character chases the pointer. Lower is heavier and floatier. */
const FOLLOW = 0.16;

/** Pixels per frame past which the run cycle starts. */
const RUN_THRESHOLD = 1.6;

export function CursorCompanion({ characterId }: { characterId: CharacterId }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const sprite = spriteRef.current;
    if (!root || !dot || !sprite) return;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const eased = { ...pointer };
    let facing = 1;
    let frame = 0;
    let visible = false;

    const onPointerMove = (event: PointerEvent) => {
      // Touch and pen get nothing: there is no cursor to replace, and a sprite
      // chasing a finger is just an obstruction.
      if (event.pointerType !== 'mouse') return;

      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!visible) {
        visible = true;
        root.dataset.visible = 'true';
      }
    };

    // The sprite must not be left stranded mid-screen when the pointer leaves.
    const onLeave = () => {
      visible = false;
      root.dataset.visible = 'false';
    };

    const onDown = () => {
      sprite.dataset.impact = 'true';
      // Long enough to read as a hit, short enough not to queue up on a
      // double click.
      setTimeout(() => delete sprite.dataset.impact, 320);
    };

    const render = () => {
      frame = requestAnimationFrame(render);

      const dx = pointer.x - eased.x;
      const dy = pointer.y - eased.y;

      eased.x += dx * FOLLOW;
      eased.y += dy * FOLLOW;

      const speed = Math.hypot(dx, dy) * FOLLOW;

      // Face the direction of travel, with a deadzone so the sprite does not
      // flip back and forth while the pointer is essentially still.
      if (Math.abs(dx) > 2) facing = dx > 0 ? 1 : -1;

      root.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0)`;
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      sprite.style.transform = `translate(-50%, -50%) scaleX(${facing})`;
      sprite.dataset.pose = speed > RUN_THRESHOLD ? 'run' : 'idle';
    };

    render();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    // Scoped to the root element, so the rule that hides the native cursor can
    // be written once in CSS and cannot leak to the admin portal.
    document.documentElement.dataset.fighterCursor = 'true';

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('mouseleave', onLeave);
      delete document.documentElement.dataset.fighterCursor;
    };
  }, []);

  const { colors } = getCharacter(characterId);

  return (
    <>
      <div ref={dotRef} className="fighter-dot" aria-hidden="true" />

      <div
        ref={rootRef}
        className="fighter-cursor"
        data-visible="false"
        aria-hidden="true"
        style={{ '--aura': colors.aura } as React.CSSProperties}
      >
        <div ref={spriteRef} className="fighter-cursor-sprite" data-pose="idle">
          {/* Behind the sprite: the aura that flares on a click. */}
          <span className="fighter-impact" />
          <CharacterSprite characterId={characterId} className="fighter-cursor-svg" />
        </div>
      </div>
    </>
  );
}
