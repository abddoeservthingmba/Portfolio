import { useCallback, useEffect, useState } from 'react';
import { CHARACTERS, DEFAULT_CHARACTER, type CharacterId } from './characters';

/**
 * Which fighter the visitor picked, remembered between visits.
 *
 * Deliberately not React context. One component owns this and passes it to the
 * three that need it, which is a shorter path than a provider for a value that
 * lives on a single page.
 *
 * Reads are wrapped because storage throws outright in some privacy modes —
 * not "returns null", throws — and losing a cosmetic preference must never take
 * the page down with it.
 */

const STORAGE_KEY = 'portfolio:fighter';

function isCharacterId(value: string | null): value is CharacterId {
  return CHARACTERS.some((character) => character.id === value);
}

function read(): CharacterId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isCharacterId(stored) ? stored : DEFAULT_CHARACTER;
  } catch {
    return DEFAULT_CHARACTER;
  }
}

export function useCharacter() {
  // The default on the first render rather than the stored value, so the
  // server-rendered and client-rendered markup cannot disagree.
  const [characterId, setCharacterId] = useState<CharacterId>(DEFAULT_CHARACTER);

  useEffect(() => {
    setCharacterId(read());
  }, []);

  const choose = useCallback((next: CharacterId) => {
    setCharacterId(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A preference that cannot be saved is still a preference for this visit.
    }
  }, []);

  return { characterId, choose };
}
