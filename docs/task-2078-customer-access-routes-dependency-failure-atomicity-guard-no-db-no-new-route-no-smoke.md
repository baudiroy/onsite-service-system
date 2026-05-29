# Task2078 Customer Access Routes Dependency Failure Atomicity Guard

## Scope

- Runtime task: Customer Access Routes Dependency Failure Atomicity Guard / No DB No New Route No Smoke.
- PM accepted baseline: Task2077 synced at `5945e0f4bd0f0e027544055c2ab69e5db0504899`.
- Goal: guard caller-visible route registration atomicity when an injected mount target throws during required route registration.

## Result

- Source changes were not needed. `registerCustomerAccessRoutes` already wraps both required `registerGet.call(...)` operations in one safe `try/catch`.
- Success summary remains:
  - `{ registered: true, routes: [{ method: 'GET', path: '/customer-access/:caseId' }, { method: 'GET', path: '/customer-access/:caseId/service-report/:reportId' }] }`
- Failure summary for first-route or second-route registration failure remains:
  - `{ registered: false, messageKey: 'customerAccess.unavailable', customerVisible: false, reasonCode: 'route_registration_failed' }`

## Guarded Behavior

- First route registration throw returns sanitized failure.
- Second route registration throw returns sanitized failure even when the injected target records the first route before throwing.
- Failure summaries do not include partial routes, raw target, handlers, thrown error messages, stacks, SQL-looking strings, token/header-looking values, env/provider/debug/internal fields, or dbClient data.
- Invalid dbClient and invalid mount target still fail before route registration attempts where applicable.
- No rollback framework or global route registry was introduced. Injected target side effects cannot be rolled back by this route module; the caller-visible summary is fail-closed and never reports partial success.

## Verification

- Targeted tests:
  - `node --test tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- Diff checks:
  - `git diff --check`
  - `git diff --cached --check`

## Forbidden Scope Confirmation

- No new route creation.
- No global route mounting.
- No rollback framework/global route registry.
- No `src/app.js`, `src/server.js`, or `public.routes.js` changes.
- No DB execution, DB connection, migrations, repository query changes, smoke, listener, Zeabur/env, provider, admin frontend, AI/RAG, billing, or package changes.
- The 7 held historical untracked docs remain untouched.
