import { Card } from '@/components/Card';
import type { Skill } from '@/types/content';

export function SkillCategory({ category, skills }: { category: string; skills: Skill[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">{category}</h2>

      <ul className="mt-4 space-y-3">
        {skills.map((skill) => (
          <li key={skill.id} className="flex items-center justify-between gap-4">
            <span className="text-sm text-text">{skill.name}</span>
            <ProficiencyMeter value={skill.proficiency} name={skill.name} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

const MAX_PROFICIENCY = 5;

/** Proficiency is optional (D3.1), so a null renders nothing rather than a zero. */
function ProficiencyMeter({ value, name }: { value: number | null; name: string }) {
  if (value === null) return null;

  return (
    <span
      role="img"
      aria-label={`${name}: ${value} out of ${MAX_PROFICIENCY}`}
      className="flex shrink-0 gap-1"
    >
      {Array.from({ length: MAX_PROFICIENCY }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={
            index < value ? 'h-1.5 w-4 rounded-full bg-accent' : 'h-1.5 w-4 rounded-full bg-border'
          }
        />
      ))}
    </span>
  );
}
