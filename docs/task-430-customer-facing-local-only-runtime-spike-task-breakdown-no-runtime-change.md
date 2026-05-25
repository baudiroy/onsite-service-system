# Task430 - Customer-Facing Local-Only Runtime Spike Task Breakdown / No Runtime Change

Task430 proposes a future task breakdown for a customer-facing local-only
runtime spike if the user explicitly authorizes it later.

This task is documentation-only. It does not authorize runtime work, does not
modify backend `src/`, does not add API / route / controller / resolver /
repository code, does not add tests or fixtures, and does not authorize DB /
DDL / migration / Migration020 work.

## Purpose

The purpose is to pre-split a possible future local-only runtime spike into
small, reviewable, explicitly authorized tasks.

Task430 answers:

- which candidate tasks should come first,
- what each candidate task may do if separately authorized,
- what each candidate task must not do,
- which prerequisites must be satisfied,
- when Codex must stop.

## Non-Authorization Statement

Task430 is not runtime approval.

Task430 does not authorize:

- backend `src/` modification,
- route/controller implementation,
- resolver implementation,
- API implementation,
- repository implementation,
- tests,
- fixtures,
- smoke/browser/API tests,
- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task430 only breaks down a future spike before authorization.

## Relationship to Task428 and Task429

Task428 closed the customer-facing runtime readiness / no-runtime branch and
defined the handoff summary for PM continuation.

Task429 defined the authorization question template that PM must use before a
runtime spike can begin.

Task430 depends on both:

- without Task429-style explicit answers, no candidate task may start,
- without Task428 hard boundaries, no runtime spike can remain safe.

General wording such as "continue", "go ahead", "next task", "keep
developing", or "可以做" still does not count as authorization.

## Mandatory Future Customer-Facing Flow

Every future candidate task must preserve:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Rules:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Envelope must not bypass projection.
- No layer may output raw internal data.
- No layer may mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- No provider sending is allowed.
- No AI provider / RAG / vector DB is allowed.

## Proposed Runtime Spike Breakdown

All tasks below are future candidates only. None are authorized or implemented
by Task430.

### 1. Authorization Confirmation Task

Purpose:

- Confirm the user answered Task429 authorization questions explicitly.

Allowed scope if separately authorized:

- Review authorization answers.
- Record the approved file categories and commands.
- Stop if authorization is incomplete.

Forbidden scope:

- No code changes.
- No tests.
- No fixtures.
- No DB.
- No API.

Dependency / prerequisite:

- Completed Task429 template.
- User answers every required authorization question.

Expected completion report items:

- Which categories were authorized.
- Which categories remain prohibited.
- Whether DB/DDL/migration remains prohibited.

Rollback / stop condition:

- Stop if any answer is unclear, broad, conditional, or missing.

Sensitive data:

- Must not request credentials or raw secrets.

Platform impact:

- No customer channel identity, organization isolation, entitlement, usage, or
  audit runtime change.

### 2. Route/Controller Skeleton Task

Purpose:

- Create the smallest local-only route/controller orchestration skeleton if
  explicitly authorized.

Allowed scope if separately authorized:

- Add minimal route/controller skeleton.
- Parse sanitized request references.
- Invoke resolver interface/stub.
- Pass result through projection/envelope.

Forbidden scope:

- No repository.
- No DB.
- No provider sending.
- No direct resource lookup.
- No customer-facing DTO from raw data.

Dependency / prerequisite:

- Authorization confirmation.
- Resolver skeleton plan or stub boundary approved.

Expected completion report items:

- Files changed.
- Confirmation controller does not bypass resolver.
- Confirmation no raw token/channel/customer data is logged.

Rollback / stop condition:

- Stop if controller needs DB, repository, provider, AI, or mutation service.

Sensitive data:

- Uses sanitized symbolic references only.

Platform impact:

- Must preserve organization isolation and no-existence leakage.

### 3. Resolver Skeleton Task

Purpose:

- Create the smallest local-only resolver skeleton that returns synthetic
  allowed/denied outcomes.

Allowed scope if separately authorized:

- Implement symbolic resolver interface/stub.
- Collapse sensitive denial cases internally.
- Prepare customerAccessContext candidate.

Forbidden scope:

- No DB lookup.
- No token persistence.
- No customer channel identity persistence.
- No raw customer data.
- No customer-facing DTO.

Dependency / prerequisite:

- Authorization confirmation.
- Synthetic fixture/symbolic data boundary approved if examples are needed.

Expected completion report items:

- Denial cases covered.
- Confirmation external reason is not emitted.
- Confirmation resolver does not produce customer-facing DTO.

Rollback / stop condition:

- Stop if resolver needs real identity persistence, repository, or DB.

Sensitive data:

- No raw token, real channel id, complete phone/address, or production data.

Platform impact:

- Must preserve customer channel identity scope and organization isolation.

### 4. customerAccessContext Skeleton Task

Purpose:

- Create or use a local-only access context placeholder.

Allowed scope if separately authorized:

- Carry symbolic organization/customer/channel/resource references.
- Carry route family and projection scope.
- Fail closed on missing or malformed input.

Forbidden scope:

- No DB.
- No repository.
- No authorization replacement.
- No raw resolver output exposure.

Dependency / prerequisite:

- Resolver skeleton or stub boundary approved.

Expected completion report items:

- Context fields.
- Fail-closed conditions.
- Confirmation no raw identity/token/resource data is included.

Rollback / stop condition:

- Stop if context needs raw DB row, raw provider payload, or internal note.

Sensitive data:

- Uses symbolic references only.

Platform impact:

- Must preserve organization isolation and customer-visible policy.

### 5. Projection DTO / Projection Service Skeleton Task

Purpose:

- Use allow-list-first projection to produce customer-visible DTOs from
  synthetic summaries.

Allowed scope if separately authorized:

- Build minimal projection DTO/service skeleton.
- Default unknown fields to deny.
- Default forbidden fields to deny.

Forbidden scope:

- No authorization decisions.
- No DB/repository.
- No raw case/report/appointment rows.
- No finalAppointmentId decisions.

Dependency / prerequisite:

- customerAccessContext skeleton.
- Approved synthetic resource summary.

Expected completion report items:

- Allowed DTO fields.
- Forbidden field handling.
- Confirmation no internal data in output.

Rollback / stop condition:

- Stop if projection needs raw internal records or expands route scope.

Sensitive data:

- No raw token, raw channel id, `line_user_id`, complete phone/address, or raw
  provider payload.

Platform impact:

- Must preserve one Case = one formal Field Service Report.

### 6. Response Envelope / Generic Safe-Deny Skeleton Task

Purpose:

- Use a response envelope and generic safe-deny output boundary.

Allowed scope if separately authorized:

- Wrap allow-listed projection DTO.
- Wrap generic safe-deny.
- Preserve response equivalence.

Forbidden scope:

- No raw resolver result.
- No raw customerAccessContext internals.
- No denial reason in customer-visible output.
- No localization runtime unless separately approved.

Dependency / prerequisite:

- Projection skeleton or DTO boundary.

Expected completion report items:

- Success envelope shape.
- Safe-deny envelope shape.
- Denial equivalence notes.

Rollback / stop condition:

- Stop if envelope needs denial-specific external message keys or raw data.

Sensitive data:

- No raw sensitive data in response body, headers, redirect, or retry hints.

Platform impact:

- Must preserve no existence leakage.

### 7. Synthetic Fixtures Task

Purpose:

- Add synthetic fixtures only if explicitly authorized.

Allowed scope if separately authorized:

- Add symbolic fixtures.
- Add masked placeholder data.
- Add route-family-specific synthetic cases.

Forbidden scope:

- No production data.
- No real customer data.
- No provider payload.
- No real LINE/SMS/Email/App identifiers.
- No signature/photo/file/document content.

Dependency / prerequisite:

- Task417 synthetic fixture policy.
- Task418 fixture sensitive scan checklist.
- Explicit fixture authorization.

Expected completion report items:

- Fixture file list.
- Sensitive scan result.
- Confirmation fixtures are synthetic.

Rollback / stop condition:

- Stop and remove fixture candidate if suspected real sensitive data appears.

Sensitive data:

- Must be synthetic and scanned.

Platform impact:

- Must not create persistence or runtime data.

### 8. Minimal Unit / Contract Tests Task

Purpose:

- Add minimal unit/contract tests only if explicitly authorized.

Allowed scope if separately authorized:

- Pure utility tests.
- Route/controller contract tests with stubs.
- Resolver contract tests with synthetic cases.
- customerAccessContext tests.
- Projection service tests.
- Response equivalence tests.
- Fixture sensitive scan tests.

Forbidden scope:

- No API tests unless separately approved.
- No DB tests unless separately approved.
- No browser/smoke tests unless separately approved.
- No provider calls.

Dependency / prerequisite:

- Explicit test authorization.
- Synthetic fixture authorization if fixtures are needed.

Expected completion report items:

- Test files changed.
- Commands run.
- Coverage of fail-closed and forbidden fields.

Rollback / stop condition:

- Stop if tests require DB, provider, API server, browser, or smoke.

Sensitive data:

- Test output must not include sensitive data.

Platform impact:

- Must not alter organization isolation, entitlement, usage, or audit runtime.

### 9. API / Browser / Smoke Tests Task

Purpose:

- Future optional verification only after explicit separate authorization.

Allowed scope if separately authorized:

- Run or add approved local-only API/browser/smoke tests.

Forbidden scope:

- No shared/prod/Zeabur runtime.
- No provider sending.
- No production data.
- No unapproved DB.

Dependency / prerequisite:

- Explicit API/browser/smoke authorization.
- Local-only environment confirmation.

Expected completion report items:

- Commands run.
- Environment boundary.
- Pass/fail summary.

Rollback / stop condition:

- Stop if tests require shared runtime or real provider credentials.

Sensitive data:

- No secrets or production data in logs.

Platform impact:

- Must preserve organization isolation and safe-deny behavior.

### 10. DB / Migration / Persistence Task

Purpose:

- Explicitly separate future persistence work from the runtime spike.

Allowed scope if separately authorized:

- Only what a future DB-specific task explicitly approves.

Forbidden scope by default:

- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- schema/table/index creation,
- repository persistence.

Dependency / prerequisite:

- Separate DB/DDL/migration authorization.
- Disposable local/test DB confirmation.
- Shared/prod/Zeabur exclusion.

Expected completion report items:

- Exact DB target category without credentials.
- Commands run.
- Confirmation no shared/prod/Zeabur target.

Rollback / stop condition:

- Stop unless the DB task is explicit and separate.

Sensitive data:

- Never print credentials, connection strings, secrets, or production data.

Platform impact:

- Must preserve migration and survey runtime pause rules unless explicitly
  superseded by user-approved DB task.

## Candidate Task Dependency Order

Recommended order after explicit authorization:

1. Authorization confirmation task.
2. Route/controller skeleton task.
3. Resolver skeleton task.
4. customerAccessContext skeleton task.
5. Projection DTO / projection service skeleton task.
6. Response envelope / generic safe-deny skeleton task.
7. Synthetic fixtures task if needed and approved.
8. Minimal unit / contract tests task if approved.
9. API / browser / smoke tests task only if separately approved.
10. DB / migration / persistence task only as a separate explicit branch.

If a task requires a later dependency unexpectedly, stop and ask for an updated
authorization packet.

## Per-Task Scope / Forbidden Scope Matrix

| Candidate task | Allowed if separately authorized | Still forbidden by default |
| --- | --- | --- |
| Authorization confirmation | Review explicit answers. | Code, tests, fixtures, DB, API. |
| Route/controller skeleton | Local orchestration skeleton. | DB, repository, provider sending, direct resource lookup. |
| Resolver skeleton | Synthetic access result and context candidate. | DB, persistence, raw customer data, customer-facing DTO. |
| customerAccessContext skeleton | Symbolic scoped context. | Authorization replacement, raw resolver output, DB. |
| Projection skeleton | Allow-listed DTO from sanitized summary. | Raw records, authorization decision, finalAppointmentId decision. |
| Envelope/safe-deny skeleton | Generic envelope and safe-deny shape. | Raw denial reason, localization runtime, raw context. |
| Synthetic fixtures | Symbolic fixtures. | Production data, real identifiers, raw payloads. |
| Unit/contract tests | Pure/synthetic tests. | API/DB/browser/smoke unless separately approved. |
| API/browser/smoke tests | Local-only tests if separately approved. | Shared/prod/Zeabur, provider sending, production data. |
| DB/persistence | Only a separate DB-authorized task. | Default runtime spike scope. |

## Authorization Required Before Each Candidate Task

Every candidate task requires a fresh scope check.

Minimum authorization fields:

- exact allowed file paths or directories,
- whether backend `src/` may be modified,
- whether tests may be added,
- whether fixtures may be added,
- whether commands may be run,
- whether DB is explicitly excluded,
- whether shared/prod/Zeabur is explicitly excluded,
- confirmation no production data may be used.

No candidate task inherits DB, provider, AI, or shared runtime permission from
another task.

## Stop Conditions

Codex must stop if:

- authorization is missing or ambiguous,
- requested change touches files outside approved scope,
- DB/DDL/migration becomes necessary,
- shared/prod/Zeabur access becomes necessary,
- production data becomes necessary,
- provider sending becomes necessary,
- AI provider/RAG/vector DB becomes necessary,
- raw token/channel/customer data appears in fixtures or output,
- safe-deny equivalence cannot be preserved,
- organization isolation cannot be preserved,
- finalAppointmentId would be decided by the customer-facing chain,
- Field Service Report invariant would be weakened.

## Security / Privacy / Organization Isolation Boundaries

Future tasks must preserve:

- organization isolation,
- Data Access Control / Data Permission Model,
- customer visible data policy,
- internal data policy,
- generic safe-deny,
- no existence leakage,
- response equivalence,
- allow-list first,
- unknown field default deny,
- forbidden field default deny,
- channel-agnostic identity,
- token/link is not customer identity,
- `line_user_id` is not global identity,
- no provider sending,
- no AI automatic decision,
- no real sensitive data in test fixtures or outputs.

Future outputs must not contain:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing / settlement internal data,
- vendor reconciliation rules,
- engineer internal comments,
- supervisor review,
- raw token,
- raw channel id,
- `line_user_id`,
- complete phone number,
- complete address,
- permission / entitlement internal reason,
- rate-limit / abuse reason,
- resolver denial reason.

## Explicit Non-goals

Task430 does not:

- modify `src/`,
- modify `admin/src/`,
- modify utilities,
- modify projection utilities,
- modify projection DTO utilities,
- modify forbidden field constants,
- modify response envelope utilities,
- modify safe-deny utilities,
- modify customerAccessContext utilities,
- add route files,
- add controller files,
- add API runtime,
- add resolver files,
- add repository runtime,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- add browser tests,
- add scan scripts,
- add CI configuration,
- modify localization files or message catalogs,
- modify `package.json`,
- add permission runtime,
- add audit/security event query runtime,
- add audit/security event tables,
- add support workflow runtime,
- add case runtime,
- add complaint runtime,
- add follow-up runtime,
- add link reissue runtime,
- add middleware,
- add rate-limit runtime,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger provider sending,
- trigger LINE/SMS/Email/App/survey sending,
- call AI provider,
- call RAG,
- call vector DB,
- modify Inventory docs,
- process real token, secret, `DATABASE_URL`, raw channel id, complete customer
  phone number, complete customer address, raw provider payload, or production
  data,
- claim runtime has been authorized.

## Verification Plan

For Task430 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- sensitive scan on this document for actual credentials, tokens, complete
  customer personal data, raw channel identifiers, raw provider payloads, and
  production data.

Do not run:

- DB commands,
- API tests,
- browser tests,
- smoke tests,
- migration commands,
- `psql`,
- `npm run db:migrate`.

## Completion Report Checklist

Completion report must include:

- modified files,
- whether the task was docs-only,
- summary of implemented documentation,
- what was not implemented,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether data tables were added or modified,
- whether API was added or modified,
- whether permission logic was added or modified,
- whether audit log was added or modified,
- whether smoke tests were added or modified,
- whether sensitive data, token, secret, personal data, or LINE-related logic
  was touched,
- whether customer channel identity, organization isolation, SaaS-ready,
  entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO were
  affected,
- future tasks, listed only and not implemented.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
