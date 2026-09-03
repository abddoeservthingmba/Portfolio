import type { Project } from '@/types/content';

/**
 * The art for a project: its uploaded image if it has one, otherwise generated
 * cover art derived from its slug.
 *
 * WHY GENERATE INSTEAD OF PLACEHOLDER
 *
 * Most projects have no image and probably never will — writing a case study is
 * work, exporting a screenshot that still looks current is more. So the
 * no-image case is not a degraded state to be tolerated, it is the normal one,
 * and it has to look deliberate. A flat wash with one low-contrast letter reads
 * as a missing asset; a composed cover reads as a choice.
 *
 * Everything here is gradients and text — no images, no requests, no canvas —
 * so a wall of sixteen covers costs nothing to paint.
 *
 * WHY THE SLUG AND NOT THE INDEX
 *
 * Deriving the variant from the slug keeps a project's cover stable wherever it
 * appears. Filtering the list must not repaint it, and the same project must
 * look the same on the homepage, the index and its own detail page.
 */

/**
 * Warm tints only.
 *
 * The previous set included sky, mint and lilac, which put three cool hues
 * against a palette whose entire point is that nothing in it is cool — a single
 * cyan card was the loudest thing on the page. Every hue here sits between 25
 * and 120, the same arc as the accents.
 *
 * `ink` is the deeper relative of each base, used for the motif and the letter
 * so a cover is always two tones of one hue rather than a tint plus grey.
 */
const TINTS = [
  { base: 'oklch(93% 0.13 103)', ink: 'oklch(58% 0.14 85)' }, // butter
  { base: 'oklch(90% 0.09 42)', ink: 'oklch(58% 0.18 40)' }, // peach
  { base: 'oklch(91% 0.07 65)', ink: 'oklch(56% 0.13 60)' }, // sand
  { base: 'oklch(89% 0.1 25)', ink: 'oklch(55% 0.19 25)' }, // clay
  { base: 'oklch(92% 0.1 120)', ink: 'oklch(56% 0.14 118)' }, // olive gold
];

/**
 * The motif behind the letter. Four of them, so a grid of cards does not repeat
 * itself before the reader has stopped noticing.
 *
 * Each is one repeating gradient. They are deliberately geometric rather than
 * organic: the site's whole surface language is hard edges and offset shadows,
 * and a soft blob would belong to a different design.
 */
const MOTIFS = [
  // Concentric rings, off-centre so the composition has a focal point.
  (ink: string) =>
    `repeating-radial-gradient(circle at 78% 22%, ${ink} 0 2px, transparent 2px 22px)`,
  // Diagonal bars.
  (ink: string) => `repeating-linear-gradient(58deg, ${ink} 0 3px, transparent 3px 20px)`,
  // Graph grid.
  (ink: string) =>
    `repeating-linear-gradient(0deg, ${ink} 0 1.5px, transparent 1.5px 18px),` +
    `repeating-linear-gradient(90deg, ${ink} 0 1.5px, transparent 1.5px 18px)`,
  // Dot lattice, coarser than the halftone above it so the two read as layers.
  (ink: string) => `radial-gradient(${ink} 1.8px, transparent 2px)`,
];

/** A small, stable hash. Not cryptographic — it only has to spread evenly. */
function hashOf(slug: string): number {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % 9973;

  return hash;
}

export interface ProjectArtStyle {
  base: string;
  ink: string;
  motif: string;
  motifSize: string;
}

export function artFor(slug: string): ProjectArtStyle {
  const hash = hashOf(slug);
  const tint = TINTS[hash % TINTS.length]!;
  const motifIndex = Math.floor(hash / TINTS.length) % MOTIFS.length;

  return {
    base: tint.base,
    ink: tint.ink,
    motif: MOTIFS[motifIndex]!(tint.ink),
    // Only the dot lattice tiles; the others carry their own period.
    motifSize: motifIndex === 3 ? '19px 19px' : 'auto',
  };
}

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
