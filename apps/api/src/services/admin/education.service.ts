import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import { toEducation, type EducationResponse } from '../serializers.js';
import { assertDateOrder, toDate, toDateOrNull } from './dates.js';
import type { createEducationSchema, updateEducationSchema } from '../../schemas/admin.schemas.js';

type CreateInput = z.infer<typeof createEducationSchema>;
type UpdateInput = z.infer<typeof updateEducationSchema>;

export async function create(input: CreateInput): Promise<EducationResponse> {
  const record = await prisma.education.create({
    data: {
      ...input,
      startDate: toDate(input.startDate),
      endDate: toDateOrNull(input.endDate),
    },
  });

  return toEducation(record);
}

export async function update(id: string, input: UpdateInput): Promise<EducationResponse> {
  const stored = await prisma.education.findUnique({
    where: { id },
    select: { startDate: true, endDate: true },
  });

  if (!stored) throw notFound('That education record no longer exists.');

  assertDateOrder(input, stored);

  const record = await prisma.education.update({
    where: { id },
    data: {
      ...input,
      ...(input.startDate ? { startDate: toDate(input.startDate) } : {}),
      ...(input.endDate !== undefined ? { endDate: toDateOrNull(input.endDate) } : {}),
    },
  });

  return toEducation(record);
}

export async function remove(id: string): Promise<void> {
  const found = await prisma.education.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw notFound('That education record no longer exists.');

  await prisma.education.delete({ where: { id } });
}
