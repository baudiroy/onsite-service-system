# Task2134 - Customer Access Audit Persistence Writer Adapter Planning

## Status

- Created a docs-only planning packet for a future Customer Access audit persistence writer adapter.
- This task does not implement a writer.
- This task does not implement a repository.
- This task does not execute DB commands, SQL, migration apply, or migration dry-run.
- This task does not use `psql`, `DATABASE_URL`, env, Zeabur, staging, production, or any DB connection.
- This task does not integrate runtime persistence.
- This task does not change source/runtime code, tests, package files, migration SQL files, repository/query code, audit persistence code, DB writer code, route/controller/global mount code, production mount code, app/server/public routes, provider/admin/AI/billing code, seed data, backfills, triggers, functions, or policies.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Branch: `main`.
- Starting HEAD/origin baseline: `ce5c889011e530eae4276aa640a30cfe48f7656e`.
- `git status --short --branch` before work showed local `main...origin/main` and only the 7 held historical docs untracked.
- Task2133 was accepted, pushed, and synced.
- Customer Access audit migration static branch is checkpointed.
- DB execution, migration apply, migration dry-run, and runtime persistence integration remain not authorized.

## Accepted Upstream Artifacts

Audit event builder, Task2101 through Task2105:

- Sanitized event output contract.
- Decision, reason, source, route, and method matrix.
- Metadata matrix.

Audit writer result normalizer, Task2106 through Task2108:

- `recorded`, `skipped`, and `failed` status matrix.
- Safe writer result normalization.

Injected audit writer adapter, Task2109 through Task2110:

- Accepts `function writer(auditEvent)` only.
- No global fallback.
- Writer exceptions or malformed results stay contained by accepted normalization behavior.

Runtime side-channel integration, Task2112 through Task2122:

- Case overview optional injected `auditWriter`.
- Service-report optional injected `auditWriter`.
- Route-registration optional injected `auditWriter`.
- Audit failures do not alter customer response or registration summary.

Repository contract, Task2124:

- `buildCustomerAccessAuditRepositoryRecord(input)`.
- `normalizeCustomerAccessAuditRepositoryResult(input)`.
- Invalid audit input returns a safe failed result and no persistence intent.

Migration artifacts, Task2130 through Task2133:

- `migrations/027_create_customer_access_audit_events.sql` exists.
- Static SQL review exists.
- Static branch checkpoint exists.
- DB dry-run remains unauthorized.

## Future Persistence Writer Adapter Concept

A future persistence writer adapter should be injected-only:

- Accept a sanitized `auditEvent`.
- Accept an explicitly injected `auditRepository` or injected DB/repository dependency.
- Call the repository contract to build a safe repository record.
- Call only an explicitly injected repository method.
- Normalize repository result through the accepted normalizer.
- Use no global DB pool.
- Use no env or Zeabur configuration.
- Do no provider sending.
- Add no runtime mount.

## Candidate Future Writer Shape

Candidate exported function options:

```js
createCustomerAccessAuditPersistenceWriter({ auditRepository })
```

or:

```js
writeCustomerAccessAuditEvent({ auditEvent, auditRepository })
```

Future writer requirements:

- Expose a `function writer(auditEvent)` shape compatible with the Task2109 injected writer adapter.
- Return a normalized `recorded`, `skipped`, or `failed` result shape.
- Never throw raw DB errors.
- Never expose raw repository errors to runtime callers.
- Never change customer-visible responses.

## Future Repository Dependency Contract

Dependency rules:

- Explicit injected repository only.
- Suggested method: `recordCustomerAccessAuditEvent(record)`.
- Missing repository returns a safe failed/skipped result.
- Malformed repository returns a safe failed/skipped result.
- Repository throw/reject returns failed `audit_persistence_failed`.
- Writer must not call repository for invalid `auditEvent`.
- Writer must not pass raw `auditEvent`; it should pass only the sanitized repository record.

## Non-Leakage Boundaries

Future writer/repository result must not include:

- Raw request or response.
- Headers, tokens, cookies, body, query, or params object.
- Raw `customerAccessContext`.
- DB rows, query metadata, query text, or query values in the result.
- SQL, stack, debug, provider, AI, private, admin, or billing fields.
- Env or Zeabur values.
- Raw repository error or thrown message.
- Audit result in any customer-visible response.

## Future Test Matrix

Future implementation tests should cover:

- Valid `auditEvent` plus valid injected repository records successfully.
- Missing repository fails/skips safely.
- Malformed repository fails/skips safely.
- Invalid `auditEvent` skips repository.
- Repository throw/reject is normalized safely.
- Repository malformed result is normalized safely.
- Raw/sensitive fields are not passed to repository.
- Caller `auditEvent` is not mutated.
- Static test confirms no DB/env/global imports.
- Writer remains compatible with Task2109 `function writer(auditEvent)`.

## Future Implementation Gates

- Gate A: PM authorizes persistence writer adapter skeleton, no DB execution.
- Gate B: PM authorizes integration of writer with existing side-channel injection, still optional.
- Gate C: PM authorizes disposable DB dry-run of migration `027` only, if desired.
- Gate D: PM authorizes real repository implementation only after migration is accepted.
- Gate E: Production/staging DB apply remains separately authorized and not implied.

## Explicit Non-Goals

- No source/runtime/test/package changes except this doc.
- No writer implementation.
- No repository implementation.
- No DB execution.
- No DB changes.
- No migration apply.
- No migration dry-run.
- No SQL execution.
- No `psql`.
- No `DATABASE_URL`.
- No env/Zeabur inspection.
- No runtime persistence integration.
- No route/controller/global mount changes.
- No production mount.
- No smoke/server/listener/network/Zeabur/env.
- No provider/admin/AI/billing work.

## Verification

Static docs-only verification:

```sh
git diff --check -- docs/task-2134-customer-access-audit-persistence-writer-adapter-planning-no-runtime-change-no-db-no-persistence.md
git status --short --branch
```

Results:

- `git diff --check -- docs/task-2134-customer-access-audit-persistence-writer-adapter-planning-no-runtime-change-no-db-no-persistence.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only this Task2134 doc and the 7 held historical docs untracked before commit.

Node tests were not required or run because Task2134 is docs-only and no source or test files were changed.
