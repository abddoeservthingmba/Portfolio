/**
 * The public route table, in the order it appears in navigation. Header, mobile
 * menu and footer all read from here, so a new page is one entry rather than
 * three edits that can disagree.
 */
export const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/skills', label: 'Skills' },
  { to: '/experience', label: 'Experience' },
  { to: '/certifications', label: 'Certifications' },
  { to: '/education', label: 'Education' },
  { to: '/resume', label: 'Resume' },
  { to: '/contact', label: 'Contact' },
] as const;
