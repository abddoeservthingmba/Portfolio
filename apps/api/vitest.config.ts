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
    },
  },
});
