import * as THREE from 'three';

/**
 * Builds the scene graph. No React, no lifecycle, no animation loop — those
 * belong to Scene.tsx. Keeping construction pure is what stops that file
 * growing into the one component nobody wants to open.
 *
 * The look: a field of chunky, flat-shaded toy shapes drifting in depth. It is
 * deliberately *not* photoreal. The rest of the site is flat colour, 2px
 * outlines and hard offset shadows; a softly-lit realistic render would look
 * pasted on top of it. Faceted low-poly solids in the same palette read as the
 * same family of object as the cards.
 */

const COUNT = 34;

/** Speed lines. Enough to fill the frame at speed, few enough to vanish at rest. */
const STREAK_COUNT = 26;

/** How far into the field the camera travels between the top and bottom. */
export const TRAVEL_DEPTH = 62;

export interface SceneParts {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Every shape, with the per-object drift values the loop needs. */
  shapes: Shape[];
  /** Speed lines. The loop moves them and fades them with scroll velocity. */
  streaks: THREE.Mesh[];
  streakMaterial: THREE.Material & { opacity: number };
  dispose: () => void;
}

export interface Shape {
  mesh: THREE.Mesh;
  /** Radians per second, per axis. */
  spin: THREE.Vector3;
  /** Vertical bob: amplitude and phase, so nothing moves in lockstep. */
  bobAmplitude: number;
  bobPhase: number;
  baseY: number;
}

/**
 * Reads the palette from the page's own CSS custom properties.
 *
 * The colours are defined once, in styles/index.css, and switch with the theme
 * toggle. Duplicating hex values here would mean the scene silently stopped
 * matching the site the first time a token changed.
 *
 * The conversion goes through a 1×1 canvas rather than getComputedStyle, and
 * that detail is load-bearing. The tokens are authored in oklch; Chrome returns
 * `oklch(...)` unchanged as the computed value, and THREE.Color cannot parse
 * oklch — it warns and leaves the colour white. Every shape rendered grey.
 * Canvas2D accepts any CSS colour the browser understands and hands back plain
 * sRGB bytes, so the browser does the conversion instead of three.js failing at
 * it.
 */
export function readThemeColors(): THREE.Color[] {
  const styles = getComputedStyle(document.documentElement);
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

  const resolve = (token: string, fallback: string): THREE.Color => {
    const raw = styles.getPropertyValue(token).trim();
    const color = new THREE.Color();

    if (!context || !raw) return color.set(fallback);

    // An unparseable value leaves fillStyle at its previous setting, so it is
    // reset to a known sentinel first and the failure is detectable.
    context.fillStyle = '#000000';
    context.fillStyle = raw;
    if (context.fillStyle === '#000000') return color.set(fallback);

    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);

    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    // Declared as sRGB so three's colour management converts to linear once,
    // correctly, rather than treating the bytes as already-linear values.
    return color.setRGB(r! / 255, g! / 255, b! / 255, THREE.SRGBColorSpace);
  };

  return [
    resolve('--accent', '#f4703a'),
    resolve('--accent-2', '#f6dc72'),
    resolve('--accent-3', '#3aa7c4'),
    resolve('--accent-subtle', '#f7d9c6'),
    // The page background, used for the fog so distant shapes dissolve into it.
    resolve('--bg', '#faf5ec'),
  ];
}

/**
 * The three-step ramp that turns smooth lighting into flat cel bands.
 *
 * NearestFilter is not optional here. With the default linear filtering the
 * texture is interpolated and the bands blend back into the gradient this
 * exists to destroy.
 */
function createToonGradient(): THREE.DataTexture {
  const steps = new Uint8Array([90, 175, 255]);
  const texture = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);

  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Four geometries shared across all 34 meshes. Building one per shape would
 * allocate 34 sets of buffers for four distinct forms.
 *
 * Segment counts are kept low so the facets stay visible — the faceting is the
 * point, not an artefact of a low budget.
 */
function createGeometries(): THREE.BufferGeometry[] {
  return [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.TorusGeometry(1, 0.42, 3, 12),
    new THREE.OctahedronGeometry(1.2, 0),
  ];
}

export function createScene(width: number, height: number): SceneParts {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 140);
  camera.position.set(0, 0, 12);

  /*
   * Deliberately restrained. three.js uses physically-based light units, so
   * intensities that look reasonable as numbers overexpose immediately: a
   * combined intensity near 5 clamps every material to white and throws the
   * whole palette away. The total here stays close to 2.
   *
   * Ambient does most of the work, with just enough directional light to make
   * the facets read. Strong key lighting would produce smooth gradients, and
   * the flat faceted look is the point.
   */
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));

  const key = new THREE.DirectionalLight(0xffffff, 0.75);
  key.position.set(4, 8, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 0.3);
  rim.position.set(-6, -3, -4);
  scene.add(rim);

  const geometries = createGeometries();
  const palette = readThemeColors();
  // The last entry is the background; the rest are the shape colours.
  const background = palette[palette.length - 1]!;
  const colors = palette.slice(0, -1);

  /*
   * Fog, in the page's own background colour, so far shapes dissolve into it.
   *
   * This is doing more than atmosphere. In perspective, a shape held at a fixed
   * world-space x converges toward the centre of frame the further away it is —
   * so the distant half of the field drifts straight across the headline no
   * matter how far out it was placed. Fading those out is what keeps the centre
   * column clear while the near shapes, which sit out at the edges, stay vivid.
   */
  scene.fog = new THREE.Fog(background, 20, 58);

  /*
   * Cel shading. MeshToonMaterial quantises lighting through a gradient map,
   * so instead of a smooth falloff each face lands in one of three flat bands —
   * which is what makes an anime cel look like an anime cel rather than a
   * render. A one-pixel-tall texture is the whole technique.
   */
  const gradient = createToonGradient();

  const materials = colors.map(
    (color) =>
      new THREE.MeshToonMaterial({
        color,
        gradientMap: gradient,
        transparent: true,
        // The scene sits behind body copy. Anything more opaque than this and
        // the text becomes work to read, which is a bad trade for decoration.
        // Cel shading pushed this down: flat bands read as more solid than the
        // graduated shading they replaced, at the same opacity value.
        opacity: 0.5,
      }),
  );

  const shapes: Shape[] = [];

  for (let index = 0; index < COUNT; index += 1) {
    const geometry = geometries[index % geometries.length]!;
    const material = materials[index % materials.length]!;
    const mesh = new THREE.Mesh(geometry, material);

    // Spread through the full travel depth, plus a margin in front of the
    // camera's start so the field is already populated on arrival.
    const depth = -(index / COUNT) * TRAVEL_DEPTH - Math.random() * 6 + 6;

    /*
     * Kept clear of the centre column, where the headings and body copy live.
     *
     * The minimums are not arbitrary. At the camera's start the visible half
     * width is roughly 9 world units on a wide screen, so a shape at x = 4
     * lands directly behind the headline.
     *
     * The two sides differ because the frame is not symmetric: the content
     * column is left-aligned inside a centred container, so the left half
     * carries the headings, the body copy and the progress rail while the right
     * half is mostly empty. The left side is pushed further out to match.
     */
    const x = Math.random() < 0.45 ? -(9.5 + Math.random() * 5) : 6.5 + Math.random() * 6.5;
    const y = (Math.random() - 0.5) * 14;

    mesh.position.set(x, y, depth);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    const scale = 0.45 + Math.random() * 0.85;
    mesh.scale.setScalar(scale);

    scene.add(mesh);

    shapes.push({
      mesh,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.34,
        (Math.random() - 0.5) * 0.34,
        (Math.random() - 0.5) * 0.2,
      ),
      bobAmplitude: 0.25 + Math.random() * 0.5,
      bobPhase: Math.random() * Math.PI * 2,
      baseY: y,
    });
  }

  /*
   * Speed lines, in three dimensions.
   *
   * Long thin bars lying along the view axis. Held still they are almost
   * invisible; the loop fades them up with scroll velocity, so scrolling hard
   * fills the frame with streaks and stopping makes them vanish. It is the
   * oldest shorthand in the medium for "moving fast", and it costs one shared
   * geometry and one shared material.
   */
  const streakGeometry = new THREE.BoxGeometry(0.07, 0.07, 9);
  const streakMaterial = new THREE.MeshBasicMaterial({
    color: colors[0],
    transparent: true,
    opacity: 0,
    // Never occlude a shape, and never be occluded into a hard edge.
    depthWrite: false,
    fog: false,
  });

  const streaks: THREE.Mesh[] = [];

  for (let index = 0; index < STREAK_COUNT; index += 1) {
    const streak = new THREE.Mesh(streakGeometry, streakMaterial);

    // A ring around the view axis, clear of the middle where the text is.
    const angle = Math.random() * Math.PI * 2;
    const radius = 7 + Math.random() * 9;

    streak.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.7,
      -Math.random() * TRAVEL_DEPTH,
    );

    scene.add(streak);
    streaks.push(streak);
  }

  /**
   * Geometries and materials are shared, so they are disposed once here rather
   * than per mesh. WebGL resources are not garbage collected — without this,
   * every theme change would leak a full set of buffers.
   */
  const dispose = () => {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    streakGeometry.dispose();
    streakMaterial.dispose();
    gradient.dispose();
    scene.clear();
  };

  return { scene, camera, shapes, streaks, streakMaterial, dispose };
}
