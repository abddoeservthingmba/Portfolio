/**
 * Publishes a resume PDF: uploads it to the resume bucket and records the
 * version in the database as the active one.
 *
 * The admin portal is the normal way to do this. This script exists for the
 * first version — the one that has to be in place before there is a portal to
 * sign into — and for replacing the resume from a checkout without a browser.
 *
 * Run: pnpm --filter @portfolio-cms/api resume:publish
 *      pnpm --filter @portfolio-cms/api resume:publish -- ./other.pdf --title "Resume, May 2027"
 *
 * Idempotent. The object path is derived from the file name rather than
 * generated, so re-running replaces the same object and updates the same row
 * instead of accumulating a version per run.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const { BUCKET, resolveAssetUrl } = await import('../src/lib/storage.js');
const { isStorageConfigured, uploadObject } = await import('../src/lib/storageClient.js');

/** The resume committed to the repository, used when no path is given. */
const DEFAULT_FILE = fileURLToPath(
  new URL('../assets/resume/sulthan-abdullah-khan-resume-2026-09-10.pdf', import.meta.url),
);
// Matches the naming already in the database, since the title is what the
// public page prints as the card's heading. --title overrides it.
const DEFAULT_TITLE = 'Sulthan_Abdullah_Khan_Resume_10-Sep-2026';

// Matches the resume rule in uploads.service.ts. A resume is a document, not a
// scan album, and the column that holds the title is capped at 150.
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TITLE = 150;

function fail(message: string, fix?: string): never {
  console.error(`\n  FAILED  ${message}`);
  if (fix) console.error(`  FIX     ${fix}`);
  console.error('');
  process.exit(1);
}

interface Args {
  file: string;
  title: string;
}

/**
 * A positional path and an optional --title. When a file is given without a
 * title, the title comes from the file name — a wrong-but-editable title beats
 * silently labelling a new file with the default one.
 */
function parseArgs(argv: string[]): Args {
  const rest: string[] = [];
  let title: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--') {
      // pnpm forwards the separator itself; it is not an argument.
      continue;
    } else if (arg === '--title') {
      title = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--title=')) {
      title = arg.slice('--title='.length);
    } else if (arg.startsWith('-')) {
      fail(`Unknown option: ${arg}`, 'Usage: resume:publish -- [file.pdf] [--title "…"]');
    } else {
      rest.push(arg);
    }
  }

  const file = rest[0] ? resolve(rest[0]) : DEFAULT_FILE;
  const resolvedTitle = (title ?? (rest[0] ? titleFromFilename(file) : DEFAULT_TITLE)).trim();

  if (!resolvedTitle) fail('The title is empty.');
  if (resolvedTitle.length > MAX_TITLE) {
    fail(`The title is longer than ${MAX_TITLE} characters.`);
  }

  return { file, title: resolvedTitle };
}

function titleFromFilename(file: string): string {
  return basename(file)
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const { file, title } = parseArgs(process.argv.slice(2));

  if (!existsSync(file)) fail(`No file at ${file}`);

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

  const buffer = readFileSync(file);

  if (buffer.byteLength === 0) fail('That file is empty.');
  if (buffer.byteLength > MAX_BYTES) {
    fail(`That file is larger than ${Math.round(MAX_BYTES / (1024 * 1024))} MB.`);
  }

  // The extension is a claim. The bytes decide, exactly as they do on the
  // upload route — the public page links straight at this object.
  const sniffed = await fileTypeFromBuffer(buffer);
  if (sniffed?.mime !== 'application/pdf') {
    fail(`That file is not a PDF (looks like ${sniffed?.mime ?? 'an unknown type'}).`);
  }

  // Deterministic, so a re-run replaces rather than accumulates. Uploads made
  // through the portal use a generated name instead; both live under resume/.
  const storagePath = `resume/${basename(file)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')}`;

  console.log('\nPublishing resume…\n');
  console.log(`  file     ${file}`);
  console.log(`  title    ${title}`);
  console.log(`  path     ${storagePath}`);

  await uploadObject(BUCKET.resume, storagePath, buffer, sniffed.mime);
  console.log('  upload   done');

  const prisma = new PrismaClient();

  try {
    // One transaction, so the swap cannot leave the public page with no active
    // version — the same rule the resume service enforces (D3.1).
    const version = await prisma.$transaction(async (tx) => {
      const existing = await tx.resumeVersion.findFirst({ where: { storagePath } });

      await tx.resumeVersion.updateMany({
        where: { isActive: true, ...(existing ? { NOT: { id: existing.id } } : {}) },
        data: { isActive: false },
      });

      return existing
        ? tx.resumeVersion.update({
            where: { id: existing.id },
            data: { title, isActive: true },
          })
        : tx.resumeVersion.create({ data: { title, storagePath, isActive: true } });
    });

    console.log(`  database ${version.id} (active)`);
    console.log(`\n  DONE  ${resolveAssetUrl(BUCKET.resume, version.storagePath)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`\n  FAILED  ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
