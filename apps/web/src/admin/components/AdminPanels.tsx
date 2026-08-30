import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

/** The heading row every admin section opens with. */
export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/** A titled panel holding a form. */
export function FormPanel({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel?: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="mb-8 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
}

/** Save / cancel row, plus any error that belongs to the form as a whole. */
export function FormActions({
  isSubmitting,
  submitLabel = 'Save',
  formError,
}: {
  isSubmitting: boolean;
  submitLabel?: string;
  formError?: string | undefined;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
    </div>
  );
}

/** A row in an admin list, with edit and delete actions. */
export function EntityRow({
  title,
  subtitle,
  meta,
  onEdit,
  onDelete,
  deleteLabel,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>

      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
          Delete
        </Button>
      </div>

      {/* Deleting is irreversible and there is no undo, so it asks first. */}
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete ${deleteLabel}?`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setConfirming(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          <strong className="text-text">{title}</strong> will be removed permanently. This cannot be
          undone.
        </p>
      </Modal>
    </Card>
  );
}
