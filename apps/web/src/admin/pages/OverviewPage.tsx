import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Skeleton } from '@/components/Skeleton';
import { useAsync } from '@/lib/useAsync';
import * as admin from '@/lib/adminApi';
import { getCertifications, getEducation, getExperience, getSkills } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AdminHeader } from '../components/AdminPanels';
import { useAuth } from '../auth/AuthContext';

/**
 * What is in the system, and where to go next. Counts only — anything more and
 * the admin starts outgrowing the site it manages (D12).
 */
export function OverviewPage() {
  const { email } = useAuth();

  const projects = useAsync(() => admin.listProjects(), []);
  const skills = useAsync(() => getSkills(), []);
  const experience = useAsync(() => getExperience(), []);
  const certifications = useAsync(() => getCertifications(), []);
  const education = useAsync(() => getEducation(), []);

  useDocumentMeta({ title: 'Overview · Admin', description: 'Admin overview.' });

  const published = projects.data?.filter((p) => p.status === 'PUBLISHED').length ?? 0;
  const drafts = projects.data?.filter((p) => p.status === 'DRAFT').length ?? 0;

  const cards = [
    {
      to: '/admin/projects',
      label: 'Projects',
      count: projects.data?.length,
      isLoading: projects.isLoading,
      note: projects.data ? `${published} published · ${drafts} draft` : undefined,
    },
    {
      to: '/admin/skills',
      label: 'Skills',
      count: skills.data?.length,
      isLoading: skills.isLoading,
    },
    {
      to: '/admin/experience',
      label: 'Experience',
      count: experience.data?.length,
      isLoading: experience.isLoading,
    },
    {
      to: '/admin/certifications',
      label: 'Certifications',
      count: certifications.data?.length,
      isLoading: certifications.isLoading,
    },
    {
      to: '/admin/education',
      label: 'Education',
      count: education.data?.length,
      isLoading: education.isLoading,
    },
  ];

  return (
    <>
      <AdminHeader
        title="Overview"
        description={email ? `Signed in as ${email}.` : 'Manage the portfolio content.'}
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.to}>
            <Card interactive className="relative p-5">
              <p className="text-sm text-muted">
                <Link to={card.to} className="after:absolute after:inset-0">
                  {card.label}
                </Link>
              </p>

              {card.isLoading ? (
                <Skeleton className="mt-2 h-8 w-12" />
              ) : (
                <p className="mt-1 text-2xl font-semibold text-text">{card.count ?? 0}</p>
              )}

              {card.note && <Badge className="mt-2">{card.note}</Badge>}
            </Card>
          </li>
        ))}
      </ul>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-text">Changes are live immediately</h2>
        <p className="mt-1 max-w-prose text-sm text-muted">
          Anything you save here appears on the public site straight away — there is no build or
          deploy step. Projects only become visible once their status is Published.
        </p>
      </Card>
    </>
  );
}
