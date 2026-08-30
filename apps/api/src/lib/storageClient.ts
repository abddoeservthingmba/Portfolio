import { env } from '../config/env.js';
import { logger } from './logger.js';
import type { BucketName } from './storage.js';

/**
 * Talks to Supabase Storage using the service-role key.
 *
 * The key exists only in this process (D5, non-negotiable). Nothing here is
 * ever reachable from the browser — uploads go through the API precisely so
 * that the browser never holds a credential that could write to a bucket.
 *
 * Written against the REST endpoints directly rather than through the JS SDK:
 * three calls are needed, and a dependency that mostly duplicates fetch is not
 * worth the install.
 */

/**
 * Returns the storage configuration, or throws. Narrowing here rather than at
 * every call site keeps the non-null assertions out of the request path.
 */
function config(): { url: string; key: string } {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Storage is not configured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is unset.',
    );
  }

  return { url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_ROLE_KEY };
}

function headers(key: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

export const isStorageConfigured = () => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

/** Uploads a buffer, replacing anything already at that path. */
export async function uploadObject(
  bucket: BucketName,
  path: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const { url, key } = config();

  const response = await fetch(`${url}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: 'POST',
    headers: headers(key, {
      'Content-Type': contentType,
      // Generated paths are unique, so this only matters on a retry.
      'x-upsert': 'true',
    }),
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Storage upload failed (${response.status}): ${detail.slice(0, 200)}`);
  }
}

/**
 * Deletes an object. Never throws.
 *
 * This is only ever called to clean up an orphan after a new asset has already
 * been committed. Failing here leaves a stale file, which costs a little
 * storage; throwing would fail a request whose real work already succeeded.
 */
export async function deleteObject(bucket: BucketName, path: string): Promise<void> {
  if (!path || !isStorageConfigured()) return;

  try {
    const { url, key } = config();
    const response = await fetch(`${url}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
      method: 'DELETE',
      headers: headers(key),
    });

    if (!response.ok) {
      logger.warn('orphaned object not removed', { bucket, path, status: response.status });
    }
  } catch (error) {
    logger.warn('orphaned object not removed', {
      bucket,
      path,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Creates the bucket if it is missing. Buckets are public-read, write-by-key. */
export async function ensureBucket(bucket: BucketName): Promise<'created' | 'exists'> {
  const { url, key } = config();

  const existing = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers: headers(key) });
  if (existing.ok) return 'exists';

  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: headers(key, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      // Read is public so the site can serve assets without signing every URL.
      // Writing still requires the service-role key, which only this API holds.
      public: true,
    }),
  });

  if (!created.ok) {
    const detail = await created.text().catch(() => '');
    throw new Error(
      `Could not create bucket "${bucket}" (${created.status}): ${detail.slice(0, 200)}`,
    );
  }

  return 'created';
}
