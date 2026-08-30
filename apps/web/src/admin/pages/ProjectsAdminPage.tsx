import { useState } from 'react';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/Field';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/toast/ToastContext';
import { useAsync } from '@/lib/useAsync';
import * as admin from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { cn } from '@/lib/cn';
import { AdminHeader, EntityRow, FormActions, FormPanel } from '../components/AdminPanels';
import { useEntityForm } from '../components/useEntityForm';
import type { Project, Skill } from '@/types/content';

interface ProjectValues extends Record<string, unknown> {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: string;
  repoUrl: string;
  liveUrl: string;
  featured: boolean;
  skillIds: string[];
}

const EMPTY: ProjectValues = {
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  status: 'DRAFT',
  repoUrl: '',
  liveUrl: '',
  featured: false,
  skillIds: [],
};

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft — not on the public site' },
  { value: 'PUBLISHED', label: 'Published — visible publicly' },
  { value: 'ARCHIVED', label: 'Archived — hidden' },
];

export function ProjectsAdminPage() {
  // The admin list includes drafts and archived, which the public read excludes.
  const projects = useAsync(() => admin.listProjects(), []);
  const skills = useAsync(() => admin.getSkillOptions(), []);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  useDocumentMeta({ title: 'Projects · Admin', description: 'Manage projects.' });

  const closeForm = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleDelete = async (project: Project) => {
    try {
      await admin.deleteProject(project.id);
      toast.success(`Deleted ${project.title}.`);
      projects.retry();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete that project.');
    }
  };

  return (
    <>
      <AdminHeader
        title="Projects"
        description="Only published projects appear on the public site. Featured ones show on the home page."
        action={
          !isCreating &&
          !editing && <Button onClick={() => setIsCreating(true)}>Add project</Button>
        }
      />

      {(isCreating || editing) && (
        <ProjectForm
          key={editing?.id ?? 'new'}
          project={editing}
          skills={skills.data ?? []}
          onCancel={closeForm}
          onSaved={() => {
            closeForm();
            projects.retry();
          }}
        />
      )}

      <AsyncSection
        isLoading={projects.isLoading}
        error={projects.error}
        data={projects.data}
        onRetry={projects.retry}
        skeleton={<SkeletonRows count={4} />}
        empty={<EmptyState title="No projects yet" description="Add your first project." />}
      >
        {(list) => (
          <ul className="space-y-3">
            {list.map((project) => (
              <li key={project.id}>
                <EntityRow
                  title={project.title}
                  subtitle={project.shortDescription}
                  meta={
                    <>
                      <Badge tone={project.status === 'PUBLISHED' ? 'accent' : 'neutral'}>
                        {project.status.toLowerCase()}
                      </Badge>
                      {project.featured && <Badge tone="accent">featured</Badge>}
                      <Badge>/{project.slug}</Badge>
                      <Badge>
                        {project.skills.length} skill{project.skills.length === 1 ? '' : 's'}
                      </Badge>
                    </>
                  }
                  deleteLabel="this project"
                  onEdit={() => {
                    setIsCreating(false);
                    setEditing(project);
                  }}
                  onDelete={() => void handleDelete(project)}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}

function ProjectForm({
  project,
  skills,
  onCancel,
  onSaved,
}: {
  project: Project | null;
  skills: Skill[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const initial: ProjectValues = project
    ? {
        title: project.title,
        slug: project.slug,
        shortDescription: project.shortDescription,
        description: project.description,
        status: project.status,
        repoUrl: project.repoUrl ?? '',
        liveUrl: project.liveUrl ?? '',
        featured: project.featured,
        skillIds: project.skills.map((skill) => skill.id),
      }
    : EMPTY;

  const { values, setField, errors, isSubmitting, handleSubmit } = useEntityForm<ProjectValues>({
    initial,
    successMessage: project ? 'Project updated.' : 'Project created.',
    onSaved,
    submit: (v) => {
      const body = {
        title: v.title,
        slug: v.slug,
        shortDescription: v.shortDescription,
        description: v.description,
        status: v.status,
        repoUrl: v.repoUrl || null,
        liveUrl: v.liveUrl || null,
        featured: v.featured,
        skillIds: v.skillIds,
      };
      return project ? admin.updateProject(project.id, body) : admin.createProject(body);
    },
  });

  const toggleSkill = (skillId: string) => {
    setField(
      'skillIds',
      values.skillIds.includes(skillId)
        ? values.skillIds.filter((id) => id !== skillId)
        : [...values.skillIds, skillId],
    );
  };

  return (
    <FormPanel title={project ? `Edit ${project.title}` : 'New project'} onCancel={onCancel}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Title"
            value={values.title}
            error={errors.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          <InputField
            label="Web address (slug)"
            hint={project ? 'Changing this breaks existing links' : 'lowercase-with-hyphens'}
            value={values.slug}
            error={errors.slug}
            onChange={(e) => setField('slug', e.target.value)}
          />
        </div>

        {!project && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setField('slug', slugify(values.title))}
            disabled={!values.title}
          >
            Generate slug from title
          </Button>
        )}

        <TextareaField
          label="Short description"
          rows={2}
          hint="Shown on cards and in search results"
          value={values.shortDescription}
          error={errors.shortDescription}
          onChange={(e) => setField('shortDescription', e.target.value)}
        />

        <TextareaField
          label="Full description"
          rows={8}
          hint="Separate paragraphs with a blank line"
          value={values.description}
          error={errors.description}
          onChange={(e) => setField('description', e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Repository URL"
            hint="Optional"
            value={values.repoUrl}
            error={errors.repoUrl}
            onChange={(e) => setField('repoUrl', e.target.value)}
          />
          <InputField
            label="Live URL"
            hint="Optional"
            value={values.liveUrl}
            error={errors.liveUrl}
            onChange={(e) => setField('liveUrl', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <SelectField
            label="Status"
            options={STATUS_OPTIONS}
            value={values.status}
            error={errors.status}
            onChange={(e) => setField('status', e.target.value)}
          />
          <CheckboxField
            label="Feature on the home page"
            hint="Featured projects appear first"
            checked={values.featured}
            onChange={(e) => setField('featured', e.target.checked)}
          />
        </div>

        <SkillPicker
          skills={skills}
          selected={values.skillIds}
          onToggle={toggleSkill}
          error={errors.skillIds}
        />

        <FormActions
          isSubmitting={isSubmitting}
          submitLabel={project ? 'Save changes' : 'Create project'}
          formError={errors._}
        />
      </form>
    </FormPanel>
  );
}

function SkillPicker({
  skills,
  selected,
  onToggle,
  error,
}: {
  skills: Skill[];
  selected: string[];
  onToggle: (id: string) => void;
  error?: string | undefined;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-text">
        Technologies <span className="font-normal text-subtle">({selected.length} selected)</span>
      </legend>

      {skills.length === 0 ? (
        <p className="text-sm text-subtle">Add skills first and they will be selectable here.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => {
            const isSelected = selected.includes(skill.id);

            return (
              <li key={skill.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggle(skill.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    isSelected
                      ? 'border-transparent bg-accent text-accent-fg'
                      : 'border-border bg-surface text-muted hover:text-text',
                  )}
                >
                  {skill.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

/** Mirrors the slug rule the server enforces. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
