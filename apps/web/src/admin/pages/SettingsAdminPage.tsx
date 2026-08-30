import { InputField, TextareaField } from '@/components/Field';
import { Button } from '@/components/Button';
import { AsyncSection } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useAsync } from '@/lib/useAsync';
import { getSettings } from '@/lib/content';
import * as admin from '@/lib/adminApi';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AdminHeader, FormActions, FormPanel } from '../components/AdminPanels';
import { useEntityForm } from '../components/useEntityForm';
import type { SiteSettings, SocialLink } from '@/types/content';

interface SettingsValues extends Record<string, unknown> {
  siteTitle: string;
  tagline: string;
  bio: string;
  emailPublic: string;
  location: string;
  socialLinks: SocialLink[];
}

export function SettingsAdminPage() {
  const settings = useAsync(() => getSettings(), []);

  useDocumentMeta({ title: 'Settings · Admin', description: 'Manage site settings.' });

  return (
    <>
      <AdminHeader
        title="Settings"
        description="Your name, tagline and bio, shown across the public site."
      />

      <AsyncSection
        isLoading={settings.isLoading}
        error={settings.error}
        data={settings.data}
        onRetry={settings.retry}
        skeleton={<SkeletonRows count={2} />}
        empty={null}
      >
        {(current) => <SettingsForm settings={current} onSaved={settings.retry} />}
      </AsyncSection>
    </>
  );
}

function SettingsForm({ settings, onSaved }: { settings: SiteSettings; onSaved: () => void }) {
  const { values, setField, errors, isSubmitting, handleSubmit } = useEntityForm<SettingsValues>({
    initial: {
      siteTitle: settings.siteTitle,
      tagline: settings.tagline,
      bio: settings.bio,
      emailPublic: settings.emailPublic,
      location: settings.location,
      socialLinks: settings.socialLinks,
    },
    successMessage: 'Settings saved.',
    onSaved,
    submit: (v) =>
      admin.updateSettings({
        siteTitle: v.siteTitle,
        tagline: v.tagline,
        bio: v.bio,
        emailPublic: v.emailPublic || null,
        location: v.location,
        // Blank rows are dropped rather than rejected — an empty row is how
        // someone abandons a link they started adding.
        socialLinks: v.socialLinks.filter((link) => link.label.trim() && link.url.trim()),
      }),
  });

  const updateLink = (index: number, patch: Partial<SocialLink>) => {
    setField(
      'socialLinks',
      values.socialLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  };

  return (
    <FormPanel title="Site settings">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Site title"
            hint="Your name, shown in the header"
            value={values.siteTitle}
            error={errors.siteTitle}
            onChange={(e) => setField('siteTitle', e.target.value)}
          />
          <InputField
            label="Tagline"
            value={values.tagline}
            error={errors.tagline}
            onChange={(e) => setField('tagline', e.target.value)}
          />
        </div>

        <TextareaField
          label="Bio"
          rows={8}
          hint="Separate paragraphs with a blank line"
          value={values.bio}
          error={errors.bio}
          onChange={(e) => setField('bio', e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Public email"
            type="email"
            value={values.emailPublic}
            error={errors.emailPublic}
            onChange={(e) => setField('emailPublic', e.target.value)}
          />
          <InputField
            label="Location"
            value={values.location}
            error={errors.location}
            onChange={(e) => setField('location', e.target.value)}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text">Social links</legend>

          <ul className="space-y-3">
            {values.socialLinks.map((link, index) => (
              <li key={index} className="flex flex-wrap items-end gap-3">
                <div className="w-36">
                  <InputField
                    label="Label"
                    value={link.label}
                    onChange={(e) => updateLink(index, { label: e.target.value })}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <InputField
                    label="URL"
                    value={link.url}
                    onChange={(e) => updateLink(index, { url: e.target.value })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setField(
                      'socialLinks',
                      values.socialLinks.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>

          {errors.socialLinks && <p className="mt-2 text-xs text-danger">{errors.socialLinks}</p>}

          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setField('socialLinks', [...values.socialLinks, { label: '', url: '' }])}
          >
            Add link
          </Button>
        </fieldset>

        <FormActions isSubmitting={isSubmitting} submitLabel="Save settings" formError={errors._} />
      </form>
    </FormPanel>
  );
}
