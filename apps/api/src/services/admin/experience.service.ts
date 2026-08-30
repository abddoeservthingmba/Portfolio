import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import { toExperience, type ExperienceResponse } from '../serializers.js';
import { assertDateOrder, toDate, toDateOrNull } from './dates.js';
import type {
  createExperienceSchema,
  updateExperienceSchema,
} from '../../schemas/admin.schemas.js';

type CreateInput = z.infer<typeof createExperienceSchema>;
type UpdateInput = z.infer<typeof updateExperienceSchema>;

export async function create(input: CreateInput): Promise<ExperienceResponse> {
  const entry = await prisma.experience.create({
    data: {
      ...input,
      startDate: toDate(input.startDate),
      endDate: toDateOrNull(input.endDate),
    },
  });

  return toExperience(entry);
}

export async function update(id: string, input: UpdateInput): Promise<ExperienceResponse> {
  const stored = await prisma.experience.findUnique({
    where: { id },
    select: { startDate: true, endDate: true },
  });

  if (!stored) throw notFound('That role no longer exists.');

  // The schema can only compare the two dates when both are in the payload.
  assertDateOrder(input, stored);

  const entry = await prisma.experience.update({
    where: { id },
    data: {
      ...input,
      ...(input.startDate ? { startDate: toDate(input.startDate) } : {}),
      ...(input.endDate !== undefined ? { endDate: toDateOrNull(input.endDate) } : {}),
    },
  });

  return toExperience(entry);
}

export async function remove(id: string): Promise<void> {
  const found = await prisma.experience.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw notFound('That role no longer exists.');

  await prisma.experience.delete({ where: { id } });
}
