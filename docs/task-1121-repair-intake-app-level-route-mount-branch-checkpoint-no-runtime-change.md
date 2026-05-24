# Task1121 - Repair Intake App-Level Route Mount Branch Checkpoint / No Runtime Change

## Status

Completed locally. Not staged.

Task1121 is a documentation checkpoint only. It does not modify runtime behavior.

## Accepted Status

PM accepted:

- Task1108A
- Task1110
- Task1111
- Task1112
- Task1113
- Task1114
- Task1115
- Task1116
- Task1117
- Task1118
- Task1119
- Task1120

The Repair Intake public route mount skeleton, app-router propagation, app-factory propagation, runtime behavior tests, and regression guards are complete.

The route mount remains explicit-injection-only.

No server/listen startup was changed.

No DB, repository, provider, API/OpenAPI, admin, AI/RAG, or billing work was introduced.

## Implemented Route Propagation Surface

Public route file:

- `src/routes/public.routes.js`

Public route behavior:

- imports `createRepairIntakeDraftToCaseInjectedRouteComposition` only;
- default `createPublicRouter()` does not mount Repair Intake routes;
- explicit runtime ports mount through `repairIntakeDraftToCaseRuntimePorts`;
- explicit nested runtime ports mount through `repairIntakeDraftToCase.runtimePorts`;
- creates no default synthetic or real Repair Intake runtime ports;
- uses the Express Router adapter `{ post: router.post.bind(router) }`;
- uses base path `/repair-intake`;
- preserves existing public routes:
  - `POST /case-inquiry`
  - `POST /line-case-inquiry`
  - `POST /brand-referral/normalize`

App router file:

- `src/routes/index.js`

App-router propagation:

- `createAppRouter(options = {})` remains present;
- imports `createPublicRouter` from `./public.routes`;
- passes `options.repairIntakeDraftToCaseRuntimePorts`;
- passes `options.repairIntakeDraftToCase`;
- preserves `appRouter.use('/api/v1/public', publicRouter)`;
- does not import Repair Intake internals.

App factory file:

- `src/app.js`

App-factory propagation:

- `createApp(options = {})` remains present;
- exported default `app = createApp()` behavior remains present;
- passes `options.repairIntakeDraftToCaseRuntimePorts` into `createAppRouter`;
- passes `options.repairIntakeDraftToCase` into `createAppRouter`;
- does not import Repair Intake internals;
- does not create default synthetic or real runtime ports;
- does not change server/listen startup.

Effective app-level public path:

- under `/api/v1/public/repair-intake`

## Covered Verification

Current route propagation branch coverage includes:

- public route static guard;
- public route runtime behavior test;
- public route regression guard;
- app router aggregation preflight;
- app router propagation static guard;
- app router runtime behavior test;
- app router propagation regression guard;
- app factory preflight;
- app factory propagation static guard;
- app factory runtime behavior test;
- app factory propagation regression guard.

The coverage verifies:

- wrapper-only ownership in `src/routes/public.routes.js`;
- explicit-injection-only runtime ports;
- direct and nested runtime ports propagation;
- plain Express Router mount target adapter;
- default no-mount behavior without explicit runtime ports;
- app-router-level propagation through `src/routes/index.js`;
- app-factory-level propagation through `src/app.js`;
- effective route path under `/api/v1/public/repair-intake`;
- direct nested Express route handler dispatch without server/listen startup;
- no lower-level Repair Intake imports in `src/routes/index.js`;
- no lower-level Repair Intake imports in `src/app.js`;
- no DB/repository/provider/server/listen/API/admin/AI/billing coupling in the Repair Intake propagation path;
- no default synthetic or real runtime ports.

## Current Hard Boundaries

The following remain outside this branch checkpoint:

- real repository implementation
- DB, SQL, migration, psql, or db:migrate
- migration creation or modification
- repository writer
- repository imports
- imports from `src/repositories/**` or `src/db/**`
- API shape or OpenAPI expansion
- admin changes
- provider sending
- LINE, SMS, App, email, or webhook work
- AI/RAG
- billing, settlement, payment, or invoice work
- staging, cleanup, revert, reset, or stash

## Local Worktree Warning

Task1108A through Task1121 files remain local, uncommitted, and untracked unless staged outside this task.

`src/routes/public.routes.js` has the allowed tracked modification from Task1108A.

`src/routes/index.js` has the allowed tracked modification from Task1113.

`src/app.js` has the allowed tracked modification from Task1118.

The existing broader tracked dirty stack remains pre-existing and must not be cleaned, reverted, restaged, reset, or stashed blindly.

`git diff --cached --name-only` must remain empty.

## Recommended Next Bounded Direction

Recommended safe next directions:

- server startup preflight, to confirm `src/server.js` remains untouched and whether runtime options can be injected from outside without code change;
- route mount branch final closure if PM wants to pause route propagation here;
- explicit repository / DB implementation planning only with a separate bounded authorization.

Do not start DB or repository writer work implicitly.

## Scope Boundaries Held

- No production source files modified in Task1121.
- No tests modified in Task1121.
- No migrations.
- No admin changes.
- No package changes.
- No existing docs modified.
- No server/listen startup.
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
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
