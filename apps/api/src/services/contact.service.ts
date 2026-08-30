import { MessageStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/**
 * The contact message path (C6).
 *
 * Messages are stored rather than emailed. That keeps the delivery path inside
 * the system where it can be tested, rate-limited and inspected — an outbound
 * mail integration adds a third-party credential, a deliverability problem, and
 * a failure mode that stays invisible until someone says they never got a reply.
 */

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface MessageResponse {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

function toMessage(row: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: Date;
}): MessageResponse {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

/**
 * Persists a submission.
 *
 * Content is stored as text exactly as sent and escaped at render time — React
 * escapes by default and the admin inbox interprets no markup. Sanitising on
 * the way in would silently corrupt a legitimate message that happens to
 * contain angle brackets, which is not unusual in a message about code.
 */
export async function submitMessage(submission: ContactSubmission): Promise<void> {
  await prisma.message.create({
    data: {
      name: submission.name,
      email: submission.email,
      subject: submission.subject,
      message: submission.message,
      status: MessageStatus.UNREAD,
    },
  });
}

/**
 * Records a submission that failed a bot heuristic, without storing it.
 *
 * The caller still returns success — a scripted submitter is never told why it
 * was rejected (C6) — but the event belongs in the log, because a rising count
 * here is the early warning for contact-form abuse.
 */
export function recordDiscardedSubmission(requestId: string, reason: string): void {
  logger.warn('contact submission discarded', { requestId, reason });
}

export interface MessageFilters {
  status?: MessageStatus;
}

export async function listMessages(filters: MessageFilters = {}): Promise<MessageResponse[]> {
  const messages = await prisma.message.findMany({
    ...(filters.status ? { where: { status: filters.status } } : {}),
    orderBy: { createdAt: 'desc' },
  });

  return messages.map(toMessage);
}

export async function countUnread(): Promise<number> {
  return prisma.message.count({ where: { status: MessageStatus.UNREAD } });
}

export async function setStatus(id: string, status: MessageStatus): Promise<MessageResponse> {
  const existing = await prisma.message.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound('That message no longer exists.');

  return toMessage(await prisma.message.update({ where: { id }, data: { status } }));
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.message.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound('That message no longer exists.');

  await prisma.message.delete({ where: { id } });
}
