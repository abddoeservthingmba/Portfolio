import { z } from 'zod';

/**
 * The narrowest payload in the system (C6). The public contact endpoint is the
 * only route where an anonymous visitor causes a write, so it accepts exactly
 * four fields plus two bot heuristics, and nothing else.
 */
export const contactSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your name.').max(100),
    email: z.email('Please enter a valid email address.').max(254),
    subject: z.string().trim().min(3, 'Please add a short subject.').max(150),
    message: z
      .string()
      .trim()
      .min(20, 'Please write at least 20 characters.')
      .max(2000, 'Please keep this under 2000 characters.'),

    /**
     * Honeypot: a hidden field a human never fills. Optional, because a real
     * submission simply omits it — requiring it would invert the trap.
     */
    company: z.string().max(200).optional(),

    /**
     * Milliseconds the form was on screen before submission. Client-supplied
     * and therefore trivially forged, which is fine — it is a heuristic that
     * costs a bot one extra line to defeat, not a control.
     */
    dwellMs: z.coerce.number().int().min(0).max(86_400_000).optional(),
  })
  .strict();

export type ContactInput = z.infer<typeof contactSchema>;

/** Below this, the submission was almost certainly not typed by a person. */
export const MIN_DWELL_MS = 2000;

export const messageQuerySchema = z
  .object({
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
  })
  .strict();

export const messageStatusSchema = z
  .object({
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']),
  })
  .strict();
