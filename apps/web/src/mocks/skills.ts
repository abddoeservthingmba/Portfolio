import type { Skill } from '@/types/content';

/**
 * PHASE 2 MOCK DATA — deleted, not bypassed, at the Phase 3 exit gate (M3).
 */
export const mockSkills: Skill[] = [
  { id: 'sk-1', name: 'TypeScript', category: 'Languages', icon: null, proficiency: 5 },
  { id: 'sk-2', name: 'JavaScript', category: 'Languages', icon: null, proficiency: 5 },
  { id: 'sk-3', name: 'SQL', category: 'Languages', icon: null, proficiency: 4 },
  { id: 'sk-4', name: 'Python', category: 'Languages', icon: null, proficiency: 3 },

  { id: 'sk-5', name: 'React', category: 'Frontend', icon: null, proficiency: 5 },
  { id: 'sk-6', name: 'Vite', category: 'Frontend', icon: null, proficiency: 4 },
  { id: 'sk-7', name: 'Tailwind CSS', category: 'Frontend', icon: null, proficiency: 4 },
  { id: 'sk-8', name: 'React Router', category: 'Frontend', icon: null, proficiency: 4 },

  { id: 'sk-9', name: 'Node.js', category: 'Backend', icon: null, proficiency: 5 },
  { id: 'sk-10', name: 'Express', category: 'Backend', icon: null, proficiency: 4 },
  { id: 'sk-11', name: 'Prisma', category: 'Backend', icon: null, proficiency: 4 },
  { id: 'sk-12', name: 'Zod', category: 'Backend', icon: null, proficiency: 4 },

  { id: 'sk-13', name: 'PostgreSQL', category: 'Data', icon: null, proficiency: 4 },
  { id: 'sk-14', name: 'Supabase', category: 'Data', icon: null, proficiency: 3 },

  { id: 'sk-15', name: 'GitHub Actions', category: 'Delivery', icon: null, proficiency: 4 },
  { id: 'sk-16', name: 'Netlify', category: 'Delivery', icon: null, proficiency: 3 },
  { id: 'sk-17', name: 'Render', category: 'Delivery', icon: null, proficiency: 3 },
  { id: 'sk-18', name: 'Vitest', category: 'Delivery', icon: null, proficiency: 4 },

  // No proficiency set — the public page must handle a null gracefully.
  { id: 'sk-19', name: 'Docker', category: 'Delivery', icon: null, proficiency: null },
];

const byId = new Map(mockSkills.map((skill) => [skill.id, skill]));

/** Small helper so project fixtures reference skills rather than duplicating them. */
export function skillsByIds(ids: string[]): Skill[] {
  return ids.map((id) => byId.get(id)).filter((skill): skill is Skill => skill !== undefined);
}
