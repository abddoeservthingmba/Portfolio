import { BrowserRouter, Route, Routes } from 'react-router';
import { RootLayout } from '@/components/layout/RootLayout';
import { ToastProvider } from '@/components/toast/ToastProvider';
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

import { AuthProvider } from '@/admin/auth/AuthProvider';
import { RequireAdmin } from '@/admin/auth/RequireAdmin';
import { AdminLayout } from '@/admin/AdminLayout';
import { LoginPage } from '@/admin/pages/LoginPage';
import { OverviewPage } from '@/admin/pages/OverviewPage';
import { ProjectsAdminPage } from '@/admin/pages/ProjectsAdminPage';
import { SkillsAdminPage } from '@/admin/pages/SkillsAdminPage';
import { ExperienceAdminPage } from '@/admin/pages/ExperienceAdminPage';
import { CertificationsAdminPage } from '@/admin/pages/CertificationsAdminPage';
import { EducationAdminPage } from '@/admin/pages/EducationAdminPage';
import { ResumeAdminPage } from '@/admin/pages/ResumeAdminPage';
import { SettingsAdminPage } from '@/admin/pages/SettingsAdminPage';
import { MessagesAdminPage } from '@/admin/pages/MessagesAdminPage';

/**
 * Two route branches over one app.
 *
 * The public branch (A4.1) renders inside RootLayout for anonymous visitors.
 * The admin branch sits behind RequireAdmin with its own shell — deliberately
 * separate, because the two surfaces share nothing but the design tokens.
 *
 * The client guard is a convenience. Every admin request is independently
 * authorised by the server, which is the check that actually protects the data.
 */
export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
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

            <Route path="/admin/login" element={<LoginPage />} />

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="projects" element={<ProjectsAdminPage />} />
                <Route path="skills" element={<SkillsAdminPage />} />
                <Route path="experience" element={<ExperienceAdminPage />} />
                <Route path="certifications" element={<CertificationsAdminPage />} />
                <Route path="education" element={<EducationAdminPage />} />
                <Route path="resume" element={<ResumeAdminPage />} />
                <Route path="messages" element={<MessagesAdminPage />} />
                <Route path="settings" element={<SettingsAdminPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
