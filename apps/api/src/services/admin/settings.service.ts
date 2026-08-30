import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { toSettings, type SettingsResponse } from '../serializers.js';
import type { updateSettingsSchema } from '../../schemas/admin.schemas.js';

type UpdateInput = z.infer<typeof updateSettingsSchema>;

/**
 * Settings is a singleton row, so there is no create or delete — only an
 * update that creates the row on first use.
 *
 * The site must have settings, so an unseeded database gets a row rather than
 * a 404 the admin cannot resolve through the UI.
 */
export async function update(input: UpdateInput): Promise<SettingsResponse> {
  const existing = await prisma.siteSettings.findFirst({ select: { id: true } });

  const data = {
    ...input,
    // Prisma's Json column will not take undefined; omit the key instead.
    ...(input.socialLinks ? { socialLinks: input.socialLinks } : {}),
  };

  const settings = existing
    ? await prisma.siteSettings.update({ where: { id: existing.id }, data })
    : await prisma.siteSettings.create({
        data: { siteTitle: input.siteTitle ?? 'Portfolio', ...data },
      });

  return toSettings(settings);
}
