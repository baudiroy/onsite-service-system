# Task992 Repair Intake Draft-to-Case Injected Mount Adapter HTTP Behavior Test

## Scope

Task992 adds synthetic HTTP behavior coverage for the Task989 injected mount adapter.

Changed files:

- `tests/repairIntake/repairIntakeDraftToCaseInjectedMountAdapter.http-behavior.unit.test.js`
- `docs/task-992-repair-intake-draft-to-case-injected-mount-adapter-http-behavior-test-no-global-mount.md`

Production adapter code did not change.

The existing Task989 adapter path is:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`

The existing Task990 static guard path is:

- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js`

## Behavior Covered

The new test mounts a Task967-style API module envelope onto an explicitly injected synthetic HTTP target. The synthetic target supports:

- `post(path, handler)`
- `register(method, path, handler)`

The test then dispatches synthetic `POST` requests to the mounted routes and verifies that:

- the mounted plan handler is reached without global app/server route mounting;
- the register-style target can dispatch to the mounted submit handler with a safe `basePath`;
- mount summaries expose only `{ method, path }` route metadata;
- missing mount target and unsupported target shape fail closed;
- a thrown handler is converted by the synthetic test target into a sanitized HTTP failure;
- global route files, app/server bootstrap, and listen paths are not required.

## Boundary Confirmation

Task992 did not modify:

- production adapter code
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
- Task989-Task991 docs

No global app mount, production route registration, listen/server startup, DB client, DB query, SQL, psql, `db:migrate`, migration, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task992, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected synthetic behavior coverage. Task989-Task991 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedMountAdapter.http-behavior.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
