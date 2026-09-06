import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Fixed values, so a test never depends on whatever happens to be in a
    // developer's .env. Notably DATABASE_URL is absent: the suite must pass
    // with no database, and anything needing one is wrong by construction.
    env: {
      NODE_ENV: 'test',
      ALLOWED_ORIGINS: 'http://localhost:5173',
      // Pinned for the same reason as the rest, and it was the one that got
      // away: the sitemap suite asserts crawlers are sent to the site's origin
      // rather than the API's, and without this it read whatever a developer's
      // .env happened to hold. That passed on a laptop and failed on CI, where
      // there is no .env and the schema default applies instead.
      PUBLIC_SITE_URL: 'http://localhost:5173',
      SUPABASE_URL: 'https://dbmjasavjofnrhwyymwj.supabase.co',
      // Pinned empty so the suite never reaches a real database, even though a
      // developer's .env has a working one. A test that quietly talks to the
      // live database is slow, order-dependent, and one typo from writing to it.
      DATABASE_URL: '',
    },
  },
});
