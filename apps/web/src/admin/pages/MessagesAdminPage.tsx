import { useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/toast/ToastContext';
import { useAsync } from '@/lib/useAsync';
import * as admin from '@/lib/adminApi';
import type { Message, MessageStatus } from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { cn } from '@/lib/cn';
import { AdminHeader } from '../components/AdminPanels';

const FILTERS: Array<{ value: MessageStatus | 'ALL'; label: string }> = [
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'ALL', label: 'All' },
];

export function MessagesAdminPage() {
  const [filter, setFilter] = useState<MessageStatus | 'ALL'>('UNREAD');
  const messages = useAsync(
    () => admin.listMessages(filter === 'ALL' ? undefined : filter),
    [filter],
  );
  const toast = useToast();

  useDocumentMeta({ title: 'Messages · Admin', description: 'Contact inbox.' });

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
      messages.retry();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'That did not work.');
    }
  };

  return (
    <>
      <AdminHeader
        title="Messages"
        description="Submissions from the public contact form. Nothing is emailed — this is the inbox."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === option.value
                ? 'border-transparent bg-accent text-accent-fg'
                : 'border-border bg-surface text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <AsyncSection
        isLoading={messages.isLoading}
        error={messages.error}
        data={messages.data}
        onRetry={messages.retry}
        skeleton={<SkeletonRows count={3} />}
        empty={
          <EmptyState
            title={filter === 'UNREAD' ? 'No unread messages' : 'Nothing here'}
            description="Messages sent through the public contact form appear here."
          />
        }
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((message) => (
              <li key={message.id}>
                <MessageCard
                  message={message}
                  onSetStatus={(status) =>
                    void run(
                      () => admin.setMessageStatus(message.id, status),
                      status === 'ARCHIVED' ? 'Message archived.' : 'Message updated.',
                    )
                  }
                  onDelete={() =>
                    void run(() => admin.deleteMessage(message.id), 'Message deleted.')
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}

function MessageCard({
  message,
  onSetStatus,
  onDelete,
}: {
  message: Message;
  onSetStatus: (status: MessageStatus) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(message.status === 'UNREAD');

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{message.subject}</p>
          <p className="mt-0.5 text-sm text-muted">
            {message.name} ·{' '}
            <a
              href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {message.email}
            </a>
          </p>
          <p className="mt-1 text-xs text-subtle">
            {new Date(message.createdAt).toLocaleString('en-GB')}
          </p>
        </div>

        {message.status === 'UNREAD' && <Badge tone="accent">Unread</Badge>}
        {message.status === 'ARCHIVED' && <Badge>Archived</Badge>}
      </div>

      {expanded && (
        // Rendered as plain text. React escapes it, and no markup is
        // interpreted anywhere in this inbox (C6).
        <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted">
          {message.message}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded((open) => !open)}>
          {expanded ? 'Collapse' : 'Read'}
        </Button>

        {message.status !== 'READ' && (
          <Button variant="secondary" size="sm" onClick={() => onSetStatus('READ')}>
            Mark read
          </Button>
        )}
        {message.status !== 'ARCHIVED' && (
          <Button variant="secondary" size="sm" onClick={() => onSetStatus('ARCHIVED')}>
            Archive
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
