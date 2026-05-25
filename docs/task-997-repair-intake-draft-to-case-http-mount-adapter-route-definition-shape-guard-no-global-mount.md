# Task997 Repair Intake Draft-to-Case HTTP Mount Adapter Route Definition Shape Guard

## Scope

Task997 adds route definition shape coverage for the injected HTTP mount adapter.

Changed files:

- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteShape.unit.test.js`
- `docs/task-997-repair-intake-draft-to-case-http-mount-adapter-route-definition-shape-guard-no-global-mount.md`

Production adapter code did not change for Task997 because the current preflight path already rejects invalid route shapes before registration.

## Behavior Covered

Valid minimal route shape accepted:

```js
{
  method: 'Post',
  path: 'draft-to-case/plan/',
  handler: Function
}
```

Invalid route collections rejected:

- missing `routes`
- `null`
- non-array object
- string
- empty array

Final sanitized collection failure reason:

- `REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTES_REQUIRED`

Invalid route item shapes rejected:

- route item is `null`
- route item is string
- route item is number
- route item is object without required fields
- missing method
- missing path
- missing handler
- handler is not a function
- valid route followed by malformed route

Final sanitized route-item failure reasons:

- `REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID`
- `REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_UNSUPPORTED_METHOD`

The mixed valid-plus-invalid route test confirms no partial registration occurs.

## Boundary Confirmation

Task997 preserves:

- Task993 basePath normalization;
- Task994 route suffix normalization;
- Task995 duplicate route collision guard;
- Task996 method allowlist;
- `post(path, handler)` target support;
- sanitized mount summaries;
- no handler internals exposed;
- no global route registration.

Task997 did not modify:

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
- Task989-Task996 docs

No global app mount, production route registration outside the injected mount adapter, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task997, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected mount route definition shape coverage. Task989-Task996 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
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
