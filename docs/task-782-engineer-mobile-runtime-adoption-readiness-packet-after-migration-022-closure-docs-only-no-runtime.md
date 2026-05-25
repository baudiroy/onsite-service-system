# Task782 - Engineer Mobile Runtime Adoption Readiness Packet after Migration 022 Closure / Docs Only No Runtime

Status: completed

Scope: docs only / no runtime change / no DB

## Purpose

Task782 records the explicit approval gates required before any future Engineer Mobile runtime adoption after the Migration 022 and read-model no-DB closure.

Task716-724, Task729, and Task775 closed the current Engineer Mobile readiness branch as no-DB and read-model only. This packet does not authorize DB reads, API adoption, completion writes, provider sending, AI/RAG, smoke tests, package changes, or Migration 022 dry-run/apply.

## Current Closed Branch State

The current accepted Engineer Mobile branch state is:

- Task716-724: mapper/migration alignment, rollback safety, dry-run authorization, dry-run result template, sanitized fixtures, fixture mapper consumption, negative boundary, injected provider redaction, and detail redaction are covered.
- Task729: read-model branch closure is complete.
- Task775: Migration 022 no-DB readiness closure is complete.
- Migration 022 exists as an authoring/readiness artifact only.
- Migration 022 remains no DB, no psql, no db:migrate, no DDL, no SQL execution, no dry-run, and no apply.
- Engineer Mobile output remains a safe read-model boundary.
- No completion/report write service is authorized.
- No `finalAppointmentId` mutation is authorized.

## Future Runtime Candidates

The following are separate future candidates. Each requires its own bounded task and explicit approval.

### 1. Repository Read Model with Injected DB Only

Future scope:

- Add an injected repository read path for Engineer Mobile task list/detail.
- Keep DB client/executor injected.
- Keep query allow-list narrow and read-only.
- Keep output mapped through existing redaction and read-model mappers.

Approval gates:

- API allowed or not.
- DB read allowed or not.
- Repository files allowed or not.
- Migration 022 dry-run/apply status.
- Permission and audit requirements.
- Test scope.

This should be the first future runtime slice if runtime adoption is approved later. It should be repository-read only and must not include completion writes.

### 2. Public/Internal API Adoption for Task List and Detail

Future scope:

- Expose or wire task list/detail read-model data behind an approved API boundary.
- Preserve assignment and organization scope.
- Preserve redacted response shape.
- Avoid provider sending and completion write behavior.

Approval gates:

- Route/controller/service files.
- Authentication/session behavior.
- Permission middleware.
- API response contract.
- Unit/integration/smoke coverage.

### 3. Permission and Assignment Guard Runtime

Future scope:

- Enforce engineer assignment scope.
- Enforce organization scope.
- Enforce role/permission checks.
- Deny access to other engineers' tasks and other organizations' cases.

Approval gates:

- Permission model files.
- Audit log behavior.
- Denial response contract.
- Test coverage for cross-assignment and cross-organization access.

### 4. Mobile Completion Submission Design

Future scope:

- Design mobile completion submission as source data for the case-level completion flow.
- Keep engineer input low-burden.
- Keep Field Service Report finalization backend/system-owned.
- Keep `finalAppointmentId` backend/system-owned.

Approval gates:

- Completion API and service files.
- Field Service Report behavior.
- Appointment terminal status behavior.
- Audit log and correction/amendment policy.
- Smoke/integration coverage.

### 5. Field Service Report Write Flow

Future scope:

- Convert accepted engineer completion source data into the formal Field Service Report flow.
- Preserve one Case = one formal completion report.
- Preserve multiple appointments / dispatch visits per Case.
- Preserve backend/system finalAppointmentId resolution.

Approval gates:

- Existing Field Service Report service/controller/repository files.
- Case/appointment update behavior.
- Repeat completion guard.
- Audit log behavior.
- Tests for no duplicate formal reports.

### 6. Provider / Notification Sending

Future scope:

- Notify engineer or customer through approved provider channels only after explicit provider task approval.
- Keep LINE, SMS, App push, webhook, and email provider behavior out of read-model tasks.

Approval gates:

- Provider files.
- Secret/config handling.
- Notification policy.
- Contact/audit log behavior.
- Usage tracking.

### 7. AI/RAG Helper Layer

Future scope:

- Add optional AI assistance after core runtime is stable.
- Keep AI permission-aware, tenant-isolated, auditable, RAG-grounded, and human-controlled.
- Use AI for suggestions, summaries, missing-evidence reminders, and confirmation cards only.

Approval gates:

- AI/RAG runtime files.
- Retrieval policy.
- Sensitive data masking.
- Usage tracking.
- Human accept/reject/edit flow.

### 8. Smoke / Integration Tests

Future scope:

- Add end-to-end or browser smoke coverage only after a bounded runtime slice exists.
- Keep smoke fixtures synthetic and safe.
- Do not connect shared runtime or run destructive cleanup unless separately approved.

Approval gates:

- Smoke script files.
- Dev server behavior.
- DB fixture policy.
- Sensitive output policy.

## Global Approval Gates Before Runtime Adoption

Any future Engineer Mobile runtime task must explicitly state whether it may change:

- API.
- DB / migration.
- Repository.
- Permission.
- Audit.
- Completion write.
- `finalAppointmentId`.
- Provider / notification.
- AI/RAG.
- Admin UI.
- Package files.
- Smoke tests.

Generic "continue" language is not approval for these areas.

## Runtime Boundaries That Remain Closed

Task782 keeps the following closed:

- No DB connection.
- No psql.
- No db:migrate.
- No DDL.
- No dry-run.
- No apply.
- No Migration 022 modification or execution.
- No repository DB read adoption.
- No API behavior change.
- No completion write.
- No Field Service Report creation/update.
- No `finalAppointmentId` mutation.
- No provider sending.
- No AI/RAG runtime.
- No admin UI.
- No package change.
- No smoke/integration test change.

## Sensitive Output Boundary

Future Engineer Mobile output must not expose:

- raw LINE id
- full phone
- full address
- internal notes
- audit raw payload
- AI raw payload
- billing/settlement internals
- Field Service Report id
- formal report id
- `finalAppointmentId`
- token
- secret
- DB URL

## Core Invariants

Engineer Mobile runtime adoption must preserve:

- one Case = one formal completion report
- multiple appointments / dispatch visits per Case
- Field Service Report remains the case-level final completion summary
- `finalAppointmentId` remains backend/system-owned
- engineers do not manually choose `finalAppointmentId` in normal flow
- organization scope and assignment scope are mandatory
- customer-visible data filtering remains enforced

## Current Runtime Decision

No runtime behavior changed.

No API behavior changed.

No DB behavior changed.

No migration was modified, dry-run, or applied.

No provider, AI/RAG, completion write, permission, audit, admin, package, or smoke behavior changed.

## Verification

Required verification:

```bash
test -f docs/task-782-engineer-mobile-runtime-adoption-readiness-packet-after-migration-022-closure-docs-only-no-runtime.md
grep -Ei "Migration 022|Engineer Mobile|repository|DB|read-model|completion|finalAppointmentId|permission|audit|provider|AI/RAG|smoke|explicit approval|no dry-run|no apply" docs/task-782-engineer-mobile-runtime-adoption-readiness-packet-after-migration-022-closure-docs-only-no-runtime.md
git diff --check -- docs/task-782-engineer-mobile-runtime-adoption-readiness-packet-after-migration-022-closure-docs-only-no-runtime.md docs/design/engineer-mobile-workbench.md
```
