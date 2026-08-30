import { useState } from 'react';
import { InputField, TextareaField } from '@/components/Field';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/toast/ToastContext';
import { useAsync } from '@/lib/useAsync';
import { getExperience } from '@/lib/content';
import * as admin from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { formatDateRange } from '@/lib/format';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AdminHeader, EntityRow, FormActions, FormPanel } from '../components/AdminPanels';
import { useEntityForm } from '../components/useEntityForm';
import type { Experience } from '@/types/content';

interface ExperienceValues extends Record<string, unknown> {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  summary: string;
  displayOrder: string;
}

const EMPTY: ExperienceValues = {
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  summary: '',
  displayOrder: '0',
};

export function ExperienceAdminPage() {
  const experience = useAsync(() => getExperience(), []);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  useDocumentMeta({ title: 'Experience · Admin', description: 'Manage work experience.' });

  const closeForm = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleDelete = async (entry: Experience) => {
    try {
      await admin.deleteExperience(entry.id);
      toast.success('Role deleted.');
      experience.retry();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete that role.');
    }
  };

  return (
    <>
      <AdminHeader
        title="Experience"
        description="Leave the end date empty for your current role. Display order controls the sequence."
        action={
          !isCreating && !editing && <Button onClick={() => setIsCreating(true)}>Add role</Button>
        }
      />

      {(isCreating || editing) && (
        <ExperienceForm
          key={editing?.id ?? 'new'}
          entry={editing}
          onCancel={closeForm}
          onSaved={() => {
            closeForm();
            experience.retry();
          }}
        />
      )}

      <AsyncSection
        isLoading={experience.isLoading}
        error={experience.error}
        data={experience.data}
        onRetry={experience.retry}
        skeleton={<SkeletonRows count={3} />}
        empty={<EmptyState title="No roles yet" description="Add your first role." />}
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((entry) => (
              <li key={entry.id}>
                <EntityRow
                  title={entry.role}
                  subtitle={entry.company}
                  meta={
                    <>
                      <Badge>{formatDateRange(entry.startDate, entry.endDate)}</Badge>
                      {entry.endDate === null && <Badge tone="accent">Current</Badge>}
                    </>
                  }
                  deleteLabel="this role"
                  onEdit={() => {
                    setIsCreating(false);
                    setEditing(entry);
                  }}
                  onDelete={() => void handleDelete(entry)}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}

function ExperienceForm({
  entry,
  onCancel,
  onSaved,
}: {
  entry: Experience | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const initial: ExperienceValues = entry
    ? {
        company: entry.company,
        role: entry.role,
        startDate: entry.startDate,
        endDate: entry.endDate ?? '',
        summary: entry.summary,
        displayOrder: String(entry.displayOrder),
      }
    : EMPTY;

  const { values, setField, errors, isSubmitting, handleSubmit } = useEntityForm<ExperienceValues>({
    initial,
    successMessage: entry ? 'Role updated.' : 'Role added.',
    onSaved,
    submit: (v) => {
      const body = {
        company: v.company,
        role: v.role,
        startDate: v.startDate,
        // An empty end date is how a current role is recorded.
        endDate: v.endDate || null,
        summary: v.summary,
        displayOrder: Number(v.displayOrder) || 0,
      };
      return entry ? admin.updateExperience(entry.id, body) : admin.createExperience(body);
    },
  });

  return (
    <FormPanel title={entry ? `Edit ${entry.role}` : 'New role'} onCancel={onCancel}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Role"
            value={values.role}
            error={errors.role}
            onChange={(e) => setField('role', e.target.value)}
          />
          <InputField
            label="Company"
            value={values.company}
            error={errors.company}
            onChange={(e) => setField('company', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Start date"
            type="date"
            value={values.startDate}
            error={errors.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
          />
          <InputField
            label="End date"
            type="date"
            hint="Leave empty if current"
            value={values.endDate}
            error={errors.endDate}
            onChange={(e) => setField('endDate', e.target.value)}
          />
          <InputField
            label="Display order"
            type="number"
            min={0}
            value={values.displayOrder}
            error={errors.displayOrder}
            onChange={(e) => setField('displayOrder', e.target.value)}
          />
        </div>

        <TextareaField
          label="Summary"
          rows={4}
          value={values.summary}
          error={errors.summary}
          onChange={(e) => setField('summary', e.target.value)}
        />

        <FormActions isSubmitting={isSubmitting} formError={errors._} />
      </form>
    </FormPanel>
  );
}
