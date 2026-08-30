import { useState } from 'react';
import { InputField } from '@/components/Field';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/toast/ToastContext';
import { useAsync } from '@/lib/useAsync';
import { getCertifications } from '@/lib/content';
import * as admin from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { formatFullDate } from '@/lib/format';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AdminHeader, EntityRow, FormActions, FormPanel } from '../components/AdminPanels';
import { useEntityForm } from '../components/useEntityForm';
import type { Certification } from '@/types/content';

interface CertificationValues extends Record<string, unknown> {
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
  credentialId: string;
}

const EMPTY: CertificationValues = {
  title: '',
  issuer: '',
  issueDate: '',
  credentialUrl: '',
  credentialId: '',
};

export function CertificationsAdminPage() {
  const certifications = useAsync(() => getCertifications(), []);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  useDocumentMeta({ title: 'Certifications · Admin', description: 'Manage certifications.' });

  const closeForm = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleDelete = async (certification: Certification) => {
    try {
      await admin.deleteCertification(certification.id);
      toast.success('Certification deleted.');
      certifications.retry();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete that entry.');
    }
  };

  return (
    <>
      <AdminHeader
        title="Certifications"
        description="Listed most recent first. The credential URL is shown as a verify link."
        action={
          !isCreating &&
          !editing && <Button onClick={() => setIsCreating(true)}>Add certification</Button>
        }
      />

      {(isCreating || editing) && (
        <CertificationForm
          key={editing?.id ?? 'new'}
          certification={editing}
          onCancel={closeForm}
          onSaved={() => {
            closeForm();
            certifications.retry();
          }}
        />
      )}

      <AsyncSection
        isLoading={certifications.isLoading}
        error={certifications.error}
        data={certifications.data}
        onRetry={certifications.retry}
        skeleton={<SkeletonRows count={3} />}
        empty={
          <EmptyState title="No certifications yet" description="Add your first certification." />
        }
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((certification) => (
              <li key={certification.id}>
                <EntityRow
                  title={certification.title}
                  subtitle={certification.issuer}
                  meta={
                    <>
                      <Badge>{formatFullDate(certification.issueDate)}</Badge>
                      {certification.credentialUrl && <Badge tone="accent">Verifiable</Badge>}
                    </>
                  }
                  deleteLabel="this certification"
                  onEdit={() => {
                    setIsCreating(false);
                    setEditing(certification);
                  }}
                  onDelete={() => void handleDelete(certification)}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}

function CertificationForm({
  certification,
  onCancel,
  onSaved,
}: {
  certification: Certification | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const initial: CertificationValues = certification
    ? {
        title: certification.title,
        issuer: certification.issuer,
        issueDate: certification.issueDate,
        credentialUrl: certification.credentialUrl ?? '',
        credentialId: certification.credentialId ?? '',
      }
    : EMPTY;

  const { values, setField, errors, isSubmitting, handleSubmit } =
    useEntityForm<CertificationValues>({
      initial,
      successMessage: certification ? 'Certification updated.' : 'Certification added.',
      onSaved,
      submit: (v) => {
        const body = {
          title: v.title,
          issuer: v.issuer,
          issueDate: v.issueDate,
          credentialUrl: v.credentialUrl || null,
          credentialId: v.credentialId || null,
        };
        return certification
          ? admin.updateCertification(certification.id, body)
          : admin.createCertification(body);
      },
    });

  return (
    <FormPanel
      title={certification ? `Edit ${certification.title}` : 'New certification'}
      onCancel={onCancel}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Title"
            value={values.title}
            error={errors.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          <InputField
            label="Issuer"
            value={values.issuer}
            error={errors.issuer}
            onChange={(e) => setField('issuer', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Issue date"
            type="date"
            value={values.issueDate}
            error={errors.issueDate}
            onChange={(e) => setField('issueDate', e.target.value)}
          />
          <InputField
            label="Credential URL"
            hint="Optional"
            value={values.credentialUrl}
            error={errors.credentialUrl}
            onChange={(e) => setField('credentialUrl', e.target.value)}
          />
          <InputField
            label="Credential ID"
            hint="Optional"
            value={values.credentialId}
            error={errors.credentialId}
            onChange={(e) => setField('credentialId', e.target.value)}
          />
        </div>

        <FormActions isSubmitting={isSubmitting} formError={errors._} />
      </form>
    </FormPanel>
  );
}
