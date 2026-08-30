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

/**
 * The public route table (A4.1). The admin routes Phase 4 adds mount as a
 * separate branch with its own layout and guard — they do not belong inside
 * this layout, which is built for anonymous visitors.
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
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
