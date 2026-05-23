# Task 883 - Data Correction Decision Audit Branch Status Dashboard

Status: completed

## Purpose

This dashboard gives PM / Codex a compact status view for the Task869 through Task882 Data Correction decision audit branch.

It is docs-only and does not authorize DB execution, migration execution, audit writer runtime, repository runtime, public API changes, provider traffic, AI/RAG, billing/settlement, permission expansion, smoke tests, package changes, or correction behavior changes.

## Current Branch Status

The Data Correction decision audit branch is currently:

- no DB
- no `psql`
- no `npm run db:migrate`
- no DDL
- no SQL execution
- no dry-run
- no apply
- no runtime audit writer / sink
- no repository runtime
- no public API shape change
- no permission runtime expansion
- no provider / LINE / SMS / App push / webhook / email traffic
- no AI / RAG runtime
- no billing / settlement runtime

Migration 025 exists, but it remains authoring-only / no-apply / no-dry-run / no-DB.

## Existing Artifacts

### Task869 through Task871 - Audit Intent Side-channel

- Task869: pure Data Correction decision `auditIntent` builder.
- Task870: internal opt-in side-channel for request/apply service callers.
- Task871: side-channel closure guard.

Current invariant:

- `auditIntent` is internal opt-in only.
- `auditIntent.auditWritten` is `false`.
- default / public service response shape remains unchanged.
- no route / controller / public API response body exposes `auditIntent`.

### Task872 through Task879 - Persistence Readiness Without DB

- Task872: persistence readiness packet.
- Task873: schema proposal.
- Task874: migration authorization packet.
- Task875: migration draft plan.
- Task876: migration file creation preflight gate.
- Task877: Migration 025 no-apply file.
- Task878: disposable DB dry-run authorization packet.
- Task879: redacted dry-run result template.

Current invariant:

- `migrations/025_create_data_correction_decision_audit_events.sql` exists.
- Migration 025 remains no DB.
- Migration 025 remains no `psql`.
- Migration 025 remains no `npm run db:migrate`.
- Migration 025 remains no DDL.
- Migration 025 remains no SQL execution.
- Migration 025 remains no dry-run.
- Migration 025 remains no apply.
- Migration 025 remains no runtime authorization.

### Task880 through Task882 - Closure / Handoff / Guard

- Task880: no-DB branch closure checkpoint.
- Task881: PM continuation handoff.
- Task882: PM handoff static guard.

Current invariant:

- generic "continue", "go ahead", "approved", "keep going", or "I agree" language is not authorization for DB execution, migration apply, repository runtime, audit writer runtime, or public API shape changes.
- future continuation requires explicit approval for the exact branch boundary being crossed.

## Data Correction Separation

The request/apply separation remains unchanged:

- `data_correction_request` remains a manual-handling / decision path.
- `data_correction_request` must not create official correction applications.
- official correction application remains limited to valid `pre_departure_apply`.
- phone / LINE / App channel identity changes remain re-verification paths.
- post-departure correction remains manual contact / dispatch note / audit intent metadata.
- unable-to-complete appointment result remains appointment-result metadata, not Field Service Report completion.
- follow-up proposal remains a draft / proposal, not formal appointment creation.

## Hard No-go Boundaries

The branch must not proceed into any of the following without a separate explicit task and authorization:

- DB connection
- `psql`
- `npm run db:migrate`
- DDL
- SQL execution
- disposable DB dry-run
- migration apply
- Migration 025 modification
- audit writer / sink runtime
- repository / runtime persistence
- transaction wiring
- route / controller / DTO / public API body change
- permission runtime expansion
- provider / LINE / SMS / App push / webhook / email traffic
- AI / RAG runtime
- billing / settlement runtime
- smoke / integration test expansion
- package changes
- secret / credential / provider config changes
- data mutation / correction behavior changes

## Explicit-approval-only Next Candidates

The next task may choose one bounded branch only:

1. Disposable local/test DB dry-run for Migration 025.
2. Migration 025 apply after dry-run acceptance.
3. Repository with injected DB only.
4. Audit writer with fake DB unit tests only.
5. Service injected writer path.
6. Route/controller/API exposure only if product explicitly accepts a public API shape change.
7. Permission runtime expansion for audit event access.
8. Smoke / integration coverage only after DB and runtime approval.

Each candidate must state exact allowed files, forbidden files, runtime/API/DB/migration/audit/provider/AI/smoke permissions, stop conditions, and verification commands.

## Sensitive Data Boundary

Future work must not store or output:

- before / after values
- raw correction payload
- raw phone / mobile
- raw address
- raw LINE user id
- token
- secret
- credentials
- DB URL
- stack traces
- SQL input containing secrets
- `finalAppointmentId`
- Field Service Report id / report id
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- provider payload
- customer-visible report body
- photos
- signatures
- files
- file contents

## Resume Guidance

If PM wants to continue safely without crossing runtime or DB boundaries, stay in docs/static guard tasks.

If PM wants to cross into dry-run, apply, repository, audit writer, service writer, API, permission, smoke, or runtime behavior, the next task must include explicit approval language and should not rely on generic continuation wording.

## Scope Confirmation

Task883 is docs-only:

- no `src/**` change
- no `admin/src/**` change
- no migration creation, modification, dry-run, or apply
- no DB / `psql` / DDL / SQL execution
- no repository
- no audit writer / sink
- no API / route / controller / DTO change
- no permission runtime expansion
- no provider / LINE / SMS / App push / webhook / email change
- no AI / RAG runtime change
- no billing / settlement change
- no package change
- no smoke / integration test change
- no sensitive data, token, secret, LINE access token, channel secret, DB credential, or AI provider config touched

## Verification

Executed commands:

```bash
test -f docs/task-883-data-correction-decision-audit-branch-status-dashboard-docs-only-no-runtime.md
grep -Ei "Task869|Task882|Data Correction|auditIntent|Migration 025|no DB|no dry-run|no apply|audit writer|repository|explicit approval|pre_departure_apply|data_correction_request" docs/task-883-data-correction-decision-audit-branch-status-dashboard-docs-only-no-runtime.md
git diff --check -- docs/task-883-data-correction-decision-audit-branch-status-dashboard-docs-only-no-runtime.md
```

Results:

- `test -f docs/task-883-data-correction-decision-audit-branch-status-dashboard-docs-only-no-runtime.md`: PASS.
- `grep -Ei "Task869|Task882|Data Correction|auditIntent|Migration 025|no DB|no dry-run|no apply|audit writer|repository|explicit approval|pre_departure_apply|data_correction_request" docs/task-883-data-correction-decision-audit-branch-status-dashboard-docs-only-no-runtime.md`: PASS.
- `git diff --check -- docs/task-883-data-correction-decision-audit-branch-status-dashboard-docs-only-no-runtime.md`: PASS.
