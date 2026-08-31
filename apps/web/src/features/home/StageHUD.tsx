import { cn } from '@/lib/cn';

/**
 * The progress rail down the left edge — how far through the journey you are,
 * and what is still ahead.
 *
 * A real <nav> of real anchor links, not decoration. It is keyboard reachable,
 * announced as navigation, and works with JavaScript disabled, because the
 * alternative — divs with click handlers — would make the only map of the page
 * unusable to anyone not driving it with a mouse.
 *
 * Hidden below `xl`. On a narrow screen it either overlaps the content or
 * shrinks to the point of being unreadable, and the header already lists every
 * destination.
 */
export function StageHUD({
  stages,
  active,
}: {
  stages: Array<{ id: string; label: string }>;
  active: number;
}) {
  return (
    <nav
      aria-label="Page sections"
      className="stage-hud fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ol className="flex flex-col gap-1">
        {stages.map((stage, index) => {
          const isActive = index === active;

          return (
            <li key={stage.id}>
              <a
                href={`#${stage.id}`}
                aria-current={isActive ? 'true' : undefined}
                className="group flex items-center gap-3 rounded-pill py-1.5 pr-2"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2.5 w-2.5 shrink-0 rounded-full border-2 border-border-strong transition-all duration-400 [transition-timing-function:var(--ease-spring)]',
                    isActive
                      ? 'scale-150 bg-accent'
                      : 'bg-surface group-hover:scale-125 group-hover:bg-accent-2',
                  )}
                />

                {/*
                  Visible for the current stage and on hover only. A permanent
                  column of five labels competes with the page for attention,
                  which is the opposite of what a progress indicator is for.
                */}
                <span
                  className={cn(
                    'font-mono text-[0.68rem] uppercase tracking-[0.18em] transition-all duration-300',
                    isActive
                      ? 'translate-x-0 text-text opacity-100'
                      : '-translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
                  )}
                >
                  {stage.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
