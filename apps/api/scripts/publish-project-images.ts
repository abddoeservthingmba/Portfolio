/**
 * Publishes project cover images: uploads the files committed at
 * `assets/projects/` to the images bucket, and points each project's
 * `image_path` at the object.
 *
 * The admin portal is the normal way to attach a cover. This script exists
 * because these particular covers are screenshots of the live projects and are
 * kept in version control alongside the code — so a rebuilt bucket, a new
 * Supabase project or a fresh environment can be brought back to the same state
 * without anyone hunting for the original PNGs.
 *
 * Run: pnpm --filter @portfolio-cms/api projects:images
 *
 * Idempotent. The object path is derived from the file name, so re-running
 * replaces the same object and rewrites the same column rather than
 * accumulating an orphan per run. A project whose slug is not in the database
 * is reported and skipped, not created — this script publishes assets, it does
 * not author content. Run `db:seed` first.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const { BUCKET, resolveAssetUrl } = await import('../src/lib/storage.js');
const { isStorageConfigured, uploadObject } = await import('../src/lib/storageClient.js');

/**
 * Which file covers which project. Listed explicitly rather than derived from a
 * directory scan, so adding a stray file to the folder cannot silently repoint
 * a project's cover, and so the mapping is reviewable in a diff.
 *
 * These slugs must match `prisma/seed.ts`, which sets the same paths.
 */
const COVERS = [
  { slug: 'ascension-training-log', file: 'ascension.webp' },
  { slug: 'audiophilic', file: 'audiophilic.webp' },
  { slug: 'portfolio-cms', file: 'portfolio-cms.webp' },
];

// Matches the image rule in uploads.service.ts.
const ALLOWED_MIMES = ['image/webp', 'image/png', 'image/jpeg', 'image/avif'];
const MAX_BYTES = 3 * 1024 * 1024;

function fail(message: string, fix?: string): never {
  console.error(`\n  FAILED  ${message}`);
  if (fix) console.error(`  FIX     ${fix}`);
  console.error('');
  process.exit(1);
}

async function main() {
  if (!isStorageConfigured()) {
    fail(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from apps/api/.env.',
      'Supabase -> Project Settings -> API Keys -> service_role. Server-side only.',
    );
  }

  if (!process.env.DATABASE_URL) {
    fail(
      'DATABASE_URL is missing from apps/api/.env.',
      'Supabase dashboard -> Connect -> ORMs tab -> Prisma.',
    );
  }

  console.log('\nPublishing project covers…\n');

  const prisma = new PrismaClient();
  let missing = 0;

  try {
    for (const { slug, file } of COVERS) {
      const path = fileURLToPath(new URL(`../assets/projects/${file}`, import.meta.url));
      if (!existsSync(path)) fail(`No file at ${path}`);

      const buffer = readFileSync(path);
      if (buffer.byteLength === 0) fail(`${file} is empty.`);
      if (buffer.byteLength > MAX_BYTES) {
        fail(`${file} is larger than ${Math.round(MAX_BYTES / (1024 * 1024))} MB.`);
      }

      // The extension is a claim; the bytes decide, as they do on the upload
      // route. The public site links straight at this object.
      const sniffed = await fileTypeFromBuffer(buffer);
      if (!sniffed || !ALLOWED_MIMES.includes(sniffed.mime)) {
        fail(`${file} is not an image (looks like ${sniffed?.mime ?? 'an unknown type'}).`);
      }

      const storagePath = `projects/${file}`;
      await uploadObject(BUCKET.images, storagePath, buffer, sniffed.mime);

      const updated = await prisma.project.updateMany({
        where: { slug },
        data: { imagePath: storagePath },
      });

      if (updated.count === 0) {
        missing += 1;
        console.log(`  ${slug.padEnd(24)} uploaded, but no such project — run db:seed`);
      } else {
        console.log(`  ${slug.padEnd(24)} ${resolveAssetUrl(BUCKET.images, storagePath)}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n  DONE  ${COVERS.length - missing} of ${COVERS.length} covers attached.\n`);
}

main().catch((error: unknown) => {
  console.error(`\n  FAILED  ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
