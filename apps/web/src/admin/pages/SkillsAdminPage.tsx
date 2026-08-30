import { useState } from 'react';
import { InputField, SelectField } from '@/components/Field';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/toast/ToastContext';
import { useAsync } from '@/lib/useAsync';
import { getSkills } from '@/lib/content';
import * as admin from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AdminHeader, EntityRow, FormActions, FormPanel } from '../components/AdminPanels';
import { useEntityForm } from '../components/useEntityForm';
import type { Skill } from '@/types/content';

interface SkillValues extends Record<string, unknown> {
  name: string;
  category: string;
  proficiency: string;
}

const EMPTY: SkillValues = { name: '', category: '', proficiency: '' };

const PROFICIENCY_OPTIONS = [
  { value: '', label: 'Not set' },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} of 5` })),
];

export function SkillsAdminPage() {
  const skills = useAsync(() => getSkills(), []);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  useDocumentMeta({ title: 'Skills · Admin', description: 'Manage skills.' });

  const closeForm = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleDelete = async (skill: Skill) => {
    try {
      await admin.deleteSkill(skill.id);
      toast.success(`Deleted ${skill.name}.`);
      skills.retry();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete that skill.');
    }
  };

  return (
    <>
      <AdminHeader
        title="Skills"
        description="Grouped on the public site by category. Proficiency is optional."
        action={
          !isCreating && !editing && <Button onClick={() => setIsCreating(true)}>Add skill</Button>
        }
      />

      {(isCreating || editing) && (
        <SkillForm
          key={editing?.id ?? 'new'}
          skill={editing}
          onCancel={closeForm}
          onSaved={() => {
            closeForm();
            skills.retry();
          }}
        />
      )}

      <AsyncSection
        isLoading={skills.isLoading}
        error={skills.error}
        data={skills.data}
        onRetry={skills.retry}
        skeleton={<SkeletonRows count={4} />}
        empty={
          <EmptyState
            title="No skills yet"
            description="Add your first skill and it will appear on the public skills page."
          />
        }
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((skill) => (
              <li key={skill.id}>
                <EntityRow
                  title={skill.name}
                  subtitle={skill.category}
                  meta={
                    skill.proficiency ? <Badge>{skill.proficiency} of 5</Badge> : <Badge>—</Badge>
                  }
                  deleteLabel="this skill"
                  onEdit={() => {
                    setIsCreating(false);
                    setEditing(skill);
                  }}
                  onDelete={() => void handleDelete(skill)}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}

function SkillForm({
  skill,
  onCancel,
  onSaved,
}: {
  skill: Skill | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const initial: SkillValues = skill
    ? {
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency ? String(skill.proficiency) : '',
      }
    : EMPTY;

  const { values, setField, errors, isSubmitting, handleSubmit } = useEntityForm<SkillValues>({
    initial,
    successMessage: skill ? 'Skill updated.' : 'Skill added.',
    onSaved,
    submit: (v) => {
      const body = {
        name: v.name,
        category: v.category,
        // An empty select means "no proficiency", which the API stores as null.
        proficiency: v.proficiency ? Number(v.proficiency) : null,
      };
      return skill ? admin.updateSkill(skill.id, body) : admin.createSkill(body);
    },
  });

  return (
    <FormPanel title={skill ? `Edit ${skill.name}` : 'New skill'} onCancel={onCancel}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Name"
            value={values.name}
            error={errors.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          <InputField
            label="Category"
            hint="e.g. Frontend, Backend"
            value={values.category}
            error={errors.category}
            onChange={(e) => setField('category', e.target.value)}
          />
          <SelectField
            label="Proficiency"
            options={PROFICIENCY_OPTIONS}
            value={values.proficiency}
            error={errors.proficiency}
            onChange={(e) => setField('proficiency', e.target.value)}
          />
        </div>

        <FormActions isSubmitting={isSubmitting} formError={errors._} />
      </form>
    </FormPanel>
  );
}
