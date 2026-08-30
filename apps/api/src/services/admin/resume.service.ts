import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { notFound, validationFailed } from '../../lib/errors.js';
import { toResume, type ResumeResponse } from '../serializers.js';
import type { createResumeSchema, updateResumeSchema } from '../../schemas/admin.schemas.js';

type CreateInput = z.infer<typeof createResumeSchema>;
type UpdateInput = z.infer<typeof updateResumeSchema>;

/** Admin listing shows every version; the public route serves only the active one. */
export async function list(): Promise<ResumeResponse[]> {
  const versions = await prisma.resumeVersion.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });

  return versions.map(toResume);
}

/**
 * "Exactly one active at a time" is enforced here rather than by a constraint
 * (D3.1). A partial unique index could enforce at most one, but not the
 * swap — deactivating the old and activating the new has to be atomic, or a
 * failure between the two leaves the public resume page empty.
 */
export async function create(input: CreateInput): Promise<ResumeResponse> {
  const version = await prisma.$transaction(async (tx) => {
    if (input.isActive) {
      await tx.resumeVersion.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }

    return tx.resumeVersion.create({ data: input });
  });

  return toResume(version);
}

export async function update(id: string, input: UpdateInput): Promise<ResumeResponse> {
  const stored = await prisma.resumeVersion.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!stored) throw notFound('That resume version no longer exists.');

  // Deactivating the only active version would leave the public page with
  // nothing to serve. Activating a different one is the way to switch.
  if (stored.isActive && input.isActive === false) {
    throw validationFailed({
      isActive: 'Activate another version instead — one must always be active.',
    });
  }

  const version = await prisma.$transaction(async (tx) => {
    if (input.isActive) {
      await tx.resumeVersion.updateMany({
        where: { isActive: true, NOT: { id } },
        data: { isActive: false },
      });
    }

    return tx.resumeVersion.update({ where: { id }, data: input });
  });

  return toResume(version);
}

export async function remove(id: string): Promise<void> {
  const stored = await prisma.resumeVersion.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!stored) throw notFound('That resume version no longer exists.');

  if (stored.isActive) {
    throw validationFailed({
      isActive: 'This is the active version. Activate another one before deleting it.',
    });
  }

  await prisma.resumeVersion.delete({ where: { id } });
}
