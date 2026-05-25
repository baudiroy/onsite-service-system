# Task995 Repair Intake Draft-to-Case HTTP Mount Adapter Duplicate Route Collision Guard

## Scope

Task995 hardens only the injected HTTP mount adapter against duplicate mounted route collisions after Task993 basePath and Task994 route suffix normalization.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterDuplicateRoute.unit.test.js`
- `docs/task-995-repair-intake-draft-to-case-http-mount-adapter-duplicate-route-collision-guard-no-global-mount.md`

## Behavior

Duplicate detection is a preflight guard. The adapter normalizes each injected route, builds a safe `method path` key, and rejects duplicate final mounted method/path pairs before any route is registered.

Duplicate route inputs tested:

- `basePath: /repair-intake`
- suffix A: `/draft-to-case/plan`
- suffix B: `draft-to-case//plan//`
- final mounted path: `/repair-intake/draft-to-case/plan`

The guard also normalizes method case and basePath before collision detection:

- method A: `post`
- method B: `POST`
- suffix A: `/draft-to-case/submit`
- suffix B: `/draft-to-case/submit/`
- basePath: `/repair-intake//`

Duplicate failures return sanitized metadata only:

```js
{
  ok: false,
  mounted: 0,
  routes: [],
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_DUPLICATE_ROUTE',
  requiredActions: ['configure_unique_route_definitions']
}
```

Valid non-duplicate plan and submit routes still mount on both `post(path, handler)` and `register(method, path, handler)` targets.

## Boundary Confirmation

Task995 preserves:

- injected mount target only;
- `post(path, handler)` support;
- `register(method, path, handler)` support;
- no global route registration;
- no handler internals exposed.

Task995 did not modify:

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
- Task989-Task994 docs

No global app mount, production route registration outside the injected mount adapter, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task995, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected mount route collision hardening. Task989-Task994 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterDuplicateRoute.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteSuffix.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBasePath.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedMountAdapter.http-behavior.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
