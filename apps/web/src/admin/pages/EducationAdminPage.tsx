import { useState } from 'react';
import { InputField, TextareaField } from '@/components/Field';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/toast/ToastContext';
import { useAsync } from '@/lib/useAsync';
import { getEducation } from '@/lib/content';
import * as admin from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { formatDateRange } from '@/lib/format';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AdminHeader, EntityRow, FormActions, FormPanel } from '../components/AdminPanels';
import { useEntityForm } from '../components/useEntityForm';
import type { Education } from '@/types/content';

interface EducationValues extends Record<string, unknown> {
  institution: string;
  qualification: string;
  field: string;
  startDate: string;
  endDate: string;
  summary: string;
}

const EMPTY: EducationValues = {
  institution: '',
  qualification: '',
  field: '',
  startDate: '',
  endDate: '',
  summary: '',
};

export function EducationAdminPage() {
  const education = useAsync(() => getEducation(), []);
  const [editing, setEditing] = useState<Education | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  useDocumentMeta({ title: 'Education · Admin', description: 'Manage education records.' });

  const closeForm = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleDelete = async (record: Education) => {
    try {
      await admin.deleteEducation(record.id);
      toast.success('Record deleted.');
      education.retry();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete that record.');
    }
  };

  return (
    <>
      <AdminHeader
        title="Education"
        description="Shown in reverse-chronological order on the public site."
        action={
          !isCreating && !editing && <Button onClick={() => setIsCreating(true)}>Add record</Button>
        }
      />

      {(isCreating || editing) && (
        <EducationForm
          key={editing?.id ?? 'new'}
          record={editing}
          onCancel={closeForm}
          onSaved={() => {
            closeForm();
            education.retry();
          }}
        />
      )}

      <AsyncSection
        isLoading={education.isLoading}
        error={education.error}
        data={education.data}
        onRetry={education.retry}
        skeleton={<SkeletonRows count={2} />}
        empty={<EmptyState title="No records yet" description="Add your first qualification." />}
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((record) => (
              <li key={record.id}>
                <EntityRow
                  title={record.qualification}
                  subtitle={`${record.field} · ${record.institution}`}
                  meta={<Badge>{formatDateRange(record.startDate, record.endDate)}</Badge>}
                  deleteLabel="this record"
                  onEdit={() => {
                    setIsCreating(false);
                    setEditing(record);
                  }}
                  onDelete={() => void handleDelete(record)}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}

function EducationForm({
  record,
  onCancel,
  onSaved,
}: {
  record: Education | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const initial: EducationValues = record
    ? {
        institution: record.institution,
        qualification: record.qualification,
        field: record.field,
        startDate: record.startDate,
        endDate: record.endDate ?? '',
        summary: record.summary,
      }
    : EMPTY;

  const { values, setField, errors, isSubmitting, handleSubmit } = useEntityForm<EducationValues>({
    initial,
    successMessage: record ? 'Record updated.' : 'Record added.',
    onSaved,
    submit: (v) => {
      const body = {
        institution: v.institution,
        qualification: v.qualification,
        field: v.field,
        startDate: v.startDate,
        endDate: v.endDate || null,
        summary: v.summary,
      };
      return record ? admin.updateEducation(record.id, body) : admin.createEducation(body);
    },
  });

  return (
    <FormPanel title={record ? `Edit ${record.qualification}` : 'New record'} onCancel={onCancel}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Qualification"
            value={values.qualification}
            error={errors.qualification}
            onChange={(e) => setField('qualification', e.target.value)}
          />
          <InputField
            label="Field of study"
            value={values.field}
            error={errors.field}
            onChange={(e) => setField('field', e.target.value)}
          />
        </div>

        <InputField
          label="Institution"
          value={values.institution}
          error={errors.institution}
          onChange={(e) => setField('institution', e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
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
            hint="Leave empty if ongoing"
            value={values.endDate}
            error={errors.endDate}
            onChange={(e) => setField('endDate', e.target.value)}
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
