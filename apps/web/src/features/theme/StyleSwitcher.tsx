import { useEffect, useRef, useState } from 'react';
import { useStyle } from '@/lib/useStyle';
import { STYLES } from './styles';
import { cn } from '@/lib/cn';

/**
 * The theme switcher, pinned to the bottom-right corner.
 *
 * A corner control rather than a bar across the foot of the page: this is a
 * preference someone sets once and then ignores, and a full-width dock spends
 * permanent screen space on it. Collapsed it is a single button; the options
 * only exist in the DOM while it is open.
 *
 * It changes the visual style only. Light/dark stays in the header, because
 * the two are separate questions.
 */
export function StyleSwitcher() {
  const { style, setStyle } = useStyle();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const current = STYLES.find((option) => option.id === style) ?? STYLES[0]!;

  // Close on outside click and on Escape. Escape returns focus to the trigger,
  // or the keyboard user is dropped at the top of the document.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      // Below the header (z-40) and the replacement cursor (z-60), above the
      // background runner (z-1) so it is never drawn through.
      className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2.5"
    >
      {open && (
        <div
          role="radiogroup"
          aria-label="Visual theme"
          className="style-panel w-60 overflow-hidden rounded-card border-2 border-border-strong bg-surface shadow-[var(--shadow-lg)]"
        >
          <p className="border-b-2 border-border-strong bg-surface-raised px-3.5 py-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted">
            Theme
          </p>

          <ul className="p-1.5">
            {STYLES.map((option) => {
              const selected = option.id === style;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setStyle(option.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left transition-colors duration-200',
                      selected ? 'bg-accent-subtle' : 'hover:bg-surface-raised',
                    )}
                  >
                    <Swatch colours={option.swatch} />

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-sm font-semibold',
                          selected ? 'text-accent' : 'text-text',
                        )}
                      >
                        {option.name}
                      </span>
                      <span className="block truncate text-xs text-subtle">{option.note}</span>
                    </span>

                    {/* A tick, not a colour change alone. Colour is the one
                        channel a theme picker cannot rely on. */}
                    <span
                      aria-hidden="true"
                      className={cn('text-sm text-accent', selected ? 'opacity-100' : 'opacity-0')}
                    >
                      ✓
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={`Visual theme: ${current.name}. Change it.`}
        title="Visual theme"
        onClick={() => setOpen((value) => !value)}
        className="push style-trigger flex items-center gap-2 rounded-pill border-2 border-border-strong bg-surface py-2 pl-2.5 pr-3.5 shadow-[var(--shadow-sm)]"
      >
        <Swatch colours={current.swatch} />
        <span className="text-sm font-semibold text-text">{current.name}</span>
      </button>
    </div>
  );
}

/** Three overlapping dots: ground, primary, secondary. */
function Swatch({ colours }: { colours: readonly [string, string, string] }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center">
      {colours.map((colour, index) => (
        <span
          key={colour}
          className="h-4 w-4 rounded-full border-2 border-border-strong"
          style={{ background: colour, marginLeft: index === 0 ? 0 : '-0.42rem' }}
        />
      ))}
    </span>
  );
}
