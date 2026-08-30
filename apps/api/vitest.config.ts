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
      SUPABASE_URL: 'https://dbmjasavjofnrhwyymwj.supabase.co',
      // Pinned empty so the suite never reaches a real database, even though a
      // developer's .env has a working one. A test that quietly talks to the
      // live database is slow, order-dependent, and one typo from writing to it.
      DATABASE_URL: '',
    },
  },
});
