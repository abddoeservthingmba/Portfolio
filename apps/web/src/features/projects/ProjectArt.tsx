import type { Project } from '@/types/content';
import { artFor } from './coverArt';

/**
 * The cover. Fills its container, so the caller owns the aspect ratio — a card
 * wants 16:9, the hover preview wants something squarer, and neither should
 * have to fight a size baked in here.
 */
export function ProjectArt({ project, className }: { project: Project; className?: string }) {
  if (project.imageUrl) {
    return (
      <img
        src={project.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={
          'h-full w-full object-cover transition-transform duration-700 ' +
          '[transition-timing-function:var(--ease-out-expo)] group-hover/card:scale-[1.04] ' +
          (className ?? '')
        }
      />
    );
  }

  return <GeneratedCover project={project} className={className} />;
}

function GeneratedCover({ project, className }: { project: Project; className?: string }) {
  const art = artFor(project.slug);
  const initial = project.title.charAt(0).toUpperCase();

  return (
    <div
      aria-hidden="true"
      className={'relative h-full w-full overflow-hidden ' + (className ?? '')}
      // A size container, so the letter below can be sized in cqh and scale
      // with the box. The callers give this very different shapes — 16:9 on a
      // card, near-square in the hover preview — and one fixed size cannot
      // suit both.
      //
      // --cover-dim is `none` on the light palette and a small brightness knock
      // on the dark one: these tints are fixed light values, and three of them
      // glowing at full strength against a near-black page pulls every eye to
      // the art instead of the titles. Only the generated cover is corrected —
      // an uploaded screenshot should be shown as it was uploaded.
      style={{
        backgroundColor: art.base,
        containerType: 'size',
        filter: 'var(--cover-dim)',
      }}
    >
      {/* The motif, kept faint — it is texture, not content. */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: art.motif, backgroundSize: art.motifSize }}
      />

      {/*
        The halftone screen, the same dot pattern the manga furniture uses, at
        a finer pitch than the motif so the two layers stay distinguishable.
        Masked to the corner so it falls off rather than covering the whole box.
      */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `radial-gradient(${art.ink} 1px, transparent 1.1px)`,
          backgroundSize: '7px 7px',
          maskImage: 'radial-gradient(90% 80% at 15% 95%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(90% 80% at 15% 95%, black, transparent 75%)',
        }}
      />

      {/*
        The initial, set in the display face, outlined rather than filled, and
        large enough to run out of the box. A letter that fits inside its frame
        reads as a fallback; one that is cropped reads as a composition.
      */}
      <span
        className="display absolute select-none leading-none"
        style={{
          /*
           * Sized and positioned against the box, not against type.
           *
           * cqh is the container's height, which is why the wrapper declares
           * container-type. A percentage font-size would resolve against the
           * inherited font size instead and land at about 20px — small enough
           * to look like a smudge in the corner rather than a composition.
           *
           * left/bottom are percentages of the containing block, so the crop
           * stays proportional at every card size.
           */
          fontSize: '94cqh',
          left: '-2.5%',
          bottom: '-15%',
          color: 'transparent',
          WebkitTextStroke: `2.5px ${art.ink}`,
          opacity: 0.45,
        }}
      >
        {initial}
      </span>

      {/* A light sweep, so the flat tint has a direction. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, oklch(100% 0 0 / 0.28), transparent 55%)`,
        }}
      />
    </div>
  );
}
