import { env } from '../config/env.js';

/**
 * Buckets in Supabase Storage. Phase 5 creates and writes to these; Phase 3
 * only needs to read paths back out as URLs.
 */
export const BUCKET = {
  images: 'images',
  certificates: 'certificates',
  resume: 'resume',
} as const;

export type BucketName = (typeof BUCKET)[keyof typeof BUCKET];

/**
 * Resolves a stored path to a public URL at response time (C3).
 *
 * The database holds only the path, never a URL — so moving a bucket or
 * changing the project endpoint is a configuration change rather than a data
 * migration.
 *
 * Returns null when there is no asset, or when storage is not configured yet,
 * so a caller renders its no-image branch instead of a broken link.
 */
export function resolveAssetUrl(bucket: BucketName, path: string | null): string | null {
  if (!path || !env.SUPABASE_URL) return null;

  // Already absolute — a seed or an import may carry a full URL.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const encoded = path.split('/').map(encodeURIComponent).join('/');

  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}
