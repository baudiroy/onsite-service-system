# Task993 Repair Intake Draft-to-Case HTTP Mount Adapter BasePath Normalization Hardening

## Scope

Task993 hardens only the injected HTTP mount adapter basePath handling.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBasePath.unit.test.js`
- `docs/task-993-repair-intake-draft-to-case-http-mount-adapter-basepath-normalization-hardening-no-global-mount.md`

## Behavior

The adapter now accepts and normalizes safe basePath inputs:

- `/repair-intake`
- `/api/repair-intake`
- `repair-intake`
- `/repair-intake/`
- `/api//repair-intake//`
- `''`
- omitted `basePath`
- `/`

Normalization ensures mounted paths have:

- a leading slash;
- no duplicate slashes;
- no trailing slash between the basePath and Task967 route suffix.

Unsafe basePath inputs fail closed:

- `https://example.com/x`
- `//example.com/x`
- `/repair-intake/../admin`
- `/repair-intake?next=/admin`
- `/repair intake`
- non-string values such as `42`, `null`, and `{}`

The adapter still returns only sanitized mount summary or error metadata.

## Boundary Confirmation

Task993 preserves:

- injected mount target only;
- `post(path, handler)` support;
- `register(method, path, handler)` support;
- no global route registration;
- no handler internals exposed.

Task993 did not modify:

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
- Task989-Task992 docs

No global app mount, production route registration outside the injected mount adapter, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task993, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected mount behavior. Task989-Task992 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBasePath.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedMountAdapter.http-behavior.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
