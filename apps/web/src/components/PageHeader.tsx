/**
 * The heading block every public route opens with. One <h1> per page lives
 * here, which is what keeps the document outline correct without each page
 * having to remember.
 */
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8 border-b border-border pb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-prose text-sm text-muted">{description}</p>}
    </header>
  );
}

/** A section heading within a page — always an h2, never a styled div. */
export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight text-text">{title}</h2>
      {action}
    </div>
  );
}
