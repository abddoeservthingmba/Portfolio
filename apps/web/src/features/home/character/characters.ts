/**
 * The four fighters.
 *
 * These are original designs built on shonen archetypes — the straw-hat
 * brawler, the ninja, the martial artist, the swordsman. Archetypes are not
 * anyone's property; the specific characters that made them famous very much
 * are, and this is a public site under a real person's name. So the silhouettes
 * are drawn from scratch and the names are our own.
 *
 * Pure data, deliberately. Every colour here is a literal hex rather than a
 * design token, which is the one place in this codebase that is allowed: these
 * are character identities, not theme surfaces. They must look the same in
 * light mode and dark mode, the way a character does not change colour when the
 * lights go down.
 */

export interface Character {
  id: CharacterId;
  /** Shown in the picker. */
  name: string;
  /** The shonen epithet under the name. */
  title: string;
  colors: {
    hair: string;
    outfit: string;
    /** Trim, belts, sashes — the second colour in the silhouette. */
    accent: string;
    skin: string;
    /** Drives the aura and the speed lines that trail the cursor. */
    aura: string;
  };
}

export type CharacterId = 'brawler' | 'ninja' | 'martialist' | 'swordsman';

export const CHARACTERS: Character[] = [
  {
    id: 'brawler',
    name: 'Kai',
    title: 'The Straw Hat',
    colors: {
      hair: '#241c18',
      outfit: '#d8433a',
      accent: '#2f6fb7',
      skin: '#f0c39a',
      aura: '#e8b23c',
    },
  },
  {
    id: 'ninja',
    name: 'Ren',
    title: 'The Leaf Runner',
    colors: {
      hair: '#f2c14e',
      outfit: '#e8762c',
      accent: '#2b5c8a',
      skin: '#f2c9a3',
      aura: '#f2a03c',
    },
  },
  {
    id: 'martialist',
    name: 'Gou',
    title: 'The Skybreaker',
    colors: {
      hair: '#1b1720',
      outfit: '#ec7a26',
      accent: '#2f6fb7',
      skin: '#f0c39a',
      aura: '#7fd8f0',
    },
  },
  {
    id: 'swordsman',
    name: 'Kuro',
    title: 'The Black Blade',
    colors: {
      hair: '#e86a2c',
      outfit: '#1c1a22',
      accent: '#cfd4dc',
      skin: '#f0c39a',
      aura: '#8fa4ff',
    },
  },
];

export const DEFAULT_CHARACTER: CharacterId = 'brawler';

export function getCharacter(id: CharacterId): Character {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0]!;
}
