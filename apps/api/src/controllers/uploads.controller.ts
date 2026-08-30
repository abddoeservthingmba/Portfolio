import type { RequestHandler } from 'express';
import multer from 'multer';
import { sendSuccess } from '../lib/envelope.js';
import { AppError, ErrorCode } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import {
  ASSET_KINDS,
  removeOrphan,
  uploadAsset,
  uploadLimits,
  type AssetKind,
} from '../services/admin/uploads.service.js';

/**
 * Multipart handling for POST /admin/uploads.
 *
 * Memory storage, not disk: files are capped small, and never touching the
 * filesystem removes a whole class of path-handling mistakes. The cap here is
 * the outer boundary — the per-entity ceiling is enforced in the service.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
    files: 1,
    // Only `kind` and `previousPath` are expected alongside the file.
    fields: 4,
  },
});

/** Parses one file from field `file`, translating multer's errors to our own. */
export const receiveFile: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(ErrorCode.PAYLOAD_TOO_LARGE, 'That file is too large.'));
        return;
      }
      next(new AppError(ErrorCode.BAD_REQUEST, 'That upload could not be read.'));
      return;
    }

    next(error);
  });
};

export const uploadFile: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'No file was attached.');
    }

    const kind = (req.body as { kind?: string }).kind;

    if (!kind || !ASSET_KINDS.includes(kind as AssetKind)) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        `Unknown upload kind. Expected one of: ${ASSET_KINDS.join(', ')}.`,
      );
    }

    const result = await uploadAsset(kind as AssetKind, file.buffer, file.mimetype);

    logger.info('asset uploaded', {
      requestId: res.locals.requestId,
      actor: res.locals.actor?.email ?? res.locals.actor?.authUserId,
      kind: result.kind,
      bytes: result.bytes,
      contentType: result.contentType,
    });

    // The previous object is removed only after the new one is committed, so a
    // failure leaves a stale file rather than a broken reference (C5).
    const previousPath = (req.body as { previousPath?: string }).previousPath;
    if (previousPath && previousPath !== result.path) {
      await removeOrphan(kind as AssetKind, previousPath);
    }

    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/** Lets the admin UI pre-check a file and explain the limits before uploading. */
export const getUploadLimits: RequestHandler = (_req, res) => {
  sendSuccess(res, uploadLimits());
};
