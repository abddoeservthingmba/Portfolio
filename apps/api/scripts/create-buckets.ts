/**
 * Creates the storage buckets the upload flow writes to.
 *
 * Buckets are public-read so the site can serve assets without signing every
 * URL, and write-by-key so only this API — holder of the service-role key —
 * can put anything in them.
 *
 * Run: pnpm --filter @portfolio-cms/api storage:init
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const { BUCKET } = await import('../src/lib/storage.js');
const { ensureBucket, isStorageConfigured } = await import('../src/lib/storageClient.js');

async function main() {
  if (!isStorageConfigured()) {
    console.error(
      '\n  FAILED  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from apps/api/.env.',
    );
    console.error(
      '  FIX     Supabase -> Project Settings -> API Keys -> service_role. Server-side only.\n',
    );
    process.exit(1);
  }

  console.log('\nCreating storage buckets…\n');

  for (const bucket of Object.values(BUCKET)) {
    const result = await ensureBucket(bucket);
    console.log(`  ${bucket.padEnd(14)} ${result}`);
  }

  console.log('\n  DONE  Uploads can now be stored.\n');
}

main().catch((error: unknown) => {
  console.error(`\n  FAILED  ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
