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
| 3 — Database and public API | ⬜ Next         | Needs a Supabase project                                   |
| 4 — Admin CMS               | ⬜ Not started  |                                                            |
| 5 — Assets and contact      | ⬜ Not started  |                                                            |
| 6 — Production hardening    | ⬜ Not started  |                                                            |
| 7 — Deployment              | ⬜ Not started  |                                                            |
| 8 — Portfolio polish        | ⬜ Not started  |                                                            |

The public site currently runs on mock data. Everything it renders comes through `apps/web/src/lib/content.ts`, which mirrors the D4 API contract — Phase 3 replaces those function bodies with fetch calls and deletes `apps/web/src/mocks/`. No page or component changes.

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

## Next: Phase 3

Requires a Supabase project. The exit gate is hard — nothing downstream starts until it is met.

1. Create the Supabase project; put the connection string, endpoint and keys straight into `apps/api/.env`, never the repository.
2. Write `prisma/schema.prisma` against the D3 model, then the first migration and a seed script.
3. Build the public read endpoints under `/api/v1`, with the OpenAPI description written **alongside** the routes in the same pull request — never reconstructed afterwards.
4. Replace the function bodies in `apps/web/src/lib/content.ts` with typed fetch calls.
5. Delete `apps/web/src/mocks/`. Deleted, not bypassed — that is the M3 gate.

---

**Closing principle.** Build the smallest complete version first. The success metric is not how many technologies appear in this README — it is whether the portfolio works end to end, can be maintained securely by one person, and makes its engineering decisions visible to someone who was not there when they were made.
