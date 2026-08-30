import { useState } from 'react';
import { CheckboxField, InputField } from '@/components/Field';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/toast/ToastContext';
import { useAsync } from '@/lib/useAsync';
import * as admin from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { formatFullDate } from '@/lib/format';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AdminHeader, EntityRow, FormActions, FormPanel } from '../components/AdminPanels';
import { useEntityForm } from '../components/useEntityForm';
import type { ResumeVersion } from '@/types/content';

interface ResumeValues extends Record<string, unknown> {
  title: string;
  storagePath: string;
  isActive: boolean;
}

export function ResumeAdminPage() {
  const versions = useAsync(() => admin.listResume(), []);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  useDocumentMeta({ title: 'Resume · Admin', description: 'Manage resume versions.' });

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
      versions.retry();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'That did not work.');
    }
  };

  return (
    <>
      <AdminHeader
        title="Resume"
        description="Every version is kept; exactly one is active and served publicly."
        action={!isCreating && <Button onClick={() => setIsCreating(true)}>Add version</Button>}
      />

      <Card className="mb-6 border-dashed p-4">
        <p className="text-sm text-muted">
          <strong className="text-text">File uploads arrive in Phase 5.</strong> For now a version
          records a storage path — once uploads exist, this page will take the file directly.
        </p>
      </Card>

      {isCreating && (
        <ResumeForm
          onCancel={() => setIsCreating(false)}
          onSaved={() => {
            setIsCreating(false);
            versions.retry();
          }}
        />
      )}

      <AsyncSection
        isLoading={versions.isLoading}
        error={versions.error}
        data={versions.data}
        onRetry={versions.retry}
        skeleton={<SkeletonRows count={2} />}
        empty={
          <EmptyState
            title="No resume versions yet"
            description="Add one and it becomes the version the public resume page serves."
          />
        }
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((version) => (
              <li key={version.id}>
                <ResumeRow
                  version={version}
                  onActivate={() =>
                    void run(
                      () => admin.updateResume(version.id, { isActive: true }),
                      `${version.title} is now the active resume.`,
                    )
                  }
                  onDelete={() =>
                    void run(() => admin.deleteResume(version.id), 'Version deleted.')
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

/**
 * The active version cannot be edited into inactivity or deleted — the public
 * page must always have something to serve, so switching means activating a
 * different one.
 */
function ResumeRow({
  version,
  onActivate,
  onDelete,
}: {
  version: ResumeVersion;
  onActivate: () => void;
  onDelete: () => void;
}) {
  if (version.isActive) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{version.title}</p>
          <p className="mt-0.5 text-xs text-subtle">Added {formatFullDate(version.createdAt)}</p>
        </div>
        <Badge tone="accent">Active — served publicly</Badge>
      </Card>
    );
  }

  return (
    <EntityRow
      title={version.title}
      subtitle={`Added ${formatFullDate(version.createdAt)}`}
      meta={
        <Button variant="secondary" size="sm" onClick={onActivate}>
          Make active
        </Button>
      }
      deleteLabel="this version"
      onEdit={onActivate}
      onDelete={onDelete}
    />
  );
}

function ResumeForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const { values, setField, errors, isSubmitting, handleSubmit } = useEntityForm<ResumeValues>({
    initial: { title: '', storagePath: '', isActive: true },
    successMessage: 'Resume version added.',
    onSaved,
    submit: (v) =>
      admin.createResume({
        title: v.title,
        storagePath: v.storagePath,
        isActive: v.isActive,
      }),
  });

  return (
    <FormPanel title="New resume version" onCancel={onCancel}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Title"
            hint="e.g. Resume — 2026"
            value={values.title}
            error={errors.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          <InputField
            label="Storage path"
            hint="Path in the resume bucket, or a full URL"
            value={values.storagePath}
            error={errors.storagePath}
            onChange={(e) => setField('storagePath', e.target.value)}
          />
        </div>

        <CheckboxField
          label="Make this the active version"
          hint="The previously active version is deactivated"
          checked={values.isActive}
          onChange={(e) => setField('isActive', e.target.checked)}
        />

        <FormActions isSubmitting={isSubmitting} formError={errors._} />
      </form>
    </FormPanel>
  );
}
