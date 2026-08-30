import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { conflict, notFound } from '../../lib/errors.js';
import { toProject, type ProjectResponse } from '../serializers.js';
import type { createProjectSchema, updateProjectSchema } from '../../schemas/admin.schemas.js';

type CreateInput = z.infer<typeof createProjectSchema>;
type UpdateInput = z.infer<typeof updateProjectSchema>;

const withSkills = {
  skills: { include: { skill: true }, orderBy: { skill: { name: 'asc' } } },
} as const;

/** Admin listing shows every status, unlike the public read. */
export async function list(): Promise<ProjectResponse[]> {
  const projects = await prisma.project.findMany({
    include: withSkills,
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
  });

  return projects.map(toProject);
}

export async function getById(id: string): Promise<ProjectResponse> {
  const project = await prisma.project.findUnique({ where: { id }, include: withSkills });
  if (!project) throw notFound('That project no longer exists.');

  return toProject(project);
}

export async function create(input: CreateInput): Promise<ProjectResponse> {
  const { skillIds = [], ...fields } = input;

  try {
    const project = await prisma.project.create({
      data: {
        ...fields,
        skills: { create: skillIds.map((skillId) => ({ skillId })) },
      },
      include: withSkills,
    });

    return toProject(project);
  } catch (error) {
    throw translateWriteError(error, fields.slug);
  }
}

/**
 * Updates the row and reconciles its tags in one transaction.
 *
 * A partial success would leave the project's technology tags wrong with no
 * error shown, which is precisely the failure the transaction exists to
 * prevent (C4).
 */
export async function update(id: string, input: UpdateInput): Promise<ProjectResponse> {
  const { skillIds, ...fields } = input;

  await ensureExists(id);

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(fields).length > 0) {
        await tx.project.update({ where: { id }, data: fields });
      }

      // Undefined means "leave the tags alone"; an array replaces them wholesale.
      if (skillIds) {
        await tx.projectSkill.deleteMany({ where: { projectId: id } });
        await tx.projectSkill.createMany({
          data: skillIds.map((skillId) => ({ projectId: id, skillId })),
        });
      }
    });
  } catch (error) {
    throw translateWriteError(error, fields.slug);
  }

  return getById(id);
}

export async function remove(id: string): Promise<void> {
  await ensureExists(id);
  // project_skills rows go with it — the relation declares onDelete: Cascade.
  await prisma.project.delete({ where: { id } });
}

async function ensureExists(id: string): Promise<void> {
  const found = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw notFound('That project no longer exists.');
}

/**
 * Turns Prisma's constraint errors into the API's own vocabulary.
 *
 * The unique constraint on slug is what actually holds under a concurrent
 * write — checking first and then inserting has a race between the two.
 */
function translateWriteError(error: unknown, slug: string | null | undefined): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return conflict('That web address is already used by another project.', {
        slug: slug ? `“${slug}” is already taken.` : 'Already in use.',
      });
    }

    // A skill id that does not exist — the form sent a stale option.
    if (error.code === 'P2003' || error.code === 'P2025') {
      return conflict('One of the selected skills no longer exists.', {
        skillIds: 'Refresh the page and choose again.',
      });
    }
  }

  return error instanceof Error ? error : new Error('Write failed.');
}
