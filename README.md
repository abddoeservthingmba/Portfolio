# Portfolio CMS

A two-surface portfolio platform: a public React site and a private admin portal over one content layer. Content lives in PostgreSQL and object storage; presentation lives in code. Adding a project is a form submission, not a release.

Built against **Portfolio CMS Program Blueprint v1.0**. Section references below (`D2`, `C4`, `FR-05`) point back to that document.

---

## Status

| Phase                       | State           | Notes                                                    |
| --------------------------- | --------------- | -------------------------------------------------------- |
| 0 — Requirements lock       | ✅ Done         | Styling locked to Tailwind CSS with hand-rolled primitives |
| 1 — Foundation              | ✅ Done         | Monorepo, strict TS, ESLint/Prettier, CI, health endpoint  |
| 2 — Public static MVP       | ✅ Done         | All nine public routes, responsive, on mock data           |
| 3 — Database and public API | ✅ Done         | Live on Supabase PostgreSQL 17, real content seeded        |
| 4 — Admin CMS               | ✅ Done         | JWKS auth, guards, CRUD for every entity                   |
| 5 — Assets and contact      | ✅ Done         | Uploads with type sniffing, contact endpoint, admin inbox  |
| 6 — Production hardening    | 🟡 Mostly      | See the checklist below for what is outstanding            |
| 7 — Deployment              | 🟡 Configured  | netlify.toml and render.yaml ready; not yet deployed       |
| 8 — Portfolio polish        | ⬜ Not started  |                                                            |

The site runs on live data from Supabase. Content is managed entirely through the admin portal at `/admin` — no redeploy is needed to publish a project, add a certification or replace the resume.

---

## Architecture

Four tiers, with a deliberate seam between the static frontend and everything else. The browser talks only to the CDN and to the API. Privileged credentials never leave the application tier.

```
Browser ──HTTPS──> Netlify (static React bundle)
   │
   └──JSON, CORS allow-list──> Render (Express + TypeScript, /api/v1)
                                   │
                                   ├── Prisma ──> Supabase PostgreSQL
                                   ├── service key ──> Supabase Storage
                                   └── verify JWT ──> Supabase Auth
```

**The boundary rule.** Supabase supplies the database, the identity provider and the object store. Express owns the business API, validation, authorisation and every privileged key. When a feature could be built on either side, it goes in Express — that is where the logic is testable, loggable and reviewable.

**Non-negotiable.** The service-role key exists only in the API's server environment. If a feature seems to need it in the browser, the feature is wrong, not the rule.

### The middleware chain

Every request passes the same ordered chain (`apps/api/src/app.ts`). The order is the security model:

| Stage           | Applies to      | Responsibility                                          | Failure   |
| --------------- | --------------- | ------------------------------------------------------- | --------- |
| `requestId`     | All             | Correlation id, echoed on the response and in every log | —         |
| `helmet`        | All             | Baseline security headers                               | —         |
| `cors`          | All             | Reject origins outside the allow-list. No wildcard      | 403       |
| `requestLogger` | All             | One structured JSON line per completed request          | —         |
| body parser     | All             | JSON, size-capped                                       | 413       |
| `rateLimit`     | Public writes   | Throttle by address; contact endpoint is the target     | 429       |
| `requireAuth`   | Mutations       | Verify token, confirm admin role _(Phase 4)_            | 401 / 403 |
| `validate`      | Schema'd routes | Zod parse — the authority, regardless of the client     | 422       |
| handler         | All             | Controller → service → Prisma                           | 500       |

`requestId` runs one step earlier than the C2 diagram shows, ahead of `cors`. A rejected origin is otherwise the one failure with no id to trace it by, and the stage reads no request body, so the ordering rationale still holds.

Authorisation runs **before** validation so an unauthorised caller learns nothing about the shape of a valid payload.

### Response envelope

One shape for success, one for failure, on every route. Handlers never build a body by hand.

```jsonc
// success
{ "data": { }, "meta": { "requestId": "..." } }

// failure
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable summary, safe to display",
    "fields": { "slug": "Already in use" }
  },
  "meta": { "requestId": "..." }
}
```

Stack traces, driver messages, query text and configuration values never appear in a response body. They go to the structured log, correlated by the same request id the client received.

---

## Repository layout

```
portfolio-cms/
├─ apps/
│  ├─ web/                      # React + TypeScript (Vite)
│  │  ├─ src/
│  │  │  ├─ components/         # shared primitives: Button, Card, Field, Modal, Toast
│  │  │  ├─ features/           # one folder per domain: projects, skills, contact, …
│  │  │  ├─ pages/              # route-level components
│  │  │  ├─ lib/                # content source, hooks, formatters
│  │  │  ├─ mocks/              # PHASE 2 ONLY — deleted at the Phase 3 gate
│  │  │  ├─ types/              # content shapes, mirroring the D3 model
│  │  │  └─ styles/             # design tokens
│  │  └─ tests/
│  └─ api/                      # Express + TypeScript
│     ├─ src/
│     │  ├─ routes/             # thin: path, middleware chain, controller reference
│     │  ├─ controllers/        # request/response shaping only
│     │  ├─ services/           # business logic — the only layer that calls Prisma
│     │  ├─ middleware/         # cors, requestId, logger, rateLimit, validate, errorHandler
│     │  ├─ config/             # env parsing, validated at startup
│     │  └─ lib/                # logger, typed errors, response envelope
│     └─ tests/
├─ .github/workflows/ci.yml
└─ package.json                 # pnpm workspace root
```

**Layering rule.** Routes are thin, controllers shape requests and responses, services hold the logic and own all database access. A controller that imports Prisma directly is the first sign the layering has collapsed — fix it immediately, not at the end.

---

## Local setup

Requires **Node 20+** and **pnpm 10**.

```bash
# 1. dependencies, from the workspace root so both apps share one lockfile
pnpm install

# 2. environment — copy the templates and fill in
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. run both apps
pnpm dev            # web on :5173, api on :4000

# 4. confirm the API is up
curl http://localhost:4000/api/v1/health

# the quality gate — exactly what CI runs
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

Phase 2 needs no database. The Supabase variables in `apps/api/.env` may stay empty until Phase 3; `/health` reports `"database": "not_configured"` while they are.

Run the quality gate locally before opening a pull request. That is what keeps CI a safety net rather than a slow feedback loop.

### Scripts

| Command             | Effect                                           |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Both apps in watch mode                          |
| `pnpm build`        | Production bundles for web and api               |
| `pnpm typecheck`    | Strict TypeScript across both apps               |
| `pnpm lint`         | ESLint across the workspace                      |
| `pnpm format`       | Apply Prettier                                   |
| `pnpm format:check` | Verify formatting without changing files         |
| `pnpm test`         | Vitest — unit, component and API integration      |

---

## Environment variables

Names only. No value, key or secret appears in this repository. Development and production carry entirely separate sets.

### `apps/api`

| Variable                                | Purpose                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                              | Controls logging verbosity and error detail                      |
| `PORT`                                  | Listening port supplied by the host                              |
| `ALLOWED_ORIGINS`                       | Comma-separated CORS allow-list. No wildcard, in any environment |
| `PUBLIC_SITE_URL`                       | The public site origin, for absolute sitemap URLs                |
| `RATE_LIMIT_WINDOW` / `RATE_LIMIT_MAX`  | Throttle window and ceiling for public write routes              |
| `MAX_UPLOAD_BYTES`                      | Upload ceiling, enforced server-side                             |
| `DATABASE_URL`                          | Pooled PostgreSQL connection used by Prisma                      |
| `DIRECT_URL`                            | Direct connection, for migrations the pooled URL cannot run      |
| `SUPABASE_URL`                          | Project endpoint for storage and identity calls                  |
| `SUPABASE_SERVICE_ROLE_KEY`             | **Privileged — server-side only, never in a client bundle**      |
| `SUPABASE_JWT_SECRET`                   | Verifies access tokens on protected routes                       |

### `apps/web`

| Variable                 | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `VITE_API_BASE_URL`      | Base URL of the API for the current environment               |
| `VITE_SUPABASE_URL`      | Project endpoint for the administrator sign-in flow           |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key — the only Supabase key reaching the browser |

> **The one that matters.** Anything prefixed `VITE_` is compiled into the public bundle and readable by anyone who views the site. Only the anonymous key may carry that prefix. If a service-role key ever appears with a client prefix, treat it as disclosed and rotate it — removing it is not enough.

---

## Testing

Tests target business-critical behaviour, not a coverage percentage. A suite that chases a number tends to test getters and skip the authorisation boundary, which is precisely backwards.

| Layer               | Covers                                                                            |
| ------------------- | --------------------------------------------------------------------------------- |
| Unit                | Date formatting including a null end date; skill grouping including a blank category |
| Frontend component  | Form rejects invalid input without dispatching a request; error state renders on failure; honeypot and dwell-time heuristics fail silently |
| API integration     | Response envelope; correlation id propagation; CORS allow-list; no stack trace in any body |

**The test that justifies the suite** _(from Phase 4 onward)_: for every mutation route, an unauthenticated request must fail. Written once per route and left to fail loudly the day someone adds an endpoint and forgets the middleware. It is the cheapest test in the project and the only one that catches the most serious defect the system can have.

---

## Conventions

- `main` is always deployable, protected, and reached only through a pull request.
- Short-lived branches, one concern each: `feature/project-crud`, `fix/contact-validation`.
- Squash on merge, so the branch reads as one commit per change and reverting is a single operation.
- Strict TypeScript. No implicit `any`, no suppression comment without an adjacent reason.
- One typed API client module. No component issues a raw `fetch`.
- Services throw typed errors; the error handler maps them to the envelope. Controllers do not build error bodies.
- Comments explain **why**, not what. A comment restating the code is noise; one recording a constraint is documentation.

### Design rules

- **Tokens before components.** Spacing, typography, colour, radius and shadow are defined once in `apps/web/src/styles/index.css`. Every component consumes tokens; none uses a literal colour value.
- **Mobile first, then outward.** Narrow layout first, expanded to tablet and desktop.
- **Four states, always.** Loading, empty, error and success. An interface with only a success state is unfinished, and the empty state is the one most often forgotten.
- **The admin never outgrows the public site.** If the CMS becomes more complex than the portfolio it manages, the scope has drifted.

---

## What V1 deliberately excludes

These are decisions, not omissions. They keep the build finishable.

| Excluded                                       | Reason                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Multi-tenant CMS, multiple editors             | Role modelling and per-tenant isolation, for no benefit here        |
| Complex role hierarchies                       | One administrator makes authorisation a boolean, not a matrix       |
| Payments, subscriptions, public accounts       | Outside the product's purpose; disproportionate compliance weight   |
| Full blogging platform                         | Editor, drafts, scheduling and taxonomy are a product in themselves |
| Microservices, queues, orchestration           | Solves coordination problems this system does not have              |

---

## Deployment

Two independent deployments over one database. The site stays served from a CDN even while the API restarts or cold-starts, and either can be rolled back without touching the other.

```
Netlify (static bundle)  ──JSON, CORS allow-list──>  Render (Express)  ──>  Supabase
```

Configuration lives in `netlify.toml` and `render.yaml`. Neither contains a secret: every credential is marked `sync: false`, so the host prompts for it once and stores it.

### A note for this development machine

The network here intercepts TLS, so `prisma generate` cannot fetch its engine
checksums with plain Node. Every `db:*` script already carries
`--use-system-ca`, which trusts the Windows certificate store rather than
disabling verification — but `pnpm build` now runs `prisma generate` too, so
set it once per shell:

```bash
export NODE_OPTIONS=--use-system-ca   # Git Bash
$env:NODE_OPTIONS="--use-system-ca"   # PowerShell
```

CI and Render have no such proxy and need nothing.

### Before the first deploy

Three placeholders in `netlify.toml` must be replaced with the real hostnames — search for `YOUR-API` and `YOUR-PROJECT`. They appear in the sitemap rewrites and in the Content-Security-Policy, and a wrong value there silently blocks every API call the browser makes.

### 1. API on Render

1. **New → Blueprint**, point it at this repository. Render reads `render.yaml`.
2. Fill in the prompted secrets. They are the same values as `apps/api/.env`:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase transaction pooler, port 6543, with `?pgbouncer=true&connection_limit=1` |
   | `DIRECT_URL` | Supabase session pooler, port 5432 |
   | `SUPABASE_URL` | The project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Server-side only |
   | `SUPABASE_JWT_SECRET` | Only needed if the project ever moves to symmetric signing |
   | `ALLOWED_ORIGINS` | The exact Netlify origin, e.g. `https://yoursite.netlify.app`. No wildcard, no trailing slash |
   | `PUBLIC_SITE_URL` | The same origin. Used to build absolute sitemap URLs |

3. Deploy. `startCommand` runs `prisma migrate deploy` before the server accepts traffic, so the schema is never behind the code that expects it. `migrate deploy` applies committed migrations only — it never generates one and never prompts.

### If you created the service manually

A service made with **New → Web Service** ignores `render.yaml` and
auto-detects its commands — which means `yarn start`, and yarn refuses to run
at all while `packageManager` names pnpm. Set both commands by hand:

| Field | Value |
| --- | --- |
| Build Command | `pnpm install --frozen-lockfile && pnpm --filter @portfolio-cms/api build` |
| Start Command | `cd apps/api && npx --no-install prisma migrate deploy && node dist/index.js` |

The start command deliberately depends on nothing but npm and node. pnpm may
not be on PATH at runtime, and yarn cannot run here at all.

### 2. Site on Netlify

1. **Add new site → Import an existing project**, point it at this repository. Netlify reads `netlify.toml`.
2. Set the build environment variables:

   | Variable | Value |
   | --- | --- |
   | `VITE_API_BASE_URL` | `https://your-api.onrender.com/api/v1` |
   | `VITE_SUPABASE_URL` | The Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | The anon key — the only Supabase key that may reach a browser |

3. Deploy, then go back to Render and set `ALLOWED_ORIGINS` and `PUBLIC_SITE_URL` to the real Netlify origin.

### 3. Verify

```bash
curl https://your-api.onrender.com/api/v1/health     # database: "ok"
curl https://yoursite.netlify.app/sitemap.xml        # rewritten to the API
curl https://yoursite.netlify.app/robots.txt         # Sitemap line matches the site
```

Then, by hand: load the site, open a project, sign in at `/admin`, edit something, and confirm it appears publicly.

### Cold starts

The API sleeps on Render's free tier, so the first request after an idle period takes several seconds. That is a design input, not a fault (A6): the site renders its shell and skeletons without waiting on the API, and `/health` is a cheap way to warm the service.

---

## Rollback

Written down before it is needed, and rehearsed once during Phase 7. **Migrations are the part that does not roll back automatically**, which is why the migration rule below exists.

1. **Revert the offending commit on `main`.** Both hosts redeploy from source, restoring the previous build.
   ```bash
   git revert <sha> && git push origin main
   ```
2. **If only the site is affected**, redeploy the previous successful build directly from the Netlify dashboard (Deploys → the last good one → Publish deploy) while the revert makes its way through. That is faster than a rebuild.
3. **Confirm before declaring it done:** `/health` responds, one public page loads, and one admin edit saves.

### The migration rule

Write migrations to be additive wherever possible: add a column before you stop writing the old one, and drop the old one in a later release. A migration that destroys data cannot be undone by reverting a commit, so **a destructive migration should be the only thing in its release**.

### Backup and restore

Supabase takes automatic backups on paid plans; on the free plan, take a manual dump before any destructive migration:

```bash
# Uses DIRECT_URL (port 5432) — the transaction pooler cannot stream a dump.
pg_dump "$DIRECT_URL" --no-owner --no-privileges -Fc -f backup.dump
pg_restore -d "$DIRECT_URL" --no-owner --clean backup.dump
```

Storage objects are not covered by a database dump. The buckets hold uploaded images, certificates and resumes, and must be exported separately from the Supabase dashboard.

---

## Production readiness

The blueprint's release gate (Appendix B). Verified means checked, not assumed.

### Passing

- No secret, credential or token anywhere in version control, **including history** — verified by scanning every commit
- Environment sets separate per environment; `.env` ignored from the first commit
- The service-role key exists only in the API's environment and carries no client build prefix
- CORS restricted to an exact origin, no wildcard anywhere
- Every mutation route has an automated test proving it rejects an unauthenticated request — 43 of them, enumerated from the route table
- A forged `alg: none` token is rejected; the verification algorithm is pinned
- Uploads enforce server-side type sniffing, per-entity size caps and generated storage paths
- The contact endpoint is rate limited and returns a `Retry-After` header
- No response body carries a stack trace, driver message or configuration value
- Security headers on both surfaces; CSP, HSTS and frame-ancestors on the site
- Typecheck, lint, format check and 115 tests pass
- Mock data deleted, not bypassed
- A failed API call renders an error state with navigation intact
- Unique titles, descriptions and Open Graph tags per route
- Sitemap and robots generated from live content, rewritten onto the site's domain
- Non-critical images lazy-loaded; the admin surface is a separate chunk
- The OpenAPI description matches the deployed routes — enforced by a test that fails when a route is undocumented

### Outstanding

| Gap | Why it is still open |
| --- | --- |
| No test proves a **valid non-admin** token is rejected | Needs a real second Supabase identity. The code path is separate from the 401 path and is currently only covered by inspection |
| CRUD success paths are untested | The suite deliberately runs without a database. Covering these needs a test database and a fixture reset between cases |
| No performance audit recorded | Run Lighthouse against the deployed site and record the result |
| Keyboard and contrast pass not formally recorded | Focus styles, labels and semantics are in place; the walkthrough has not been done and signed off |
| Rollback not yet rehearsed | Cannot be rehearsed before the first deploy |
| Provider quotas not verified | Check current Supabase, Render and Netlify limits at launch and record them here |

None of these block a first deploy. All of them block calling the release gate passed.

---

**Closing principle.** Build the smallest complete version first. The success metric is not how many technologies appear in this README — it is whether the portfolio works end to end, can be maintained securely by one person, and makes its engineering decisions visible to someone who was not there when they were made.
