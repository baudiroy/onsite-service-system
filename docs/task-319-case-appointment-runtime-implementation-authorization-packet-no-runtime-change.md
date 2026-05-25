# Task 319 - Case / Appointment Runtime Implementation Authorization Packet / No Runtime Change

## Scope And Non-goals

This document follows Task318 and creates a docs-only authorization preparation packet for the proposed future runtime target: Case / Appointment core workflow hardening.

Task319 does not approve implementation. It defines what PM / product / engineering must explicitly authorize before any future runtime task can modify code, APIs, schema, DB, tests, smoke scripts, fixtures, package files, or operational behavior.

This task is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- test / smoke implementation,
- fixture change,
- package change,
- Case runtime change,
- Appointment runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- customer-visible summary runtime,
- customer fee consent runtime,
- quote runtime,
- billing / settlement runtime,
- customer channel identity runtime,
- notification runtime,
- AI / RAG runtime,
- provider sending,
- report / export / download runtime.

Task319 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, views, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why Authorization Packet Is Needed After Task318

Task318 closed the MVP readiness detail branch and recommended, as future-only guidance, that the first runtime candidate could be Case / Appointment core workflow hardening.

That recommendation is not implementation approval.

Before runtime begins, PM must explicitly authorize:

- which files and layers can be touched,
- whether API behavior may change,
- whether schema or indexes may change,
- whether DB / DDL is allowed,
- whether tests and smoke scripts can be modified,
- what rollback and safety plan applies,
- how organization isolation, Data Access, and audit readiness will be protected.

Task319 prepares that checklist so the next step cannot accidentally treat readiness docs as runtime approval.

## Proposed Future Runtime Target / Not Approved

Proposed future runtime target:

**Case / Appointment core workflow hardening.**

This target may include future work around:

- appointment creation guards,
- appointment update guards,
- one-open-appointment invariant,
- reschedule / cancel / follow-up semantics,
- appointment outcome taxonomy,
- Case status transition boundaries,
- organization-scoped appointment access.

Task319 does not approve any of this runtime work.

## Required Explicit PM Approvals Before Runtime

Before a future implementation task starts, PM must explicitly approve the relevant items below.

### Backend Files / Layers Allowed List

Future task must list exactly which backend files or layers are allowed.

Possible categories:

- Case service layer,
- Case repository layer,
- Appointment service layer,
- Appointment repository layer,
- Field Service Report service layer, if completion or finalAppointmentId is touched,
- Dispatch / multi-dispatch layer,
- validators,
- controllers,
- routes,
- transaction / DB helper layer.

No backend file is approved by Task319.

### Admin Files / Layers Allowed List

If Admin UI is needed, future task must list exact Admin files or areas.

Possible categories:

- Case detail page,
- appointment timeline,
- dispatch panel,
- appointment create / reschedule forms,
- error display,
- API client types.

No Admin file is approved by Task319.

### API Contract Allowed List

Future task must explicitly approve any API contract changes.

Possible areas:

- create appointment,
- update appointment,
- cancel appointment,
- reschedule appointment,
- appointment outcome update,
- multi-dispatch,
- Case status transition,
- appointment timeline response,
- error status and safe error message.

No API change is approved by Task319.

### Migration / Schema / Index Allowed List

If future runtime needs DB-level hardening, PM must explicitly approve schema work.

Possible areas:

- partial unique constraint or equivalent for one-open-appointment,
- appointment status / visit result taxonomy changes,
- index for appointment lookup,
- soft-delete / active flag handling,
- organization-scoped constraints.

No migration, schema, index, view, DB, or DDL work is approved by Task319.

### Test / Smoke / Fixture Allowed List

Future task must explicitly approve test/smoke files.

Possible areas:

- backend smoke for appointment lifecycle,
- one-open-appointment guard smoke,
- multi-dispatch smoke,
- browser smoke for Admin appointment timeline,
- regression fixtures for reschedule / cancel / pending parts / pending quote.

No test, smoke, fixture, or package change is approved by Task319.

### Rollback / Safety Plan

Future runtime task must include:

- rollback plan,
- failure mode analysis,
- safe error behavior,
- legacy data compatibility,
- organization isolation checks,
- no destructive cleanup confirmation,
- no shared runtime mutation unless explicitly approved.

### Audit / Data Access / Organization Isolation Review

Future runtime task must confirm:

- all reads and writes are organization-scoped,
- cross-organization appointment access is rejected,
- engineer-visible data remains scoped to assigned or authorized work,
- customer-visible data remains behind safe-deny and allow-list policies,
- appointment lifecycle changes can be audited where required,
- internal-only data is not exposed.

## Candidate Runtime File Review List / Future-only

The following are review candidates only. They are not approved for modification by Task319.

### Case Candidates

- Case service candidates.
- Case repository candidates.
- Case status transition candidates.
- Case timeline / activity side-effect candidates, if used by appointment changes.

### Appointment Candidates

- Appointment service candidates.
- Appointment repository candidates.
- Appointment validators.
- Appointment create / update / cancel / reschedule logic.
- Appointment visit result / outcome logic.

### Field Service Report Candidates

- Field Service Report service candidates, if finalAppointmentId or completion state is affected.
- Field Service Report repository candidates, if report lookup is needed for invariants.
- finalAppointmentId resolution candidates.

### Transaction / DB Helper Candidates

- DB transaction helper candidates.
- Query helper candidates.
- Locking or conditional update helper candidates, if a future task approves concurrency work.

### Route / Controller Candidates

- Appointment route / controller candidates.
- Case route / controller candidates.
- Dispatch route / controller candidates.
- Error response mapping candidates.

### Admin UI Candidates

- Case detail page candidates.
- Dispatch panel candidates.
- Appointment timeline candidates.
- Admin API client candidates.
- Form submission / error display candidates.

### Smoke / Regression Candidates

- Appointment lifecycle smoke candidates.
- One-open-appointment smoke candidates.
- Multi-dispatch regression candidates.
- Browser smoke candidates for appointment timeline and duplicate open appointment errors.

## Authorization Decision Matrix

`Allowed in Task319` is `No` for every row.

| Scope item | Why needed | Current status | PM approval required? | Allowed in Task319? | Future task needed? |
| --- | --- | --- | --- | --- | --- |
| Backend Case service/repository | May enforce Case status and appointment invariant boundaries. | Candidate only | Yes | No | Yes |
| Backend Appointment service/repository | May enforce appointment create/update/reschedule guards. | Candidate only | Yes | No | Yes |
| Field Service Report service/repository | May be needed if finalAppointmentId or completion is touched. | Candidate only | Yes | No | Yes |
| Routes/controllers/validators | May be needed for request validation and safe errors. | Candidate only | Yes | No | Yes |
| Admin Case/appointment UI | May be needed if UX must display guard errors or state taxonomy. | Candidate only | Yes | No | Yes |
| API contract | Required before any payload/response/status behavior changes. | Not approved | Yes | No | Yes |
| Migration/schema/index | Required before DB-level constraint or index work. | Not approved | Yes | No | Yes |
| DB/DDL execution | Required before any database change or dry-run. | Not approved | Yes | No | Yes |
| Tests/smoke/fixtures | Required before modifying or adding verification scripts. | Not approved | Yes | No | Yes |
| Package changes | Required before changing scripts or dependencies. | Not approved | Yes | No | Yes |
| Rollback/safety plan | Required for runtime implementation. | Not prepared in detail | Yes | No | Yes |
| Organization isolation review | Required before runtime because appointments are tenant-scoped. | Required gate | Yes | No | Yes |
| Data Access review | Required before customer/engineer/admin visibility changes. | Required gate | Yes | No | Yes |
| Audit readiness review | Required before lifecycle changes that need traceability. | Required gate | Yes | No | Yes |

## Hard Runtime Block Conditions

Runtime must not start if any relevant condition below is true:

- No approved file / layer list.
- No API contract approval.
- No schema / index approval when needed.
- No DB / DDL approval when needed.
- No test / smoke approval when expected.
- No rollback plan.
- No organization isolation review.
- No Data Access review.
- No audit readiness review.
- No appointment state taxonomy approval when state classification is affected.
- No concurrency / transaction design when concurrent create/update risks are affected.
- No clear confirmation that AI will not auto-create, reopen, close, or decide appointments.

## Guardrail Restatement

Future runtime work must preserve:

- one Case = one formal Field Service Report,
- multiple appointments / dispatch visits per Case,
- no multiple open appointments per Case,
- finalAppointmentId backend/system-owned,
- no AI auto-decision,
- no provider sending unless explicitly approved,
- no customer-visible/internal-only leakage,
- organization isolation,
- Data Access Control,
- audit readiness where lifecycle evidence is required.

## Runtime Forbidden Confirmation

Task319 explicitly does not approve:

- backend runtime,
- Admin runtime,
- API changes,
- migration changes,
- schema changes,
- index changes,
- view changes,
- DB connection,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- tests,
- smoke scripts,
- fixtures,
- package changes,
- Case runtime changes,
- Appointment runtime changes,
- Field Service Report runtime changes,
- finalAppointmentId runtime changes,
- customer-visible summary runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- customer channel identity runtime,
- notification runtime,
- AI / RAG runtime,
- provider sending,
- report / export / download runtime,
- inventory documentation changes.

## Conclusion

Task319 is docs-only authorization preparation.

It does not approve Case / Appointment runtime implementation.

Future implementation may use this packet to request explicit PM approval, but runtime cannot begin until a separate task approves files/layers, API contracts, schema/DB/test boundaries, rollback plan, organization isolation, Data Access, audit readiness, and safety constraints.
