# Task2040 Customer-facing Service Report Route Method / Envelope Contract Hardening / No DB No Smoke

## Baseline

- Starting local HEAD: `d6b13335937d163c8a9fecf3bf848248276f3cea`
- Starting `origin/main`: `d6b13335937d163c8a9fecf3bf848248276f3cea`
- Task2039 was already accepted and synced before this task.

## Scope

This task hardened the no-DB customer-facing service-report full route method and malformed-path contract.

The task did not use a public endpoint or running server. All route checks used in-memory app handling with synthetic request/response objects and an injected synthetic pool.

## Gap Found

Existing coverage already verified:

- Stable `GET /customer-access/:caseId/service-report/:reportId` registration.
- Full route allow response matches the direct projection handler sanitized DTO.
- Deny-before-projection remains safe and does not query projection.
- Query failures and missing projection DB client safe-deny without leaking internals.

Missing coverage:

- Unsupported HTTP method on the service-report route.
- Malformed service-report path missing `:reportId`.

## Test Change

Updated:

- `tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js`

Added no-DB in-memory tests for:

- `POST /customer-access/:caseId/service-report/:reportId`
  - returns `404`
  - returns app not-found style envelope
  - does not query the synthetic projection pool
  - does not leak raw SQL, query config, raw DB rows, internal context, internal projection fields, secrets, or forbidden internal markers
- `GET /customer-access/:caseId/service-report`
  - returns `404`
  - returns app not-found style envelope
  - does not query the synthetic projection pool
  - does not leak forbidden internals

No runtime source change was needed.

## Contract Confirmed

- Allowed method/path remains explicit: `GET /customer-access/:caseId/service-report/:reportId`.
- Unsupported method and malformed path stay outside the route handler and do not reach the projection query path.
- Successful full route response remains identical to the direct projection handler sanitized DTO.
- Deny-before-projection behavior remains unchanged.
- Customer-facing output stays sanitized and customer-visible only.

## Verification

Focused route tests:

```bash
node --test tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerAccessRoutes.unit.test.js
```

Result:

- `30` tests passed.
- `0` failed.

Full customerAccess sweep:

```bash
find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test
```

Result:

- `764` tests passed.
- `0` failed.

Project checks:

```bash
npm run check
git diff --check
```

Result:

- `npm run check`: passed.
- `git diff --check`: passed.

## Explicit Non-actions

- No runtime source files changed.
- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No smoke.
- No endpoint probe.
- No `/healthz` probe.
- No Zeabur access, deploy, restart, rollback, or environment inspection.
- No provider, billing, AI, or RAG execution.
- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior creation or mutation.
- No secrets printed.
- The 7 held historical docs were not touched.

## Recommendation

Submit Task2040 to PM for acceptance. Do not push until PM accepts the commit.
