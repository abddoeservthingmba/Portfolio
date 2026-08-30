import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { RootLayout } from '@/components/layout/RootLayout';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { Container } from '@/components/Container';
import { Skeleton } from '@/components/Skeleton';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { SkillsPage } from '@/pages/SkillsPage';
import { ExperiencePage } from '@/pages/ExperiencePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { CertificationsPage } from '@/pages/CertificationsPage';
import { EducationPage } from '@/pages/EducationPage';
import { ResumePage } from '@/pages/ResumePage';
import { ContactPage } from '@/pages/ContactPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * The admin surface is a separate chunk, fetched only when someone opens
 * /admin. It carries the Supabase client and every CRUD form — roughly half
 * the application — none of which a public visitor should download.
 */
const AdminApp = lazy(() => import('@/admin/AdminApp'));

/**
 * Two route branches over one app.
 *
 * The public branch (A4.1) renders inside RootLayout for anonymous visitors.
 * The admin branch has its own shell and its own auth context — the surfaces
 * share design tokens and nothing else.
 */
export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="experience" element={<ExperiencePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:slug" element={<ProjectDetailPage />} />
            <Route path="certifications" element={<CertificationsPage />} />
            <Route path="education" element={<EducationPage />} />
            <Route path="resume" element={<ResumePage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<AdminLoading />}>
                <AdminApp />
              </Suspense>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

/** Shown for the moment the admin chunk is in flight. */
function AdminLoading() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md space-y-3">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Container>
  );
}
