import type { RequestHandler } from 'express';
import { MessageStatus } from '@prisma/client';
import { sendSuccess } from '../lib/envelope.js';
import * as contact from '../services/contact.service.js';
import { MIN_DWELL_MS, type ContactInput } from '../schemas/contact.schemas.js';

/**
 * POST /contact — public.
 *
 * Bot heuristics fail silently: a scripted submitter gets the same 201 a person
 * gets, and is never told why nothing was stored (C6). Genuine validation
 * failures return actionable field errors, and those are handled upstream by
 * the validate middleware.
 */
export const submit: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as ContactInput;

    const looksAutomated =
      (body.company ?? '') !== '' || (body.dwellMs !== undefined && body.dwellMs < MIN_DWELL_MS);

    if (looksAutomated) {
      contact.recordDiscardedSubmission(
        res.locals.requestId,
        body.company ? 'honeypot filled' : 'submitted too quickly',
      );
      // Success is simulated. Giving no signal is the entire point.
      sendSuccess(res, { received: true }, 201);
      return;
    }

    await contact.submitMessage({
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
    });

    sendSuccess(res, { received: true }, 201);
  } catch (error) {
    next(error);
  }
};

// --- Admin inbox ------------------------------------------------------------

export const listMessages: RequestHandler = async (req, res, next) => {
  try {
    const { status } = req.query as { status?: MessageStatus };
    sendSuccess(res, await contact.listMessages(status ? { status } : {}));
  } catch (error) {
    next(error);
  }
};

export const countUnread: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, { unread: await contact.countUnread() });
  } catch (error) {
    next(error);
  }
};

export const updateMessage: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: MessageStatus };

    sendSuccess(res, await contact.setStatus(id, status));
  } catch (error) {
    next(error);
  }
};

export const deleteMessage: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await contact.remove(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
