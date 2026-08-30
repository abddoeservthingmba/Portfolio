import type { ContactSubmission } from '@/types/content';

export type ContactErrors = Partial<Record<keyof ContactSubmission, string>>;

/** Length bounds mirroring the server-side Zod schema this stands in for (C6). */
export const LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  subject: { min: 3, max: 150 },
  message: { min: 20, max: 2000 },
} as const;

// Deliberately permissive. Anything stricter rejects valid addresses, and the
// server is the authority regardless of what this decides.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client-side validation, for immediate field-level feedback without a round
 * trip. It provides no security whatsoever and is never relied upon (C4) — the
 * server parse is the gate that decides.
 */
export function validateContact(values: ContactSubmission): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const subject = values.subject.trim();
  const message = values.message.trim();

  if (name.length < LIMITS.name.min) {
    errors.name = 'Please enter your name.';
  } else if (name.length > LIMITS.name.max) {
    errors.name = `Please keep this under ${LIMITS.name.max} characters.`;
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  } else if (email.length > LIMITS.email.max) {
    errors.email = 'That email address is too long.';
  }

  if (subject.length < LIMITS.subject.min) {
    errors.subject = 'Please add a short subject.';
  } else if (subject.length > LIMITS.subject.max) {
    errors.subject = `Please keep this under ${LIMITS.subject.max} characters.`;
  }

  if (message.length < LIMITS.message.min) {
    errors.message = `Please write at least ${LIMITS.message.min} characters.`;
  } else if (message.length > LIMITS.message.max) {
    errors.message = `Please keep this under ${LIMITS.message.max} characters.`;
  }

  return errors;
}
