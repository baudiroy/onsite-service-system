# Task 598 - Customer Access Resolver Runtime Skeleton Final Scope Lock

## Scope

Task598 is a docs-only final scope lock for the possible future Customer Access Resolver runtime skeleton.

Task598 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no route / controller.
- no DTO / projection.
- no repository / DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.

Task598 does not authorize implementation.

## Current Branch Status

Current branch / module:

```text
customer-facing service report / customer access resolver runtime skeleton readiness branch
```

Current accepted status:

```text
STATIC BASELINE CLOSED / RUNTIME SKELETON NOT AUTHORIZED / API RUNTIME NO-GO
```

Task574 through Task597 established the static baseline, authorization packets, final no-go reviews, authorization request draft, and PM handoff for this branch.

Task598 only freezes the exact future runtime skeleton scope so that any later implementation task cannot accidentally expand into API, DB, test, fixture, provider, AI, or customer-facing endpoint work.

## Final Scope Lock

If a future task explicitly authorizes the first runtime skeleton, the maximum allowed implementation scope should be:

```text
src/customerAccess/customerAccessResolver.js
```

The future skeleton should define a pure deterministic resolver conceptually equivalent to:

```text
resolveCustomerAccess(input) -> decision
```

The future resolver must be:

- pure function only.
- deterministic.
- side-effect free.
- fail-closed by default.
- independent of DB / repository / service runtime.
- independent of route / controller / DTO runtime.
- independent of provider sending.
- independent of AI / RAG / vector DB.

## Explicitly Excluded From First Runtime Skeleton

The first future runtime skeleton must not include:

- unit test implementation.
- response envelope helper implementation.
- API route.
- controller.
- DTO.
- projection.
- repository.
- DB access.
- migration.
- DDL / SQL.
- customer identity write.
- publication state write.
- audit log write.
- provider sending.
- LINE / SMS / Email / App push.
- billing / settlement runtime.
- survey runtime.
- AI / RAG / vector DB.
- package change.
- smoke test.
- browser test.

If any of the above becomes necessary, the future task must stop and return to PM / user for a separate authorization task.

## Future Input Boundary

If later authorized, the resolver input should be preloaded, already-scoped, and sanitized by the caller.

The resolver should not fetch data.

The input may include safe summaries required to decide:

- organization scope match.
- customer identity verification state.
- Case linkage to customer.
- customer-facing publication availability.
- customer-visible data policy pass / fail.
- channel identity scope summary.
- request actor / channel summary.

The input must not rely on any single raw identifier as sufficient authorization.

## Future Decision Boundary

The future resolver decision should be minimal and safe.

Allowed conceptual decision outcomes:

- allow access.
- safe deny.
- needs verification.
- not published / not available.
- wrong scope / forbidden as internal-only result, never customer-visible raw reason.

Customer-visible responses must not expose raw denial internals.

The resolver output must not contain:

- raw phone.
- raw address.
- raw LINE user id.
- internal note.
- audit log.
- AI raw payload.
- internal billing / settlement data.
- engineer internal comment.
- supervisor review.
- full customer payload.
- full appointment payload.
- full Field Service Report payload.

## Mandatory Fail-closed Rules

Any future resolver must fail closed when:

- organization scope is missing or mismatched.
- customer identity is unverified.
- Case is not linked to the verified customer.
- customer-facing publication is not available.
- requested data violates customer visible data policy.
- request depends only on raw phone / address / LINE id.
- request depends only on `organization_id + line_channel_id + line_user_id` without Case / customer linkage.
- cross-organization or cross-customer access is detected.
- required input is incomplete or ambiguous.

## Field Service Report Invariants

Future resolver work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, complete, reopen, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify `finalAppointmentId`.
- Resolver cannot re-infer `finalAppointmentId`.
- Resolver cannot create a second formal report.

## Exact Future Authorization Requirements

General phrases such as "continue", "go ahead", "可以", "繼續", or "下一步" are not enough to authorize runtime implementation.

A future runtime implementation task must explicitly state:

- exact task name.
- exact allowed file:

```text
src/customerAccess/customerAccessResolver.js
```

- exact forbidden files.
- whether `src/` modification is allowed.
- whether tests are still forbidden.
- whether response envelope helper is still forbidden.
- whether API / route / controller remain forbidden.
- whether DB / migration remain forbidden.
- whether provider sending remains forbidden.
- whether AI / RAG remain forbidden.
- exact allowed commands.
- stop conditions.
- PM review requirement after completion.

Suggested future allowed commands, only if the future file is explicitly authorized:

```bash
node --check src/customerAccess/customerAccessResolver.js
git diff --check -- src/customerAccess/customerAccessResolver.js
```

Task598 must not run those commands because Task598 does not create the runtime skeleton.

## Task598 Allowed Verification

Task598 may only run:

```bash
git diff --check -- docs/task-598-customer-access-resolver-runtime-skeleton-final-scope-lock-no-runtime-change.md
```

Task598 must not run:

- `node --check src/customerAccess/customerAccessResolver.js`.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- API tests.
- smoke tests.
- browser tests.
- DB commands.
- migration commands.

## Next Task Candidates

Candidates only; do not execute from Task598:

- Task599 - Customer Access Resolver Runtime Skeleton Explicit User Authorization Review / No Runtime Change.
- Task600 - Customer Access Resolver Runtime Skeleton Authorization Packet Final PM Review / No Runtime Change.
- Task601 - Customer Access Resolver Runtime Skeleton User Authorization Wait State / No Runtime Change.

Task598 does not start Task599.

## Non-goals

Task598 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task597 documents.

Task598 does not implement:

- runtime resolver.
- response envelope.
- customer-facing API.
- customer-facing publication projection.
- permission runtime.
- entitlement runtime.
- customer identity runtime.
- notification runtime.
- survey runtime.
- billing runtime.
- AI / RAG runtime.

## Guardrails Review

Task598 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no API change.
- no provider sending.
- no AI auto decision.
- no customer-facing endpoint implementation.
- no sensitive data output.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
