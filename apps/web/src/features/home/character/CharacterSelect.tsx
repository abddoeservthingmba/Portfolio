import { CharacterSprite } from './CharacterSprite';
import { CHARACTERS, type CharacterId } from './characters';
import { cn } from '@/lib/cn';

/**
 * Choose your fighter.
 *
 * A radio group, not a row of divs with click handlers. Picking a character is
 * a single choice from a fixed set, which is what radios are, and it buys
 * arrow-key navigation and screen reader semantics without writing either.
 *
 * The input is visually hidden rather than removed, so focus still lands on it
 * and `:focus-visible` on the label draws the ring.
 */
export function CharacterSelect({
  value,
  onChange,
}: {
  value: CharacterId;
  onChange: (id: CharacterId) => void;
}) {
  return (
    <fieldset className="fighter-select">
      <legend className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-subtle">
        Choose your fighter
      </legend>

      <div className="flex flex-wrap gap-2.5">
        {CHARACTERS.map((character) => {
          const selected = character.id === value;

          return (
            <label
              key={character.id}
              data-selected={selected}
              className={cn(
                'fighter-option group relative flex cursor-pointer flex-col items-center gap-1 rounded-card border-2 border-border-strong px-3 pb-2 pt-3 transition-transform duration-300',
                selected ? 'bg-accent-2 text-accent-2-fg' : 'bg-surface text-text',
              )}
              style={{ '--aura': character.colors.aura } as React.CSSProperties}
            >
              <input
                type="radio"
                name="fighter"
                value={character.id}
                checked={selected}
                onChange={() => onChange(character.id)}
                className="sr-only"
              />

              <CharacterSprite characterId={character.id} className="fighter-option-svg" />

              <span className="text-[0.7rem] font-bold uppercase tracking-wide">
                {character.name}
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] opacity-70">
                {character.title}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
