# Task994 Repair Intake Draft-to-Case HTTP Mount Adapter Route Suffix Normalization Hardening

## Scope

Task994 hardens only the injected HTTP mount adapter route suffix handling.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteSuffix.unit.test.js`
- `docs/task-994-repair-intake-draft-to-case-http-mount-adapter-route-suffix-normalization-hardening-no-global-mount.md`

## Behavior

The adapter now accepts and normalizes safe route suffixes from a Task967-style API module envelope:

- `/draft-to-case/plan`
- `draft-to-case/plan`
- `/draft-to-case/submit`
- `draft-to-case/submit/`
- `draft-to-case//plan//`
- `/draft-to-case///submit/`

Normalization ensures final mounted paths have:

- no duplicate slashes;
- a slash between basePath and route suffix;
- no trailing slash after the suffix.

Task993 basePath behavior is preserved.

Unsafe route suffix inputs fail closed:

- `https://example.com/x`
- `//example.com/x`
- `../admin`
- `/draft-to-case/../admin`
- `/draft-to-case?next=/admin`
- `/draft-to-case#fragment`
- `/draft intake`
- `42`
- `null`
- `{}`
- `''`

The adapter still returns only sanitized summary or error metadata.

## Boundary Confirmation

Task994 preserves:

- injected mount target only;
- `post(path, handler)` support;
- `register(method, path, handler)` support;
- no global route registration;
- no handler internals exposed.

Task994 did not modify:

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
- Task989-Task993 docs

No global app mount, production route registration outside the injected mount adapter, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task994, the injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected mount path normalization. Task989-Task993 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteSuffix.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBasePath.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedMountAdapter.http-behavior.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
