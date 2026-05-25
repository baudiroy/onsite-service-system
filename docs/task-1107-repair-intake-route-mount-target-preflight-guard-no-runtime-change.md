# Task1107 - Repair Intake Route Mount Target Preflight Guard / No Runtime Change

## Status

Completed locally. Not staged.

## Purpose

Add a static preflight guard that inspects the current app/router surface and documents the safest future Repair Intake route mount target.

This task does not mount routes.

This task does not register production routes.

This task does not change runtime behavior.

## Implemented Files

- `tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js`
- `docs/task-1107-repair-intake-route-mount-target-preflight-guard-no-runtime-change.md`

## Inspected Paths

The static guard inspects:

- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`

Additional Repair Intake route-composition references were read-only context:

- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`
- `src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js`

## App / Route Surface Findings

Current route surface:

- central route index detected: yes, `src/routes/index.js`
- public route aggregator detected: yes, `src/routes/public.routes.js`
- express-like router detected: yes, both route files use `express.Router()`
- direct app mounting in `src/app.js`: yes, `createApp()` uses `app.use(createAppRouter(...))`
- listen/server startup in `src/server.js`: yes, `startServer()` calls `app.listen(...)`

Because `src/server.js` owns listen startup, it must not be used for a future Repair Intake route mount.

## Candidate Future Mount Target

Confirmed candidate mount target:

- `src/routes/public.routes.js`

Reason:

- it is the existing public route aggregator;
- it exports `createPublicRouter`;
- it creates an express-like router;
- it is mounted by `src/routes/index.js` under `/api/v1/public`;
- it avoids touching `src/server.js` listen startup.

If a future route mount task chooses a different target, it must explain why and restate exact allowed files.

## Candidate Base Path and Routes

Candidate base path:

- `/repair-intake`

Candidate routes:

- `POST /repair-intake/drafts/:draftId/case/plan`
- `POST /repair-intake/drafts/:draftId/case/submit`

Given the current route hierarchy, a future mount under `src/routes/public.routes.js` would be exposed below the existing `/api/v1/public` prefix unless a future task explicitly chooses another route group.

## Existing Repair Intake Route Markers

The static guard verifies the inspected app/server/route files do not contain these mount markers:

- `repairIntakeDraftToCase`
- `createRepairIntakeDraftToCaseInjectedRouteComposition`
- `createRepairIntakeSyntheticAppCompositionHarness`
- `/repair-intake/drafts/:draftId/case/plan`
- `/repair-intake/drafts/:draftId/case/submit`

Current result:

- no existing Repair Intake route mount markers found in inspected app/server/route files.

## Blockers Before Actual Mount

Future route mount remains blocked until a separately bounded task specifies:

- exact route mount target;
- exact allowed files;
- exact route injection point inside the target;
- auth/session/org/tenant context source;
- permission source;
- runtime port injection strategy;
- safe-deny behavior;
- rollback plan;
- verification commands;
- explicit statement that production route registration is authorized.

DB, repository writer, provider sending, AI/RAG, billing, admin, OpenAPI, and migration work remain separate authorizations.

## Proposed Future Task1108 Allowed Files

If PM/user authorizes a future route mount, a safe narrow Task1108 could allow:

- `src/routes/public.routes.js`
- `tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js`
- `tests/repairIntake/repairIntakePublicRouteMount.static.test.js`
- `docs/task-1108-repair-intake-public-route-mount-no-db-no-repository-writer.md`

This proposal is not authorization. It is a candidate bounded file list for future review.

## Future Mount Rollback Plan

A future route mount task should be reversible by:

- removing the Repair Intake import or factory reference from `src/routes/public.routes.js`;
- removing the Repair Intake `router.use` or `router.post` registration from `src/routes/public.routes.js`;
- removing only the future Task1108 route-mount test/doc files if requested;
- rerunning the future route mount verification commands;
- confirming no changes to `src/server.js`, DB, repositories, migrations, providers, admin, AI/RAG, billing, package files, or OpenAPI files.

## Explicit Non-Authorization

Task1107 does not authorize:

- global route mount implementation
- production route registration
- listen/server startup
- DB, SQL, migration, psql, or db:migrate
- migration creation or modification
- real repository implementation
- repository writer or repository imports
- imports from `src/repositories/**` or `src/db/**`
- API shape or OpenAPI expansion
- admin changes
- provider sending
- LINE, SMS, App, email, or webhook work
- AI/RAG
- billing, settlement, payment, or invoice work
- staging, cleanup, revert, reset, or stash

## Boundaries Held

- No production source files modified.
- No existing tests modified.
- No route files modified.
- No migrations.
- No admin changes.
- No package changes.
- No existing docs modified.
- No global route mount.
- No production route registration.
- No listen/server startup.
- No DB, SQL, migration, psql, or db:migrate.
- No migration creation or modification.
- No real repository implementation.
- No repository writer or repository imports.
- No API shape or OpenAPI expansion.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
