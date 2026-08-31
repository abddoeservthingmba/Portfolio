import { getCharacter, type CharacterId } from './characters';

/**
 * Draws a fighter.
 *
 * One shared skeleton — head, torso, two arms, two legs — with per-character
 * hair, headwear and props layered onto it. Four full illustrations would be
 * four times the SVG and four times the work every time a proportion changes;
 * this way a character is a handful of shapes and a palette.
 *
 * The run cycle is CSS, not a sprite sheet: the limb groups rotate about their
 * joints, so the animation is four keyframe blocks that cost nothing to
 * download and stay crisp at any size. `transform-box: view-box` is what lets
 * `transform-origin` be written in viewBox units rather than pixels.
 */

const JOINTS = {
  shoulderLeft: '21px 39px',
  shoulderRight: '43px 39px',
  hipLeft: '28px 63px',
  hipRight: '36px 63px',
} as const;

export function CharacterSprite({
  characterId,
  className,
}: {
  characterId: CharacterId;
  className?: string;
}) {
  const { colors } = getCharacter(characterId);

  return (
    <svg
      /*
       * Starts above zero. The martial artist's hair is the tallest thing any
       * fighter owns and it is most of his silhouette — drawn into a viewBox
       * that began at y=0 it was simply clipped off, and he read as a stubby
       * head rather than as himself. The headroom is part of the design.
       */
      viewBox="0 -16 64 116"
      className={className}
      aria-hidden="true"
      // Chunky ink outlines on every part, the way a cel is inked.
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <g stroke="#17151c" strokeWidth="2.6">
        {/* Props sit behind the body so a sword reads as slung across the back. */}
        <Prop characterId={characterId} colors={colors} />

        {/* Back limbs first — the far arm and leg are behind the torso. */}
        <g className="limb limb-arm-back" style={{ transformOrigin: JOINTS.shoulderRight }}>
          <rect x="41" y="38" width="6" height="24" rx="3" fill={colors.outfit} />
          <circle cx="44" cy="64" r="4" fill={colors.skin} />
        </g>

        <g className="limb limb-leg-back" style={{ transformOrigin: JOINTS.hipRight }}>
          <rect x="33" y="62" width="7" height="26" rx="3.5" fill={colors.accent} />
          <rect x="31.5" y="85" width="10" height="7" rx="3" fill="#17151c" />
        </g>

        {/* Torso */}
        <rect x="22" y="35" width="20" height="30" rx="7" fill={colors.outfit} />
        {/* Sash: the second colour, and what stops the torso reading as a slab. */}
        <rect x="22" y="56" width="20" height="6" fill={colors.accent} />

        {/* Front limbs */}
        <g className="limb limb-leg-front" style={{ transformOrigin: JOINTS.hipLeft }}>
          <rect x="24" y="62" width="7" height="26" rx="3.5" fill={colors.accent} />
          <rect x="22.5" y="85" width="10" height="7" rx="3" fill="#17151c" />
        </g>

        <g className="limb limb-arm-front" style={{ transformOrigin: JOINTS.shoulderLeft }}>
          <rect x="17" y="38" width="6" height="24" rx="3" fill={colors.outfit} />
          <circle cx="20" cy="64" r="4" fill={colors.skin} />
        </g>

        {/* Head last, so it overlaps the shoulders. */}
        <Hair characterId={characterId} colors={colors} layer="back" />
        <circle cx="32" cy="22" r="13" fill={colors.skin} />
        <Hair characterId={characterId} colors={colors} layer="front" />
        <Headwear characterId={characterId} colors={colors} />

        {/* Eyes. Two marks — at cursor size, anything more is mud. */}
        <g stroke="none" fill="#17151c">
          <ellipse cx="27" cy="23" rx="1.9" ry="2.6" />
          <ellipse cx="37" cy="23" rx="1.9" ry="2.6" />
        </g>
      </g>
    </svg>
  );
}

type Colors = ReturnType<typeof getCharacter>['colors'];

/**
 * Hair is split across two layers because a silhouette needs mass behind the
 * head as well as spikes in front of it. Drawing it all in front makes every
 * character look bald from the back of the skull forward.
 */
function Hair({
  characterId,
  colors,
  layer,
}: {
  characterId: CharacterId;
  colors: Colors;
  layer: 'back' | 'front';
}) {
  if (layer === 'back') {
    // The martial artist's hair is the tall one — it is most of his silhouette.
    if (characterId === 'martialist') {
      return (
        <path
          d="M18 22 L12 -6 L24 10 L28 -10 L34 8 L42 -8 L46 12 L54 0 L48 24 Z"
          fill={colors.hair}
        />
      );
    }

    if (characterId === 'swordsman') {
      return <path d="M19 20 L15 2 L26 12 L32 -2 L39 12 L49 2 L45 20 Z" fill={colors.hair} />;
    }

    return <circle cx="32" cy="20" r="14" fill={colors.hair} />;
  }

  // Front spikes and fringe.
  if (characterId === 'ninja') {
    return <path d="M19 16 L24 4 L28 14 L32 2 L37 14 L41 5 L45 17 Z" fill={colors.hair} />;
  }

  if (characterId === 'brawler') {
    return <path d="M20 15 Q26 8 32 12 Q39 8 44 16 Q32 11 20 15 Z" fill={colors.hair} />;
  }

  return null;
}

function Headwear({ characterId, colors }: { characterId: CharacterId; colors: Colors }) {
  // The hat is the whole silhouette — it has to survive being 40px tall.
  if (characterId === 'brawler') {
    return (
      <g>
        <ellipse cx="32" cy="13" rx="22" ry="6" fill="#e8c56a" />
        <path d="M22 13 Q32 -2 42 13 Z" fill="#e8c56a" />
        <rect x="21" y="10" width="22" height="4" rx="2" fill={colors.outfit} />
      </g>
    );
  }

  // Headband with a plate. Reads as a ninja at any size, which the hair alone
  // does not.
  if (characterId === 'ninja') {
    return (
      <g>
        <rect x="18" y="11" width="28" height="6" rx="2" fill={colors.accent} />
        <rect x="27" y="10.5" width="12" height="7" rx="1.5" fill="#c8ccd4" />
      </g>
    );
  }

  return null;
}

function Prop({ characterId, colors }: { characterId: CharacterId; colors: Colors }) {
  // A blade the length of the body. Understating it would defeat the point.
  if (characterId === 'swordsman') {
    return (
      <g>
        <rect
          x="44"
          y="10"
          width="7"
          height="70"
          rx="2"
          fill={colors.accent}
          transform="rotate(18 47 45)"
        />
        <rect
          x="42"
          y="58"
          width="11"
          height="9"
          rx="2"
          fill="#17151c"
          transform="rotate(18 47 45)"
        />
      </g>
    );
  }

  return null;
}
