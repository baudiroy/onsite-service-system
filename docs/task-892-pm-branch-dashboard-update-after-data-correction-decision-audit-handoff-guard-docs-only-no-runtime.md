# Task 892 - PM Branch Dashboard Update after Data Correction Decision Audit Handoff Guard

Status: completed

## Goal

Create a PM branch dashboard after Task891 so the next PM / Codex conversation can choose the next bounded branch without accidentally treating prior handoffs as runtime approval.

This document is docs-only / no runtime. It does not authorize DB execution, migration dry-run/apply, repository runtime promotion, default audit writer configuration, public API changes, provider/LINE/SMS/App push/webhook/email work, AI/RAG runtime, billing/settlement runtime, admin UI work, smoke/integration expansion, package changes, secrets/config changes, or data mutation behavior changes.

## Current Branch Status

### Data Correction Decision Audit after Task891

Current status:

- Task891 completed the Data Correction decision audit runtime-adjacent handoff static guard.
- Task890 remains the PM continuation handoff for Task869-889.
- `auditIntent` remains internal opt-in only.
- `auditIntent.auditWritten` remains `false` unless future explicit persistence is approved.
- The service-level `decisionAuditWriter` path remains opt-in only through explicit injection.
- Repository / writer work remains injected-only and unit/fake-DB scoped.
- No global DB / pool / `pg` import is configured.
- No default audit writer / sink exists.
- Public/default response shape remains unchanged.
- Generic continuation language is not authorization for DB execution, migration apply, repository runtime, audit writer runtime, public API shape changes, provider work, AI/RAG, billing/settlement, or secrets/config work.

Current no-go boundary:

- no DB
- no `psql`
- no `npm run db:migrate`
- no DDL / SQL execution
- no dry-run
- no apply
- no Migration 025 execution
- no default audit writer
- no repository runtime promotion
- no service/app/API persistence promotion
- no public API response change
- no permission expansion
- no provider/webhook/email
- no AI/RAG
- no billing/settlement
- no admin/package/smoke/integration
- no secrets/config

### Data Correction Request / Apply after Task868

Current status:

- Task868 closed the Data Correction request/apply branch.
- `data_correction_request` remains a request/manual-handling decision path.
- Official correction application remains limited to valid `pre_departure_apply`.
- Request path must not mutate official Case, Appointment, Field Service Report, customer identity, phone, channel identity, parts, billing, settlement, or `finalAppointmentId` data.
- Phone/channel identity changes still require re-verification.
- Post-departure, arrived, unsafe, malformed, permission-denied, phone re-verification, and writer-failure paths must not create official correction application.
- There is no silent overwrite.
- There is no manual fallback from failed apply.
- There is no finalAppointmentId mutation.
- There is no DB, migration, API shape expansion, real audit sink, admin, provider, AI/RAG, billing, or settlement runtime from this closure.

Potential next candidates:

- explicit correction persistence planning after separate approval.
- post-departure contact log / dispatch note runtime branch after separate approval.
- unable-to-complete appointment result runtime branch after separate approval.
- follow-up appointment creation branch after separate approval.
- targeted smoke/integration after any approved runtime branch.

### Brand Referral / Brand Official LINE after Task735-781

Current status:

- Task735 established the Brand Referral source recognition policy baseline.
- Task781 closed Brand Referral Migration 024 and related audit/contact persistence readiness at no-DB / no-runtime.
- Migration 024 exists as an authoring-only artifact.
- Migration 024 has no DB connection, no `psql`, no `npm run db:migrate`, no DDL, no SQL execution, no dry-run, and no apply.
- Injected audit/contact writer work remains injected-only with fake/unit boundaries.
- No default real DB writer is configured.
- Public route behavior remains normalization-only and excludes writer internals from public response bodies.
- No Case/intake creation, identity verification, Case Binding, provider/LINE/webhook, AI/RAG, entitlement/billing, admin, package, or smoke behavior is authorized by the branch.

Product/security invariants:

- Brand Official LINE / Brand Channel Integration must keep brand entry, identity verification, and Case Binding separate.
- LINE identity remains scoped by `organization_id + line_channel_id + line_user_id`.
- Unverified users cannot query case data.
- Brand Knowledge AI / RAG and Customer Case AI remain separated by customer-visible and permission-aware boundaries.

Potential next candidates:

- Migration 024 disposable local/test DB dry-run after explicit DB approval.
- real audit/contact persistence writer configuration after explicit approval.
- identity verification and Case Binding runtime.
- repair intake handoff.
- provider/LINE/webhook integration.
- Brand Knowledge AI/RAG add-on.
- entitlement and usage tracking.
- admin UI and smoke coverage.

### Engineer Mobile after Task800/801

Current status:

- Task800 recorded the Engineer Mobile runtime-adjacent milestone after injected repository and permission / assignment guard branches.
- Task801 added a static guard for the Task800 checkpoint.
- Migration 022 exists as an authored artifact.
- Migration 022 remains paused: no DB, no `psql`, no `npm run db:migrate`, no DDL, no local dry-run, no shared apply, and no runtime writes.
- Injected repository remains fake DB / unit-test only.
- Permission / assignment guard remains optional, injected, synthetic-context only, read-path only, and explicit opt-in.
- Default guard-disabled behavior remains backward compatible.
- App-like HTTP behavior remains `createApp` / `app.handle(req, res)` only with no listen or server start.
- List response shape remains `status` / `tasks`.
- Detail response shape remains `status` / `detail`.
- No completion write, Field Service Report write, provider sending, AI/RAG runtime, admin/mobile UI, package change, smoke/integration, or `finalAppointmentId` exposure/inference/mutation is authorized.

Product invariants:

- one Case = one formal completion report.
- one Case may have multiple appointments / dispatch visits.
- Engineer Mobile read behavior does not create, mutate, or infer Field Service Report ownership.
- `finalAppointmentId` remains backend/system-owned.
- Engineer Mobile should not expose `finalAppointmentId` to engineers as a normal workflow choice.

Potential next candidates:

- Migration 022 disposable local/test DB dry-run after explicit DB approval.
- real DB read adoption.
- real permission service integration.
- real assignment resolver integration.
- audit writer integration.
- task-read evidence logging.
- completion submission design.
- Field Service Report write flow.
- provider sending / notification integration.
- AI/RAG helper.
- admin/mobile UI behavior.
- smoke/integration coverage.

### ISO27001-aligned Foundational Controls after Task854-861

Current status:

- Task854 created the ISO27001-aligned system controls roadmap baseline.
- Task861 added an integration guard for foundational policy modules.
- Covered roadmap areas include data classification, field-level visibility, export control, file access control, AI retrieval guard, provider secret management, audit log viewer, access review report, incident evidence, and backup / restore evidence.
- Foundational runtime priorities remain: data classification, field-level visibility, export control, file access control, AI retrieval guard, and provider secret management.
- Admin / audit UI priorities remain later: audit log viewer, access review report, incident evidence log, and backup / restore evidence report.
- Task861 proved the six foundational ISO policy modules compose safely in tests without new runtime wiring.
- No API, DB, migration, provider, AI/RAG runtime, prompt, embedding, file runtime, signed URL runtime, permission runtime, audit runtime, smoke, or secret/config behavior was changed by the roadmap/guard.

Potential next candidates:

- data classification runtime baseline.
- field-level visibility runtime slice.
- export control permission/audit slice.
- file access control signed URL/audit slice.
- AI retrieval guard runtime slice.
- provider secret management guard.
- audit log viewer.
- access review report.
- incident evidence log.
- backup / restore evidence report.

## Migration Status Dashboard

### Migration 022

- File exists: `migrations/022_create_engineer_mobile_read_model.sql`.
- Status: no-apply / no-dry-run / no-DB.
- No `psql`.
- No `npm run db:migrate`.
- No DDL execution.
- No SQL execution.
- No runtime writes.
- Any dry-run/apply/runtime adoption requires separate explicit approval.

### Migration 024

- File exists: `migrations/024_create_brand_referral_contact_events.sql`.
- Status: no-apply / no-dry-run / no-DB.
- No `psql`.
- No `npm run db:migrate`.
- No DDL execution.
- No SQL execution.
- No audit/contact persistence promotion.
- Any dry-run/apply/runtime adoption requires separate explicit approval.

### Migration 025

- File exists: `migrations/025_create_data_correction_decision_audit_events.sql`.
- Status: no-apply / no-dry-run / no-DB.
- No `psql`.
- No `npm run db:migrate`.
- No DDL execution.
- No SQL execution.
- No decision audit persistence promotion.
- Any dry-run/apply/runtime adoption requires separate explicit approval.

## Cross-Branch Product Invariants

These invariants remain active across all branches:

- One Case = one formal completion report.
- One Case may have multiple appointments / dispatch visits.
- Field Service Report remains the onsite Case-level final completion summary, not one report per visit.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains backend/system-owned.
- Manual `finalAppointmentId` selection is admin override only.
- LINE identity is scoped by `organization_id + line_channel_id + line_user_id`.
- Unverified users cannot query case data.
- Customer-facing data must not include internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comments, supervisor review, unconfirmed appointment suggestions, or cross-organization data.
- No silent overwrite of official data.
- AI remains assistant-oriented and must not auto-dispatch, auto-complete, auto-settle, approve formal fees, approve billing/settlement, or close complaints.
- Organization isolation, permission checks, customer-visible data policy, field-level visibility, audit log, and SaaS-ready entitlement/usage boundaries remain active.

## No Current Approval

No active branch currently has approval for:

- DB connection
- `psql`
- `npm run db:migrate`
- DDL / SQL execution
- migration dry-run
- migration apply
- shared/staging/production apply
- provider sending
- LINE / SMS / App push / webhook / email runtime
- AI / RAG runtime
- admin UI expansion
- smoke / integration expansion
- package changes
- secrets/config/provider credential changes
- public API shape changes
- default audit writer/sink
- repository runtime promotion
- service/app/API persistence promotion
- billing / settlement runtime

Generic phrases such as "continue", "go ahead", "approved", "keep developing", or "next task" are not authorization for DB execution, migration apply, repository runtime, audit writer runtime, public API shape changes, provider/AI work, billing/settlement, or secrets/config work.

## Recommended Next Candidates

The next PM task should choose exactly one bounded branch and explicitly state allowed files, forbidden files, verification commands, and stop conditions.

Candidate branches requiring explicit approval:

1. Migration 022 disposable local/test DB dry-run.
2. Migration 024 disposable local/test DB dry-run.
3. Migration 025 disposable local/test DB dry-run.
4. Data Correction real repository / audit writer promotion.
5. Data Correction permission/audit runtime expansion.
6. Data Correction post-departure contact log / dispatch note runtime.
7. Unable-to-complete appointment result runtime.
8. Follow-up appointment creation runtime.
9. Engineer Mobile real DB read adoption.
10. Engineer Mobile permission / assignment service integration.
11. Brand Referral identity verification / Case Binding runtime.
12. Brand Official LINE provider/webhook integration.
13. Brand Knowledge AI / RAG add-on design or runtime.
14. ISO data classification or field-level visibility runtime slice.
15. ISO export/file access/AI retrieval/provider secret guard runtime slice.
16. Targeted smoke/integration coverage after a specific approved runtime branch.

## Runtime Decision

Task892 is docs-only / no runtime.

It does not modify:

- `src/**`
- `admin/src/**`
- `migrations/**`
- API routes / controllers / services / repositories
- app / server / router files
- DB connection / schema / repository runtime
- provider / LINE / SMS / App push / webhook / email runtime
- AI / RAG runtime
- billing / settlement runtime
- permission runtime
- audit writer / audit sink runtime
- smoke / integration tests
- `package.json`
- `package-lock.json`
- `.env*`
- token / secret / credential / provider config

## Verification

Executed commands:

```bash
test -f docs/task-892-pm-branch-dashboard-update-after-data-correction-decision-audit-handoff-guard-docs-only-no-runtime.md
grep -Ei "Task891|Data Correction|Migration 025|Brand Referral|Migration 024|Engineer Mobile|Migration 022|ISO27001|no DB|no dry-run|no apply|explicit approval" docs/task-892-pm-branch-dashboard-update-after-data-correction-decision-audit-handoff-guard-docs-only-no-runtime.md
git diff --check -- docs/task-892-pm-branch-dashboard-update-after-data-correction-decision-audit-handoff-guard-docs-only-no-runtime.md
```

Results:

- `test -f ...`: PASS.
- `grep -Ei ...`: PASS.
- `git diff --check -- ...`: PASS.
