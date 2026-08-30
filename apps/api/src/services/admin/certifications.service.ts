import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import { toCertification, type CertificationResponse } from '../serializers.js';
import { toDate } from './dates.js';
import type {
  createCertificationSchema,
  updateCertificationSchema,
} from '../../schemas/admin.schemas.js';

type CreateInput = z.infer<typeof createCertificationSchema>;
type UpdateInput = z.infer<typeof updateCertificationSchema>;

export async function create(input: CreateInput): Promise<CertificationResponse> {
  const certification = await prisma.certification.create({
    data: { ...input, issueDate: toDate(input.issueDate) },
  });

  return toCertification(certification);
}

export async function update(id: string, input: UpdateInput): Promise<CertificationResponse> {
  await ensureExists(id);

  const certification = await prisma.certification.update({
    where: { id },
    data: {
      ...input,
      ...(input.issueDate ? { issueDate: toDate(input.issueDate) } : {}),
    },
  });

  return toCertification(certification);
}

export async function remove(id: string): Promise<void> {
  await ensureExists(id);
  await prisma.certification.delete({ where: { id } });
}

async function ensureExists(id: string): Promise<void> {
  const found = await prisma.certification.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw notFound('That certification no longer exists.');
}
