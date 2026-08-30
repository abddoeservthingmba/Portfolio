import { z } from 'zod';

/**
 * Write schemas for the admin routes. This parse is the authority; the client
 * mirrors it for feedback and is never trusted (C4, D5).
 *
 * Two conventions:
 *   - Create schemas require what the entity cannot exist without.
 *   - Update schemas are the same shape with every field optional, so a PATCH
 *     can carry one field, but must carry at least one.
 */

const uuid = z.uuid('Not a valid identifier.');

/** A URL field that accepts an empty string from a cleared form input. */
const optionalUrl = z
  .union([z.url('Enter a full URL, including https://'), z.literal('')])
  .nullish()
  .transform((value) => (value ? value : null));

const optionalText = (max: number) =>
  z
    .string()
    .max(max, `Please keep this under ${max} characters.`)
    .nullish()
    .transform((value) => value?.trim() || null);

/** YYYY-MM-DD. Calendar dates carry no time, so none is accepted. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker, or write the date as YYYY-MM-DD.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'That is not a real date.');

const optionalIsoDate = isoDate.nullish().transform((value) => value ?? null);

/** Rejects an update that would clear the record by carrying nothing. */
function atLeastOneField<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.refine((value) => Object.keys(value).length > 0, {
    message: 'Nothing to update.',
  });
}

const endDateMessage = {
  message: 'The end date cannot be before the start date.',
  path: ['endDate'] as PropertyKey[],
};

/**
 * Only checks when both dates are present — a PATCH may carry one of them, and
 * the pair is re-validated against the stored row in the service layer.
 */
function endsAfterItStarts(value: { startDate?: string; endDate?: string | null }): boolean {
  if (!value.startDate || !value.endDate) return true;
  return value.endDate >= value.startDate;
}

export const idParamSchema = z.object({ id: uuid }).strict();

// --- Projects ---------------------------------------------------------------

const projectFields = {
  title: z.string().trim().min(2, 'A title is required.').max(150),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and single hyphens — for example my-project.',
    ),
  shortDescription: optionalText(300),
  description: optionalText(20_000),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  repoUrl: optionalUrl,
  liveUrl: optionalUrl,
  imagePath: optionalText(500),
  featured: z.boolean(),
  /** Replaces the whole tag set — the join table is reconciled, not appended to. */
  skillIds: z.array(uuid).max(30).optional(),
};

export const createProjectSchema = z
  .object({
    ...projectFields,
    status: projectFields.status.default('DRAFT'),
    featured: projectFields.featured.default(false),
  })
  .strict();

export const updateProjectSchema = atLeastOneField(z.object(projectFields).partial().strict());

// --- Skills -----------------------------------------------------------------

const skillFields = {
  name: z.string().trim().min(1, 'A name is required.').max(80),
  category: z.string().trim().min(1, 'A category is required.').max(60),
  icon: optionalText(120),
  proficiency: z
    .number()
    .int()
    .min(1, 'Proficiency runs from 1 to 5.')
    .max(5, 'Proficiency runs from 1 to 5.')
    .nullish()
    .transform((value) => value ?? null),
};

export const createSkillSchema = z.object(skillFields).strict();
export const updateSkillSchema = atLeastOneField(z.object(skillFields).partial().strict());

// --- Experience -------------------------------------------------------------

const experienceFields = {
  company: z.string().trim().min(1, 'A company is required.').max(150),
  role: z.string().trim().min(1, 'A role is required.').max(150),
  startDate: isoDate,
  /** Null denotes a current role. */
  endDate: optionalIsoDate,
  summary: optionalText(4000),
  displayOrder: z.number().int().min(0).max(9999),
};

export const createExperienceSchema = z
  .object({ ...experienceFields, displayOrder: experienceFields.displayOrder.default(0) })
  .strict()
  .refine(endsAfterItStarts, endDateMessage);

export const updateExperienceSchema = atLeastOneField(
  z.object(experienceFields).partial().strict(),
).refine(endsAfterItStarts, endDateMessage);

// --- Certifications ---------------------------------------------------------

const certificationFields = {
  title: z.string().trim().min(1, 'A title is required.').max(200),
  issuer: z.string().trim().min(1, 'An issuer is required.').max(150),
  issueDate: isoDate,
  credentialUrl: optionalUrl,
  credentialId: optionalText(120),
  imagePath: optionalText(500),
};

export const createCertificationSchema = z.object(certificationFields).strict();
export const updateCertificationSchema = atLeastOneField(
  z.object(certificationFields).partial().strict(),
);

// --- Education --------------------------------------------------------------

const educationFields = {
  institution: z.string().trim().min(1, 'An institution is required.').max(200),
  qualification: z.string().trim().min(1, 'A qualification is required.').max(200),
  field: z.string().trim().min(1, 'A field of study is required.').max(200),
  startDate: isoDate,
  endDate: optionalIsoDate,
  summary: optionalText(4000),
};

export const createEducationSchema = z
  .object(educationFields)
  .strict()
  .refine(endsAfterItStarts, endDateMessage);

export const updateEducationSchema = atLeastOneField(
  z.object(educationFields).partial().strict(),
).refine(endsAfterItStarts, endDateMessage);

// --- Resume -----------------------------------------------------------------

export const createResumeSchema = z
  .object({
    title: z.string().trim().min(1, 'A title is required.').max(150),
    storagePath: z.string().trim().min(1, 'A file is required.').max(500),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updateResumeSchema = atLeastOneField(
  z
    .object({
      title: z.string().trim().min(1).max(150),
      isActive: z.boolean(),
    })
    .partial()
    .strict(),
);

// --- Settings ---------------------------------------------------------------

export const updateSettingsSchema = atLeastOneField(
  z
    .object({
      siteTitle: z.string().trim().min(1, 'A site title is required.').max(120),
      tagline: optionalText(200),
      bio: optionalText(8000),
      emailPublic: z
        .union([z.email('Enter a valid email address.'), z.literal('')])
        .nullish()
        .transform((value) => (value ? value : null)),
      location: optionalText(120),
      socialLinks: z
        .array(
          z
            .object({
              label: z.string().trim().min(1, 'A label is required.').max(40),
              url: z.url('Enter a full URL, including https://'),
            })
            .strict(),
        )
        .max(10, 'Ten links is plenty.'),
    })
    .partial()
    .strict(),
);
