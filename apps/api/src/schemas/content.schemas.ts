import { z } from 'zod';

/**
 * Query-parameter schemas for the public list routes (D4.2).
 *
 * These run through the same `validate` middleware as any body: an unknown or
 * malformed parameter is rejected with a field error map rather than being
 * silently ignored, which is what makes a typo in a client visible.
 */

/** '', 'true' and '1' all read as true; anything else is false. */
const booleanish = z
  .enum(['true', 'false', '1', '0', ''])
  .transform((value) => value === 'true' || value === '1' || value === '')
  .optional();

export const projectQuerySchema = z
  .object({
    featured: booleanish,
    // Bounded: an unbounded LIKE term is a needless load on the database.
    q: z.string().trim().min(1).max(100).optional(),
    skill: z.uuid('Not a valid skill identifier.').optional(),
  })
  .strict();

export type ProjectQuery = z.infer<typeof projectQuerySchema>;

export const projectSlugSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      // Matches how slugs are generated: lowercase, digits and single hyphens.
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Not a valid project address.'),
  })
  .strict();

export const skillQuerySchema = z
  .object({
    category: z.string().trim().min(1).max(60).optional(),
  })
  .strict();
