import * as THREE from 'three';

/**
 * The centrepiece: a cluster of crystal shards, lit and polished.
 *
 * The page used to open on thirty-four drifting shapes, which is atmosphere but
 * not a subject — the eye has nowhere to land. One well-made object earns
 * attention in a way a field of debris cannot, and it is what the rest of the
 * scene is now arranged around.
 *
 * Built from one octahedron scaled into shards rather than modelled. A real
 * asset would mean a loader, a file to fetch and a format to keep working;
 * seven stretched octahedra around a shared origin read as a grown crystal and
 * cost one geometry.
 */

/** Each shard: direction from the origin, length, thickness, and a tilt. */
const SHARDS: Array<{
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}> = [
  { position: [0, 0.35, 0], scale: [0.62, 2.5, 0.62], rotation: [0.06, 0, 0.05] },
  { position: [0.72, -0.3, 0.18], scale: [0.44, 1.7, 0.44], rotation: [0, 0, -0.5] },
  { position: [-0.68, -0.15, -0.22], scale: [0.4, 1.95, 0.4], rotation: [0.1, 0, 0.42] },
  { position: [0.3, -0.72, -0.62], scale: [0.36, 1.35, 0.36], rotation: [-0.42, 0, -0.22] },
  { position: [-0.35, -0.62, 0.6], scale: [0.34, 1.25, 0.34], rotation: [0.38, 0, 0.2] },
  { position: [0.5, 0.55, -0.4], scale: [0.28, 1.05, 0.28], rotation: [-0.2, 0, -0.62] },
  { position: [-0.5, 0.42, 0.35], scale: [0.26, 0.95, 0.26], rotation: [0.24, 0, 0.68] },
];

export interface Hero {
  /** Positioned and scaled. Does not rotate — the glow lives here. */
  root: THREE.Group;
  /** The shards. This is the group that turns. */
  spin: THREE.Group;
  dispose: () => void;
}

export function createHero(
  color: THREE.Color,
  glowColor: THREE.Color,
  environment: THREE.Texture | null,
): Hero {
  /*
   * Two groups, not one, and the split matters.
   *
   * The glow is a flat plane. Parented to the rotating group it turned with the
   * shards, and every half revolution it swung edge-on to the camera and
   * flashed across the page as a bright vertical smear. It belongs on a root
   * that only ever moves, never rotates.
   */
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);

  const geometry = new THREE.OctahedronGeometry(1, 0);

  /*
   * Physical rather than standard, for the clearcoat — a thin reflective layer
   * over the body colour, which is what separates a polished gem from a matte
   * solid. Roughness is deliberately very low: the environment map is the thing
   * doing the work here, and a rough surface throws it away.
   *
   * flatShading keeps the facets crisp. A crystal with smoothed normals is a
   * blob.
   */
  const material = new THREE.MeshPhysicalMaterial({
    /*
     * Lifted toward white. At full accent saturation the facets pointing away
     * from the light bottom out into near-black and the whole cluster reads as
     * dark rust rather than as a gem — a saturated base colour leaves the
     * shading no headroom to darken into.
     */
    color: color.clone().lerp(new THREE.Color(0xffffff), 0.1),
    flatShading: true,
    roughness: 0.06,
    /*
     * Part metal. Fully dielectric, the environment only tints the surface and
     * the cluster stays a matte solid; fully metallic, the base colour is
     * discarded and it turns into chrome. A third of the way across keeps the
     * coral and still lets the sun in the environment map throw a hard
     * highlight across each facet.
     */
    metalness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMap: environment,
    envMapIntensity: 1.4,
    ior: 1.6,
  });

  for (const shard of SHARDS) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...shard.position);
    mesh.scale.set(...shard.scale);
    mesh.rotation.set(...shard.rotation);
    spin.add(mesh);
  }

  // The glow behind it. Stands in for bloom, which would mean a post-processing
  // pass and another slab of three.js in the chunk for one soft halo.
  const glow = createGlow(glowColor);
  root.add(glow);

  return {
    root,
    spin,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      glow.geometry.dispose();
      (glow.material as THREE.MeshBasicMaterial).map?.dispose();
      (glow.material as THREE.Material).dispose();
    },
  };
}

/**
 * A soft radial halo on a plane, drawn additively behind the cluster.
 *
 * The texture is painted once into a canvas rather than shipped as a PNG: it is
 * a radial gradient, which is one call to describe and no bytes to download.
 */
function createGlow(color: THREE.Color): THREE.Mesh {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  const rgb = `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`;

  gradient.addColorStop(0, `rgba(${rgb}, 0.5)`);
  gradient.addColorStop(0.45, `rgba(${rgb}, 0.16)`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      // Never write depth: an additive halo that occludes is a grey square.
      depthWrite: false,
      fog: false,
    }),
  );

  mesh.position.z = -2.2;

  return mesh;
}
