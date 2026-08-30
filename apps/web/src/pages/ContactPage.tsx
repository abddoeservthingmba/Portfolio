import { useReveal } from '@/lib/useReveal';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { ContactForm } from '@/features/contact/ContactForm';

export function ContactPage() {
  const settings = useSiteSettings();

  // Rescan for reveal targets once the async content has rendered.
  useReveal([settings]);

  useDocumentMeta({
    title: 'Contact',
    description: 'Send a message, or reach out directly by email.',
  });

  return (
    <>
      <PageHeader
        title="Contact"
        description="Send a message below, or email directly — whichever is easier."
      />

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5 sm:p-6">
          <ContactForm />
        </Card>

        <aside className="space-y-4">
          {settings && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-text">Direct</h2>

              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Email</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${settings.emailPublic}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      {settings.emailPublic}
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Location</dt>
                  <dd className="mt-0.5 text-muted">{settings.location}</dd>
                </div>
              </dl>

              {settings.socialLinks.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
                  {settings.socialLinks.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
