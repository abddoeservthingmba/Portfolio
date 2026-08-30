import { cn } from '@/lib/cn';

/**
 * Reveals a heading word by word, each rising from behind a mask.
 *
 * The mask is what sells it: every word sits in an overflow-hidden span, so it
 * slides up from nothing rather than fading in place. Purely CSS — the shared
 * IntersectionObserver flips one attribute and the stagger comes from `--i`.
 *
 * The full string stays readable to assistive technology as one label, because
 * a heading split into per-word elements is otherwise announced as fragments.
 */
export function SplitText({
  text,
  className,
  /** Delay before the first word, in stagger steps. */
  startIndex = 0,
}: {
  text: string;
  className?: string;
  startIndex?: number;
}) {
  const words = text.split(' ');

  return (
    <span className={cn('inline', className)}>
      <span className="sr-only">{text}</span>

      <span aria-hidden="true">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className="inline-block overflow-hidden align-bottom">
            <span
              className="split-word inline-block"
              style={{ '--i': startIndex + index } as React.CSSProperties}
            >
              {word}
              {index < words.length - 1 ? ' ' : ''}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * The wrapper an observer watches. Splitting this from SplitText lets one
 * trigger drive several lines — a heading and its kicker rising together.
 */
export function SplitReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('split-reveal', className)}>{children}</span>;
}
