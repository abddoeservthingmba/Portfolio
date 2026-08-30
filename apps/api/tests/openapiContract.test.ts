import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * CONTRACT DISCIPLINE (D4).
 *
 * The OpenAPI description is written alongside the routes, in the same pull
 * request — never reconstructed afterwards. This test keeps that true: it
 * reads the route files and fails if any route is missing from the document.
 *
 * A schema that drifts from its documented contract is worse than an
 * undocumented one, because it is now actively misleading. The description had
 * already fallen twenty-seven routes behind by the end of Phase 5, which is
 * exactly why this exists.
 *
 * It reads the source rather than walking Express, because Express 5 keeps
 * mount paths in matcher closures with no public way to read them back — a
 * walker would silently lose the `/admin` prefix and pass vacuously.
 */

const ROUTES_DIR = fileURLToPath(new URL('../src/routes/', import.meta.url));
const SPEC_PATH = fileURLToPath(new URL('../../../docs/openapi.yaml', import.meta.url));

const spec = readFileSync(SPEC_PATH, 'utf8');

/** Path keys sit at exactly two spaces of indentation under `paths:`. */
function documentedPaths(): Set<string> {
  const paths = new Set<string>();

  for (const line of spec.split('\n')) {
    const match = /^ {2}(\/[^:\s]*):\s*$/.exec(line);
    if (match?.[1]) paths.add(match[1]);
  }

  return paths;
}

/**
 * Maps each router variable to the prefix it is mounted at, by reading the
 * `apiRouter.use(...)` calls in routes/index.ts.
 */
function mountPrefixes(): Map<string, string> {
  const index = readFileSync(`${ROUTES_DIR}index.ts`, 'utf8');
  const prefixes = new Map<string, string>();

  for (const match of index.matchAll(/apiRouter\.use\(\s*(?:'([^']+)',\s*)?(\w+)\s*\)/g)) {
    prefixes.set(match[2]!, match[1] ?? '');
  }

  return prefixes;
}

/** Every route declared across the route files, with its mount prefix applied. */
function declaredRoutes(): string[] {
  const prefixes = mountPrefixes();
  const routes: string[] = [];

  for (const file of readdirSync(ROUTES_DIR)) {
    if (file === 'index.ts' || !file.endsWith('.ts')) continue;

    const source = readFileSync(`${ROUTES_DIR}${file}`, 'utf8');

    // `export const contentRoutes = Router();`
    const declared = /export const (\w+) = Router\(\)/.exec(source)?.[1];
    if (!declared) continue;

    const prefix = prefixes.get(declared);
    // A router nobody mounts serves nothing, and is its own kind of bug.
    expect(prefix, `${declared} is declared but never mounted`).toBeDefined();

    const pattern = new RegExp(`${declared}\\.(get|post|patch|put|delete)\\(\\s*'([^']+)'`, 'g');
    for (const match of source.matchAll(pattern)) {
      routes.push(`${prefix}${match[2]}`);
    }
  }

  return routes;
}

/** Express `:id` becomes OpenAPI `{id}`. */
const toOpenApiPath = (path: string) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

describe('OpenAPI contract', () => {
  const routes = declaredRoutes();

  it('finds the declared routes at all', () => {
    // A parsing bug would otherwise make the whole suite vacuously pass, which
    // is worse than having no test.
    expect(routes.length).toBeGreaterThan(25);
  });

  it('picks up the /admin mount prefix', () => {
    expect(routes).toContain('/admin/session');
  });

  it('documents every route the API serves', () => {
    const documented = documentedPaths();

    const undocumented = [...new Set(routes.map(toOpenApiPath))]
      .filter((path) => !documented.has(path))
      .sort();

    expect(undocumented).toEqual([]);
  });

  it('every admin path declares that it needs a bearer token', () => {
    const adminSections = spec
      .split(/^ {2}(?=\/)/m)
      .filter((section) => section.startsWith('/admin/'));

    const unsecured = adminSections
      .filter((section) => !section.includes('bearerAuth'))
      .map((section) => section.split(':')[0]);

    expect(unsecured).toEqual([]);
  });
});
