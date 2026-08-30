import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { conflict, notFound } from '../../lib/errors.js';
import { toSkill, type SkillResponse } from '../serializers.js';
import type { createSkillSchema, updateSkillSchema } from '../../schemas/admin.schemas.js';

type CreateInput = z.infer<typeof createSkillSchema>;
type UpdateInput = z.infer<typeof updateSkillSchema>;

export async function create(input: CreateInput): Promise<SkillResponse> {
  try {
    return toSkill(await prisma.skill.create({ data: input }));
  } catch (error) {
    throw translate(error, input.name);
  }
}

export async function update(id: string, input: UpdateInput): Promise<SkillResponse> {
  await ensureExists(id);

  try {
    return toSkill(await prisma.skill.update({ where: { id }, data: input }));
  } catch (error) {
    throw translate(error, input.name);
  }
}

/**
 * Deleting a skill removes it from every project that used it — the join rows
 * cascade. The projects themselves are untouched.
 */
export async function remove(id: string): Promise<void> {
  await ensureExists(id);
  await prisma.skill.delete({ where: { id } });
}

async function ensureExists(id: string): Promise<void> {
  const found = await prisma.skill.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw notFound('That skill no longer exists.');
}

function translate(error: unknown, name: string | undefined): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return conflict('That skill already exists.', {
      name: name ? `“${name}” is already in the list.` : 'Already in use.',
    });
  }

  return error instanceof Error ? error : new Error('Write failed.');
}
