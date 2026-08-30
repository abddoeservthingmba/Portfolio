import type { Skill } from '@/types/content';

/**
 * A full-bleed band of scrolling skill names.
 *
 * The list is rendered twice and the track translated by exactly -50%, so the
 * second copy lands where the first began and the loop is seamless. One
 * compositor-only animation drives it — no JavaScript runs while it scrolls.
 *
 * Two rows moving in opposite directions, because a single band reads as a
 * ticker while a pair reads as texture.
 */
export function SkillMarquee({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) return null;

  const names = skills.map((skill) => skill.name);
  const half = Math.ceil(names.length / 2);

  return (
    <div className="full-bleed border-y-2 border-border-strong bg-accent-2 py-5" aria-hidden="true">
      <MarqueeRow names={names.slice(0, half)} seconds={38} />
      <MarqueeRow names={names.slice(half)} seconds={44} reverse />
    </div>
  );
}

function MarqueeRow({
  names,
  seconds,
  reverse = false,
}: {
  names: string[];
  seconds: number;
  reverse?: boolean;
}) {
  if (names.length === 0) return null;

  return (
    <div className="overflow-hidden py-1.5">
      <ul
        className="flex w-max items-center gap-4 hover:[animation-play-state:paused]"
        style={{
          animation: `marquee ${seconds}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {[...names, ...names].map((name, index) => (
          <li
            key={`${name}-${index}`}
            className="flex items-center gap-4 whitespace-nowrap text-lg font-bold tracking-tight text-accent-2-fg sm:text-xl"
          >
            {name}
            <span className="text-accent">●</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
