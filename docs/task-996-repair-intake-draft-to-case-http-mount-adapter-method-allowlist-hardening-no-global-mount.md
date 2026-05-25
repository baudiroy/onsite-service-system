# Task996 Repair Intake Draft-to-Case HTTP Mount Adapter Method Allowlist Hardening

## Scope

Task996 hardens only the injected HTTP mount adapter route method handling.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterMethod.unit.test.js`
- `docs/task-996-repair-intake-draft-to-case-http-mount-adapter-method-allowlist-hardening-no-global-mount.md`

## Behavior

The adapter now accepts only safe POST method variants from a Task967-style API module envelope:

- `post`
- `POST`
- `Post`

Accepted method values are normalized to the internal method key `post` for injected target method lookup. The sanitized route summary and register-style target metadata remain `POST`.

Rejected method inputs:

- `get`
- `put`
- `patch`
- `delete`
- `options`
- `head`
- `trace`
- `connect`
- `''`
- `42`
- `null`
- `{}`

Rejected methods fail closed before registration:

```js
{
  ok: false,
  mounted: 0,
  routes: [],
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_UNSUPPORTED_METHOD',
  requiredActions: ['configure_supported_route_method']
}
```

## Boundary Confirmation

Task996 preserves:

- Task993 basePath normalization;
- Task994 route suffix normalization;
- Task995 duplicate route collision guard;
- `post(path, handler)` target support;
- `register(method, path, handler)` target support;
- sanitized mount summaries;
- no handler internals exposed;
- no global route registration.

Task996 did not modify:

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
- Task989-Task995 docs

No global app mount, production route registration outside the injected mount adapter, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task996, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected mount method allowlist hardening. Task989-Task995 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterMethod.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterDuplicateRoute.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteSuffix.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBasePath.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedMountAdapter.http-behavior.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
