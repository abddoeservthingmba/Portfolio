import { Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAdmin } from './auth/RequireAdmin';
import { AdminLayout } from './AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsAdminPage } from './pages/ProjectsAdminPage';
import { SkillsAdminPage } from './pages/SkillsAdminPage';
import { ExperienceAdminPage } from './pages/ExperienceAdminPage';
import { CertificationsAdminPage } from './pages/CertificationsAdminPage';
import { EducationAdminPage } from './pages/EducationAdminPage';
import { ResumeAdminPage } from './pages/ResumeAdminPage';
import { SettingsAdminPage } from './pages/SettingsAdminPage';
import { MessagesAdminPage } from './pages/MessagesAdminPage';

/**
 * The entire admin surface, in one lazily-loaded chunk.
 *
 * This is the only module that reaches the Supabase client, and it pulls in
 * every admin page. Keeping it behind a dynamic import means a visitor reading
 * the public portfolio never downloads the authentication library or a single
 * CRUD form — that code arrives only when someone actually opens /admin.
 *
 * AuthProvider lives here rather than at the app root for the same reason: the
 * public site has no notion of a session and should not carry the machinery.
 */
export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />

        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
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
  );
}
