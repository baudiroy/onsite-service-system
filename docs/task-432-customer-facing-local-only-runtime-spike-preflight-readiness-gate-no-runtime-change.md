# Task432 - Customer-Facing Local-Only Runtime Spike Preflight Readiness Gate / No Runtime Change

Task432 defines a preflight go / no-go readiness gate for any future
customer-facing local-only runtime spike.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to define the evidence PM and Codex must confirm before any
future local-only runtime task begins.

Task432 answers:

- which authorization items must exist,
- which scope boundaries must be confirmed,
- what gate outcomes mean,
- when Codex must stop.

## Non-Authorization Statement

Task432 is not runtime approval.

Task432 does not authorize:

- backend `src/` changes,
- route/controller implementation,
- resolver implementation,
- repository implementation,
- API implementation,
- tests,
- fixtures,
- smoke/browser/API tests,
- scan script / CI,
- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

## Relationship to Task428-Task431

Task428 closed the customer-facing runtime readiness branch and provided PM
handoff.

Task429 defined the authorization question template.

Task430 broke a possible future spike into candidate tasks.

Task431 mapped candidate tasks to future file touch categories.

Task432 turns those documents into a preflight readiness gate. It still does
not approve runtime.

## Mandatory Future Customer-Facing Flow

Any future authorized task must preserve:

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

## Preflight Readiness Gate Checklist

Before any future runtime task starts, every applicable row must be answered.

| Check | Required evidence | Gate if missing |
| --- | --- | --- |
| Task429-style explicit user authorization has been obtained. | User answered the authorization questions clearly and item by item. | NO-GO |
| Local-only scope is clear. | User confirmed local-only runtime spike scope. | NO-GO |
| Disposable local/test environment exists. | User confirmed disposable local/test environment. | NO-GO |
| Shared / prod / Zeabur are excluded. | User explicitly confirmed they are not targets. | NO-GO |
| Production data is prohibited. | User explicitly confirmed no production data. | NO-GO |
| Backend `src/` modification is separately authorized. | User explicitly approved backend `src/` scope if needed. | NO-GO for backend changes |
| Route/controller skeleton is separately authorized. | User explicitly approved route/controller skeleton. | NO-GO for route/controller |
| Resolver skeleton is separately authorized. | User explicitly approved resolver skeleton. | NO-GO for resolver |
| customerAccessContext skeleton is separately authorized. | User explicitly approved context skeleton or use. | NO-GO for context work |
| Projection DTO / projection service skeleton is separately authorized. | User explicitly approved projection scope. | NO-GO for projection work |
| Response envelope / generic safe-deny skeleton is separately authorized. | User explicitly approved envelope/safe-deny scope. | NO-GO for envelope work |
| Synthetic fixtures / tests are separately authorized. | User explicitly approved fixtures/tests if needed. | NO-GO for fixtures/tests |
| API / browser / smoke tests are separately authorized. | User explicitly approved those test types. | NO-GO for those tests |
| DB / DDL / migration / Migration020 dry-run/apply remains prohibited unless separately authorized. | User explicitly excludes DB or gives a separate DB-specific task. | NO-GO if mixed into runtime spike |
| Provider sending remains prohibited. | User confirms no LINE/SMS/Email/App/survey sending. | NO-GO if sending is needed |
| AI provider / RAG / vector DB remains prohibited. | User confirms no AI/RAG/vector DB. | NO-GO if AI/RAG is needed |
| Sensitive data remains prohibited. | No token, secret, `DATABASE_URL`, raw channel id, complete phone/address, production data. | NO-GO if needed |
| Organization isolation protection exists. | Future task states organization scope and fail-closed behavior. | NO-GO if unclear |
| Customer channel identity boundary exists. | Future task states channel identity is scoped and not global. | NO-GO if unclear |
| SaaS entitlement / usage boundaries are protected. | Future task states permission is not entitlement and usage is not access. | NO-GO if unclear |

## Gate Outcome Definitions: NO-GO / CONDITIONAL-GO / GO

### NO-GO

Use NO-GO when:

- any necessary authorization is missing,
- local-only scope is unclear,
- shared / prod / Zeabur target is not explicitly excluded,
- production data is not explicitly prohibited,
- DB / migration is mixed into runtime spike,
- provider sending is mixed into runtime spike,
- AI/RAG/vector DB is mixed into runtime spike,
- file scope is broad or ambiguous,
- organization isolation is unclear,
- customer channel identity boundary is unclear,
- safe-deny equivalence cannot be preserved.

NO-GO means Codex must not implement runtime work. Continue docs-only or ask a
clarifying authorization question.

### CONDITIONAL-GO

Use CONDITIONAL-GO when:

- user explicitly authorizes only the next minimum skeleton task,
- file scope is narrow,
- local-only and no-production-data boundaries are clear,
- shared / prod / Zeabur are excluded,
- DB/provider/AI remain prohibited,
- required fixtures/tests are either not needed or explicitly authorized.

CONDITIONAL-GO authorizes only the next single task and only the file categories
named by the user. It does not authorize tests, fixtures, DB, API smoke,
browser smoke, provider sending, AI/RAG, or later tasks by implication.

### GO

Use GO only when:

- all Task429 authorization questions are answered explicitly,
- the next single runtime task is named,
- allowed paths are named,
- commands are named,
- local-only environment is confirmed,
- all exclusions are clear.

GO means only that Codex may plan or execute the next single local-only runtime
task within the exact authorization. It does not mean the whole runtime branch
is active.

GO does not authorize:

- DB,
- migration,
- provider sending,
- AI/RAG/vector DB,
- smoke/browser/API tests,
- production data,
- shared/prod/Zeabur.

## Required Evidence Before Any Runtime Task

Evidence must include:

- task name,
- allowed file paths or directories,
- forbidden file paths or directories,
- allowed commands,
- forbidden commands,
- local-only environment confirmation,
- no production data confirmation,
- shared/prod/Zeabur exclusion,
- DB/DDL/migration exclusion or separate explicit DB authorization,
- provider sending exclusion,
- AI/RAG/vector DB exclusion,
- sensitive data exclusion,
- completion report checklist.

If evidence is not concrete, the gate is NO-GO.

## Stop Conditions

Stop immediately if:

- authorization is missing or ambiguous,
- a broader file scope is needed,
- DB/DDL/migration becomes necessary,
- shared/prod/Zeabur access becomes necessary,
- production data becomes necessary,
- provider sending becomes necessary,
- AI provider/RAG/vector DB becomes necessary,
- fixtures/tests are needed but not authorized,
- raw token/channel/customer data appears,
- organization isolation cannot be preserved,
- safe-deny equivalence cannot be preserved,
- finalAppointmentId would be decided by customer-facing chain,
- Field Service Report invariant would be weakened.

## Security / Privacy / Sensitive Data Boundaries

Future authorized work must not process or output:

- token,
- secret,
- actual `DATABASE_URL`,
- raw channel id,
- actual `line_user_id`,
- complete phone number,
- complete address,
- production data,
- raw provider payload,
- internal note,
- audit log,
- AI raw payload,
- billing/settlement internal data,
- signature/photo/file/document content.

Sensitive data in fixtures, logs, snapshots, errors, or reports is a NO-GO.

## Organization Isolation / Customer Channel Identity Boundaries

Future authorized work must preserve:

- organization scope,
- cross-tenant fail-closed behavior,
- channel-agnostic customer identity,
- `line_user_id` scoped by organization and channel, never global,
- token/link as access reference, not identity,
- no raw channel identity in output,
- no identity/consent/verification reason in customer-visible output.

## SaaS / Entitlement / Usage Boundary Notes

Future authorized work must preserve:

- permission is not entitlement,
- entitlement is not permission,
- subscription/seat/usage limits do not replace access decision,
- AI add-on does not bypass organization isolation,
- Enterprise SSO does not bypass organization isolation,
- no usage/billing event runtime unless separately authorized.

## Explicit Non-goals

Task432 does not:

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

For Task432 completion:

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
