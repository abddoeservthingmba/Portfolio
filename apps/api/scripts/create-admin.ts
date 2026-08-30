/**
 * Creates the administrator: an identity in Supabase Auth, and the matching
 * row in the application's own users table.
 *
 * Both halves are required. The identity provider proves who someone is; the
 * users table is what says they may edit this portfolio. A Supabase user with
 * no row here can sign in and will be told they are not an administrator.
 *
 * Run: pnpm --filter @portfolio-cms/api admin:create -- you@example.com
 *
 * The password is read from stdin, never from an argument — arguments show up
 * in shell history and process listings.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { PrismaClient } from '@prisma/client';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

function fail(message: string, fix?: string): never {
  console.error(`\n  FAILED  ${message}`);
  if (fix) console.error(`  FIX     ${fix}`);
  console.error('');
  process.exit(1);
}

interface AuthUser {
  id: string;
  email?: string;
}

/** Supabase Admin API. The service-role key never leaves this process. */
async function authApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const message = typeof body?.msg === 'string' ? body.msg : JSON.stringify(body);
    throw new Error(`${response.status} ${message}`);
  }

  return body as T;
}

async function findByEmail(email: string): Promise<AuthUser | null> {
  const query = new URLSearchParams({ page: '1', per_page: '200' });
  const result = await authApi<{ users: AuthUser[] }>(`/users?${query}`);

  return result.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    fail(
      'No email address given.',
      'pnpm --filter @portfolio-cms/api admin:create -- you@example.com',
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    fail(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from apps/api/.env.',
      'Supabase dashboard -> Project Settings -> API Keys -> service_role. Server-side only.',
    );
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const password = (await rl.question(`Password for ${email}: `)).trim();
  rl.close();

  if (password.length < 8) {
    fail('That password is too short — use at least 8 characters.');
  }

  console.log('\nCreating the administrator…\n');

  let user = await findByEmail(email);

  if (user) {
    console.log(`  Auth user already exists (${user.id}); updating the password.`);
    await authApi(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ password, email_confirm: true }),
    });
  } else {
    user = await authApi<AuthUser>('/users', {
      method: 'POST',
      // Confirmed immediately: this is a single known operator, and there is no
      // email delivery configured to complete a confirmation flow.
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    console.log(`  Created auth user ${user.id}`);
  }

  const prisma = new PrismaClient();

  try {
    await prisma.user.upsert({
      where: { authUserId: user.id },
      update: { role: 'admin' },
      create: { authUserId: user.id, role: 'admin' },
    });

    console.log('  Granted administrator role in the users table');
    console.log(`\n  DONE  Sign in at /admin/login as ${email}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
