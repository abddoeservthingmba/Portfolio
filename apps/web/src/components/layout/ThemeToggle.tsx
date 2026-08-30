import { useTheme, type Theme } from '@/lib/useTheme';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ value: Theme; label: string; symbol: string }> = [
  { value: 'light', label: 'Light theme', symbol: '☀' },
  { value: 'system', label: 'Match system theme', symbol: '◐' },
  { value: 'dark', label: 'Dark theme', symbol: '☾' },
];

/**
 * Three explicit states rather than a two-way switch, because 'follow the
 * system' is a real preference and a toggle cannot express it (FR-12).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-control border border-border bg-surface p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => setTheme(option.value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
            theme === option.value ? 'bg-accent-subtle text-accent' : 'text-subtle hover:text-text',
          )}
        >
          <span aria-hidden="true">{option.symbol}</span>
        </button>
      ))}
    </div>
  );
}
