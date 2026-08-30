import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import { AppError, ErrorCode } from '../../lib/errors.js';
import { BUCKET, resolveAssetUrl, type BucketName } from '../../lib/storage.js';
import { deleteObject, isStorageConfigured, uploadObject } from '../../lib/storageClient.js';
import { env } from '../../config/env.js';

/**
 * The asset upload path (C5).
 *
 * Uploads are the most common way untrusted input reaches persistent storage,
 * so every check here is server-side. The client's pre-check exists only to
 * avoid uploading a file that will obviously be rejected.
 */

/** What each kind of asset may be, and how large it may get. */
const RULES = {
  image: {
    bucket: BUCKET.images,
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    maxBytes: 3 * 1024 * 1024,
    label: 'an image',
  },
  certificate: {
    bucket: BUCKET.certificates,
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
    maxBytes: 5 * 1024 * 1024,
    label: 'a certificate image or PDF',
  },
  resume: {
    bucket: BUCKET.resume,
    mimes: ['application/pdf'],
    // A resume is a document, not a scan album.
    maxBytes: 5 * 1024 * 1024,
    label: 'a PDF',
  },
} as const;

export type AssetKind = keyof typeof RULES;

export const ASSET_KINDS = Object.keys(RULES) as AssetKind[];

export interface UploadResult {
  kind: AssetKind;
  /** The stored path. This is what goes in the database column. */
  path: string;
  /** Resolved public URL, so the admin can preview it immediately. */
  url: string | null;
  contentType: string;
  bytes: number;
}

export async function uploadAsset(
  kind: AssetKind,
  buffer: Buffer,
  declaredMime: string | undefined,
): Promise<UploadResult> {
  if (!isStorageConfigured()) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'File storage is not configured on this server yet.',
    );
  }

  const rule = RULES[kind];

  // Size is capped twice — once at the body parser, once per entity, because a
  // resume and an avatar have very different reasonable ceilings (C5).
  if (buffer.byteLength === 0) {
    throw new AppError(ErrorCode.BAD_REQUEST, 'That file is empty.');
  }

  if (buffer.byteLength > rule.maxBytes) {
    throw new AppError(
      ErrorCode.PAYLOAD_TOO_LARGE,
      `That file is larger than ${formatMb(rule.maxBytes)}.`,
    );
  }

  if (buffer.byteLength > env.MAX_UPLOAD_BYTES) {
    throw new AppError(ErrorCode.PAYLOAD_TOO_LARGE, 'That file is too large.');
  }

  // The declared content type is a hint. The server inspects the file itself
  // and rejects anything outside the allow-list for that entity (C5).
  const sniffed = await fileTypeFromBuffer(buffer);
  const actualMime = sniffed?.mime;

  if (!actualMime || !(rule.mimes as readonly string[]).includes(actualMime)) {
    throw new AppError(
      ErrorCode.UNSUPPORTED_MEDIA_TYPE,
      `That file is not ${rule.label}. Accepted here: ${rule.mimes.join(', ')}.`,
    );
  }

  // A mismatch between what was claimed and what the bytes actually are is not
  // fatal — browsers get this wrong routinely — but the sniffed type is what
  // gets stored and served.
  void declaredMime;

  // The filename is never trusted. The path is generated server-side from an
  // entity prefix, a fresh identifier and the extension the sniffer confirmed.
  const path = `${kind}/${randomUUID()}.${sniffed.ext}`;

  await uploadObject(rule.bucket, path, buffer, actualMime);

  return {
    kind,
    path,
    url: resolveAssetUrl(rule.bucket, path),
    contentType: actualMime,
    bytes: buffer.byteLength,
  };
}

/**
 * Removes the object a record used to point at, after the new path has been
 * committed — in that order, so a failure leaves a stale object rather than a
 * broken reference (C5).
 */
export async function removeOrphan(kind: AssetKind, previousPath: string | null): Promise<void> {
  if (!previousPath) return;

  await deleteObject(RULES[kind].bucket, previousPath);
}

export function bucketFor(kind: AssetKind): BucketName {
  return RULES[kind].bucket;
}

/** The limits, so the admin UI can pre-check and explain them. */
export const uploadLimits = () =>
  ASSET_KINDS.map((kind) => ({
    kind,
    accept: RULES[kind].mimes,
    maxBytes: Math.min(RULES[kind].maxBytes, env.MAX_UPLOAD_BYTES),
  }));

function formatMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
