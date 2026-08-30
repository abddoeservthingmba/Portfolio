import { useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-control border-2 bg-surface px-3.5 py-2.5 text-sm text-text ' +
  'placeholder:text-subtle transition-colors duration-300';

interface BaseProps {
  label: string;
  /** Server-side or client-side message for this field. Presence marks it invalid. */
  error?: string | undefined;
  hint?: string;
}

/**
 * Label, control, hint and error as one unit.
 *
 * Bundled deliberately: a labelled input with a wired-up error message is four
 * matching id references, and getting one wrong is an accessibility defect that
 * nothing visibly reports. Doing it once here is what makes it right everywhere.
 */
export function InputField({
  label,
  error,
  hint,
  className,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const { id, hintId, errorId, describedBy } = useFieldIds(hint, error);

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, error ? 'border-danger' : 'border-border', className)}
        {...rest}
      />
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  className,
  rows = 6,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, hintId, errorId, describedBy } = useFieldIds(hint, error);

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, 'resize-y', error ? 'border-danger' : 'border-border', className)}
        {...rest}
      />
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  options,
  ...rest
}: BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: Array<{ value: string; label: string }>;
  }) {
  const { id, hintId, errorId, describedBy } = useFieldIds(hint, error);

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, error ? 'border-danger' : 'border-border', className)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

/**
 * Checkbox, with the label beside the control rather than above it — the one
 * case where the stacked layout of the other fields reads wrong.
 */
export function CheckboxField({
  label,
  hint,
  className,
  ...rest
}: Omit<BaseProps, 'error'> & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        aria-describedby={hint ? hintId : undefined}
        className={cn('mt-0.5 h-4 w-4 rounded border-border accent-[var(--accent)]', className)}
        {...rest}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
        {hint && (
          <p id={hintId} className="text-xs text-subtle">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function useFieldIds(hint: string | undefined, error: string | undefined) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Order matters: assistive technology reads the error before the hint.
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return { id, hintId, errorId, describedBy };
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-text">
      {children}
    </label>
  );
}

function FieldMessages({
  hint,
  hintId,
  error,
  errorId,
}: {
  hint?: string;
  hintId: string;
  error?: string | undefined;
  errorId: string;
}) {
  return (
    <>
      {hint && !error && (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </>
  );
}
