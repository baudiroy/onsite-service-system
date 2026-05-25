# Task998 Repair Intake Draft-to-Case HTTP Mount Adapter Sanitized Summary Contract Lock

## Scope

Task998 adds contract coverage for the injected HTTP mount adapter returned summary/error shape.

Changed files:

- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterSummaryContract.unit.test.js`
- `docs/task-998-repair-intake-draft-to-case-http-mount-adapter-sanitized-summary-contract-lock-no-global-mount.md`

Production adapter code did not change for Task998 because the current adapter already returns sanitized metadata only.

## Allowed Summary Fields

Adapter results are locked to these top-level fields:

- `ok`
- `mounted`
- `routes`
- `reasonCode`
- `requiredActions`

Each route summary is locked to:

- `method`
- `path`

## Forbidden Leak Fields Tested

The test fails if result objects expose forbidden keys such as:

- `handler`
- `rawRoute`
- `rawRoutes`
- `module`
- `apiModule`
- `target`
- `mountTarget`
- `request`
- `response`
- `req`
- `res`
- `next`
- `stack`
- `sql`
- `query`
- `params`
- `db`
- `databaseUrl`
- `DATABASE_URL`
- `phone`
- `address`
- `customer`
- `customerName`
- `customerPhone`
- `lineUserId`

It also checks failure paths do not leak raw thrown error text, SQL snippets, credentials, phone/address/customer values, LINE token markers, or `finalAppointmentId`.

## Behavior Covered

The test covers:

- successful mount summary;
- mount target thrown error;
- `apiModule.ok === false` with unsafe reason/action input;
- invalid route failure with unsafe raw route fields.

All checked results remain sanitized summaries only.

## Boundary Confirmation

Task998 preserves:

- Task993 basePath normalization;
- Task994 route suffix normalization;
- Task995 duplicate route collision guard;
- Task996 method allowlist;
- Task997 route shape guard coverage;
- `post(path, handler)` target support;
- sanitized mount summaries;
- no handler internals exposed;
- no global route registration.

Task998 did not modify:

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
- Task989-Task997 docs

No global app mount, production route registration outside the injected mount adapter, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task998, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to sanitized summary contract coverage. Task989-Task997 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
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
