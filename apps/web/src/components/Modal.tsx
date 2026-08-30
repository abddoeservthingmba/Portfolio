import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * A dialog built on the native <dialog> element, which supplies focus trapping,
 * the top layer and Escape-to-close without a focus-management library.
 *
 * The public site does not use this yet — it is here because Phase 4's admin
 * portal needs delete confirmations, and a primitive introduced under the
 * public surface's accessibility bar stays honest.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      // Backdrop clicks land on the dialog element itself, not its contents.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-0 text-text backdrop:bg-black/50"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="px-5 py-4 text-sm text-muted">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>
      )}
    </dialog>
  );
}
