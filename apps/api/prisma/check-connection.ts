/**
 * Diagnoses the database connection before a migration is attempted.
 *
 * Prisma's own failures at this stage are terse ("P1001: Can't reach database
 * server"), and the real cause is almost always one of a small set of things —
 * an unencoded password character, the IPv6-only direct host on a network with
 * no IPv6 route, or the pooler used for migrations. This names which.
 *
 * Run: pnpm --filter @portfolio-cms/api db:check
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { PrismaClient } from '@prisma/client';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const PROBLEM_CHARS = ['@', '/', '?', '#', '[', ']', ' '];

interface Parsed {
  host: string;
  port: number;
  user: string;
  database: string;
  params: URLSearchParams;
}

function fail(message: string, fix?: string): never {
  console.error(`\n  FAILED  ${message}`);
  if (fix) console.error(`  FIX     ${fix}`);
  console.error('');
  process.exit(1);
}

/** Parses without ever printing the password. */
function parse(name: string, raw: string | undefined): Parsed {
  if (!raw || raw.trim() === '') {
    fail(
      `${name} is empty.`,
      'Supabase dashboard -> Connect -> ORMs tab -> Prisma. Copy both lines into apps/api/.env.',
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Nearly always an unencoded character in the password.
    fail(
      `${name} is not a valid URL.`,
      `If your database password contains any of  ${PROBLEM_CHARS.join(' ')}  it must be ` +
        'percent-encoded. For example @ becomes %40, # becomes %23, / becomes %2F.',
    );
  }

  if (!url.password) {
    fail(`${name} has no password.`, 'Replace [YOUR-PASSWORD] with your real database password.');
  }

  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    params: url.searchParams,
  };
}

function tcpCheck(host: string, port: number, timeoutMs = 10_000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function main() {
  console.log('\nChecking database configuration…\n');

  const pooled = parse('DATABASE_URL', process.env.DATABASE_URL);
  const direct = parse('DIRECT_URL', process.env.DIRECT_URL);

  console.log(`  DATABASE_URL  ${pooled.user}@${pooled.host}:${pooled.port}/${pooled.database}`);
  console.log(`  DIRECT_URL    ${direct.user}@${direct.host}:${direct.port}/${direct.database}\n`);

  // The direct host is IPv6-only. On a network without an IPv6 route it will
  // never connect, and the pooler must be used for both URLs.
  for (const [name, parsed] of [
    ['DATABASE_URL', pooled],
    ['DIRECT_URL', direct],
  ] as const) {
    if (parsed.host.startsWith('db.') && parsed.host.endsWith('.supabase.co')) {
      fail(
        `${name} uses the direct host (${parsed.host}), which resolves to IPv6 only.`,
        'Use the pooler host instead: aws-<n>-<region>.pooler.supabase.com — ' +
          'port 6543 for DATABASE_URL, port 5432 for DIRECT_URL.',
      );
    }
  }

  if (pooled.port === 6543 && pooled.params.get('pgbouncer') !== 'true') {
    fail(
      'DATABASE_URL points at the transaction pooler (6543) without pgbouncer=true.',
      'Append  ?pgbouncer=true&connection_limit=1  to DATABASE_URL.',
    );
  }

  if (direct.port === 6543) {
    fail(
      'DIRECT_URL points at the transaction pooler (6543).',
      'Migrations cannot run through the transaction pooler. Use port 5432 for DIRECT_URL.',
    );
  }

  for (const [name, parsed] of [
    ['DATABASE_URL', pooled],
    ['DIRECT_URL', direct],
  ] as const) {
    process.stdout.write(`  Reaching ${parsed.host}:${parsed.port} … `);
    const reachable = await tcpCheck(parsed.host, parsed.port);
    console.log(reachable ? 'open' : 'BLOCKED');

    if (!reachable) {
      fail(
        `Cannot open a TCP connection for ${name}.`,
        'The host is wrong, or a firewall is blocking the port. Check the region in the hostname.',
      );
    }
  }

  console.log('\n  Authenticating and running a query…');

  const prisma = new PrismaClient();
  try {
    const [row] = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    console.log(`  Connected: ${row?.version?.split(' ').slice(0, 2).join(' ')}`);

    const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const count = Number(tables[0]?.count ?? 0);

    console.log(`  Tables in public schema: ${count}`);
    console.log(
      count === 0
        ? '\n  READY  No tables yet — run db:migrate next.\n'
        : '\n  READY  Schema already present.\n',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (/password authentication failed|SASL|authentication/i.test(message)) {
      fail(
        'The server answered but rejected the credentials.',
        'The database password is wrong. Reset it under Settings -> Database, ' +
          'then paste the new one into both URLs (percent-encoding any special characters).',
      );
    }

    // Supabase words this as "tenant/user <name> not found".
    if (/tenant[/ ]|tenant or user/i.test(message) && /not found/i.test(message)) {
      fail(
        'The pooler does not host that tenant — almost always the wrong region in the hostname.',
        'Check the region in the Connect dialog. The hostname region is not necessarily the one ' +
          "closest to you, and the direct host's IP address is not a reliable guide to it.",
      );
    }

    if (/Can't reach database server|P1001/i.test(message)) {
      fail(
        'The port is open but the database server did not respond to a connection.',
        'Usually the wrong pooler region in the hostname. Copy the URLs from the dashboard.',
      );
    }

    // Prisma messages are multi-line and often start with a blank line, so take
    // the first line that actually carries text.
    const firstMeaningfulLine =
      message
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? 'Unknown connection error.';

    fail(firstMeaningfulLine);
  } finally {
    await prisma.$disconnect();
  }
}

main();
