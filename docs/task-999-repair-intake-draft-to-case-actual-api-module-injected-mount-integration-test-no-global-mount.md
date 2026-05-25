# Task999 Repair Intake Draft-to-Case Actual API Module Injected Mount Integration Test

## Scope

Task999 adds an integration-style test proving the actual Task967 API module envelope can mount through the hardened injected HTTP mount adapter without global route wiring.

Changed files:

- `tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js`
- `docs/task-999-repair-intake-draft-to-case-actual-api-module-injected-mount-integration-test-no-global-mount.md`

Production source files were not modified.

## Imported Paths

Actual Task967 API module path discovered/imported:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`

Hardened injected mount adapter path imported:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`

## Synthetic Dependency Strategy

The test uses an injected synthetic controller with deterministic safe `planDraftToCase` and `submitDraftToCase` methods. The actual API module creates the real route definitions from that controller.

No real DB, repository, provider, runtime server, app, route index, network access, or global route registration is used.

## Behavior Covered

The test verifies:

- actual API module envelope mounts through `target.post(path, handler)`;
- a synthetic request dispatch reaches the mounted plan route handler;
- actual API module envelope mounts through `target.register(method, path, handler)`;
- a synthetic request dispatch reaches the mounted submit route handler;
- register target mounting works with safe `basePath`;
- mounted route summaries contain only `{ method, path }`;
- responses and summaries do not expose handler internals, raw module objects, DB/SQL, credentials, phone/address/customer data, LINE identity/token markers, or `finalAppointmentId`.

## Boundary Confirmation

Task999 preserves:

- Task993 basePath normalization;
- Task994 route suffix normalization;
- Task995 duplicate route collision guard;
- Task996 method allowlist;
- Task997 route shape guard coverage;
- Task998 sanitized summary contract coverage;
- no global route registration;
- no handler internals exposed.

Task999 did not modify:

- production source
- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `src/routes/**`
- `src/controllers/**`
- `src/repositories/**`
- `src/db/**`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- Task989-Task998 docs

No global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task999, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to actual API module injected mount integration coverage. Task989-Task998 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterSummaryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterMethod.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterDuplicateRoute.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteSuffix.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBasePath.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedMountAdapter.http-behavior.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
