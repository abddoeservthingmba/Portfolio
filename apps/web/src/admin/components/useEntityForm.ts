import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/toast/ToastContext';

export type FieldErrors<T> = Partial<Record<keyof T | '_', string>>;

/**
 * Form state for one admin entity.
 *
 * The important part is what happens on failure: a 422 carries a field error
 * map, and those messages land on the fields they belong to. The server is the
 * authority on validity, so its answer is what the form displays — the client
 * does not duplicate the rules, it just renders the verdict.
 */
export function useEntityForm<T extends Record<string, unknown>>({
  initial,
  submit,
  onSaved,
  successMessage,
}: {
  initial: T;
  submit: (values: T) => Promise<unknown>;
  onSaved?: () => void;
  successMessage: string;
}) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    // Clear the error the moment the field is touched, so a corrected field
    // does not keep showing a stale complaint.
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, []);

  const reset = useCallback((next: T) => {
    setValues(next);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      setErrors({});
      setIsSubmitting(true);

      try {
        await submit(values);
        toast.success(successMessage);
        onSaved?.();
      } catch (error) {
        if (error instanceof ApiError && error.fields) {
          setErrors(error.fields as FieldErrors<T>);
          // The fields carry the detail; the toast just says it did not save.
          toast.error('Some fields need attention.');
        } else if (error instanceof ApiError) {
          // '_' carries a message about the form as a whole rather than a field.
          setErrors({ _: error.message } as FieldErrors<T>);
          toast.error(error.message);
        } else {
          toast.error('Could not save. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, submit, onSaved, successMessage, toast],
  );

  return { values, setField, setValues, errors, isSubmitting, handleSubmit, reset };
}
