import type { Skill } from '@/types/content';

/**
 * A continuously scrolling band of skill names.
 *
 * The list is rendered twice and the track translated by exactly -50%, so the
 * second copy lands where the first began and the loop is seamless. One
 * compositor-only animation drives the whole thing — no JavaScript runs while
 * it scrolls.
 */
export function SkillMarquee({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) return null;

  const names = skills.map((skill) => skill.name);

  return (
    <div
      className="relative overflow-hidden py-4"
      // Fades the band into the page rather than cutting it off at the edges.
      style={{
        maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
      }}
    >
      <ul
        className="flex w-max items-center gap-3 hover:[animation-play-state:paused]"
        style={{ animation: `marquee ${Math.max(28, names.length * 2.2)}s linear infinite` }}
        // The duplicate copy is presentational, so the whole band is announced
        // once by its heading rather than read twice.
        aria-hidden="true"
      >
        {[...names, ...names].map((name, index) => (
          <li
            key={`${name}-${index}`}
            className="whitespace-nowrap rounded-pill border border-border bg-surface px-4 py-2 text-sm text-muted"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
