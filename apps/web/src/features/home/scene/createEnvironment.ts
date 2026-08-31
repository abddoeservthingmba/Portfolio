import * as THREE from 'three';

/**
 * A procedural environment map, for reflections.
 *
 * This is the single largest difference between something that looks rendered
 * and something that looks like WebGL. A glossy surface with no environment has
 * nothing to reflect, so it reads as flat plastic no matter how many lights are
 * pointed at it; give it even a crude sky-to-ground gradient and it starts
 * behaving like a real material.
 *
 * Generated rather than downloaded. A real HDRI is a megabyte or more and one
 * more request on the critical path, and at the size this thing appears on
 * screen nobody can tell the difference between a captured sky and a vertical
 * gradient in the page's own palette.
 */

/** Equirectangular, so it wraps the sphere. Small — PMREM blurs it anyway. */
const WIDTH = 64;
const HEIGHT = 32;

/**
 * The sun, in normalised equirectangular coordinates, and how hard it burns.
 *
 * This is the part that matters. A gradient alone gives a surface something to
 * tint with but nothing to *glint* off, and a polished object with no highlight
 * looks like painted clay. The intensity is deliberately far above 1: a
 * specular highlight is only convincing when the light source is brighter than
 * white, which is exactly what a low-dynamic-range texture cannot store — hence
 * the float buffer below.
 */
const SUN = { u: 0.68, v: 0.26, radius: 0.09, intensity: 14 };

export interface Environment {
  texture: THREE.Texture;
  dispose: () => void;
}

/**
 * `sky` lights the top of an object, `ground` bounces up into its underside.
 * Warm above and cool below is the oldest lighting cheat there is, and it reads
 * as daylight without anyone being able to say why.
 */
export function createEnvironment(
  renderer: THREE.WebGLRenderer,
  sky: THREE.Color,
  horizon: THREE.Color,
  ground: THREE.Color,
): Environment {
  /*
   * Float, not bytes. Lighting maths happens in linear space and a real
   * environment carries values above 1 — the sun below is 14. A Uint8 buffer
   * clamps everything at white, which is why an LDR gradient can tint a surface
   * but never make it glint.
   */
  const data = new Float32Array(WIDTH * HEIGHT * 4);

  // The palette is authored in sRGB; the buffer is linear. Converting once here
  // is the difference between these colours and washed-out approximations.
  const skyLinear = sky.clone().convertSRGBToLinear();
  const horizonLinear = horizon.clone().convertSRGBToLinear();
  const groundLinear = ground.clone().convertSRGBToLinear();
  const mix = new THREE.Color();

  for (let y = 0; y < HEIGHT; y += 1) {
    // 0 at the top of the sphere, 1 at the bottom.
    const v = y / (HEIGHT - 1);

    // Two segments meeting at the horizon, rather than one gradient sky to
    // ground — a single ramp puts the brightest value at the pole, which lights
    // an object from directly overhead and flattens it.
    if (v < 0.5) mix.copy(skyLinear).lerp(horizonLinear, v * 2);
    else mix.copy(horizonLinear).lerp(groundLinear, (v - 0.5) * 2);

    for (let x = 0; x < WIDTH; x += 1) {
      const u = x / (WIDTH - 1);
      const offset = (y * WIDTH + x) * 4;

      // Longitude wraps, so the shorter way round is the real distance —
      // without this the sun is cut in half at the seam.
      const du = Math.min(Math.abs(u - SUN.u), 1 - Math.abs(u - SUN.u));
      const distance = Math.hypot(du, v - SUN.v);

      // Smooth falloff to the edge of the disc, squared for a tighter core.
      const fall = Math.max(0, 1 - distance / SUN.radius) ** 2;
      const sun = fall * SUN.intensity;

      data[offset] = mix.r + sun;
      data[offset + 1] = mix.g + sun;
      data[offset + 2] = mix.b + sun;
      data[offset + 3] = 1;
    }
  }

  const source = new THREE.DataTexture(data, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.FloatType);
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.needsUpdate = true;

  /*
   * PMREM prefilters the map into the roughness mip chain three.js samples for
   * physically based materials. Handing the raw texture to `scene.environment`
   * instead gives a mirror-sharp reflection at every roughness value, which
   * looks worse than no environment at all.
   */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromEquirectangular(source).texture;

  // The source and the generator have both done their job by this point; only
  // the prefiltered result needs to outlive this function.
  source.dispose();
  pmrem.dispose();

  return {
    texture,
    dispose: () => texture.dispose(),
  };
}
