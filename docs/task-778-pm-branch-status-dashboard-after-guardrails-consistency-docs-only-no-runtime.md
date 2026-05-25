# Task778 - PM Branch Status Dashboard after Guardrails Consistency / Docs Only / No Runtime

Status: completed.

Scope: PM branch status dashboard only.

This dashboard summarizes the currently closed or paused branches after Task777. It is planning/status documentation only. It does not authorize runtime promotion, DB work, migration dry-run/apply, provider/webhook work, AI/RAG runtime, admin UI, smoke tests, package changes, or credential/provider configuration changes.

## Global Runtime Boundary

No current branch has approval for:

- DB connection.
- `psql`.
- `db:migrate`.
- DDL execution.
- SQL execution.
- migration dry-run.
- migration apply.
- shared/prod/staging/Zeabur DB use.
- provider / LINE / SMS / App push / webhook / email sending.
- AI/RAG runtime.
- admin UI.
- smoke / integration tests.
- package changes.
- token, secret, credential, provider config, LINE access token, LINE channel secret, AI provider setting, or DB URL handling.

Generic approval phrases such as "continue", "go ahead", "approved", "keep going", or "continue runtime" do not authorize DB, migration, provider, AI/RAG, persistence, completion write, or mobile write behavior. Each next runtime task needs explicit bounded approval.

## Core Invariants

These invariants remain active across all branches:

- one Case = one formal completion report.
- one Case may have multiple appointments / dispatch visits.
- Field Service Report is the case-level formal completion summary for onsite service.
- multiple appointments do not imply multiple formal reports.
- `field_service_reports.case_id` uniqueness must not be weakened.
- `finalAppointmentId` is backend/system-owned.
- LINE user identity is scoped by `organization_id + line_channel_id + line_user_id`.
- unverified users cannot query case data.
- customer-facing data must follow customer-visible data policy.
- data correction must not silently overwrite phone/channel identity or post-departure dispatch data.
- AI may assist but must not autonomously approve, write, or decide official records.

## Branch Dashboard

| Branch | Status | Last accepted task | What exists | Still forbidden | Candidate next tasks requiring explicit approval |
| --- | --- | --- | --- | --- | --- |
| Brand Referral / Brand Official LINE / multi-channel | Paused/closed before DB dry-run/apply and before persistence promotion. | Task774 handoff; Task777 consistency guard references this branch. | Brand Official LINE design, multi official LINE channel design, Basic referral policies, guarded public normalization route, internal `auditIntent` side-channel, injected fake/unit writer path, Migration 024 authoring-only SQL file, closure checkpoints. | Migration 024 dry-run/apply, real audit/contact persistence, default writer, public API body expansion, identity verification, Case Binding, repair intake handoff, provider/LINE/webhook, AI/RAG, entitlement/billing, admin UI, smoke tests. | Migration 024 disposable local/test DB dry-run, Brand Referral persistence promotion behind injected DB, identity verification and Case Binding, repair intake handoff, provider/LINE webhook adapter, Brand Knowledge AI/RAG add-on, entitlement guard. |
| Engineer Mobile read-model / Migration 022 | Paused before repository/DB adoption and before mobile write actions. | Task776 combined handoff; Task775 no-DB readiness closure. | Engineer Mobile Workbench design, Migration 022 authoring-only file, mapper/migration alignment, rollback plan, dry-run authorization packet, dry-run result template, sanitized fixtures, provider/list/detail redaction, action intent boundary, read-model closure guard. | Migration 022 dry-run/apply, DB repository reads, completion writes, Field Service Report create/update, `finalAppointmentId` mutation, mobile write actions, photo/signature upload runtime, provider sending, AI/RAG, admin UI, smoke tests. | Migration 022 disposable local/test DB dry-run, read repository adoption, task detail/list read model wiring with explicit DB authorization, mobile status action runtime, completion submission design, upload/signature runtime planning. |
| Data Correction / Amendment Governance | Request/apply branch has runtime slices but remains bounded; no broad correction module expansion is implied. | Task868 branch closure guard; Task777 consistency guard references this branch. | Design doc, phone re-verification policy, pre-departure correction policy, post-departure freeze policy, unable-to-complete terminal appointment states, follow-up appointment proposal service, request/apply controller/service/writer safety guards, safe envelopes, redaction, no silent overwrite boundary. | Direct phone overwrite, post-departure silent dispatch mutation, second formal Field Service Report, completion amendment that bypasses audit, broad DB/migration expansion without explicit task, AI auto-approval, cross-organization data access. | Persisted correction workflow hardening, audit/contact-log persistence with explicit DB approval, admin review queue, customer-visible amendment policy, integration/smoke coverage, migration dry-run only with explicit authorization. |
| ISO27001-aligned foundational controls | Foundational policy/runtime baseline exists; management UI/reporting remains future work. | Task861 foundational policy integration guard. | Roadmap doc, data classification policy, field-level visibility policy, export control policy, file access control policy, AI retrieval guard policy, provider secret guard, foundational integration guard. | Treating roadmap as certification, bypassing organization scope, exposing sensitive fields in reports/exports/AI, provider secret runtime changes without explicit task, audit viewer/access-review runtime without bounded approval. | Audit log viewer, access review report, incident evidence log, backup/restore evidence report, export/download audit, file signed URL access control, AI retrieval runtime guard integration. |
| Project Short Instruction / PROJECT_GUARDRAILS consistency | Active static guard; no runtime implications. | Task777. | Static guard ensuring short instruction remains under 8000 characters, core hard boundaries remain present, guardrails keep current branch references, no real-looking sensitive values, and no wording implies paused DB/runtime approvals. | Short instruction bloat, duplicating full module detail in short instruction, using guardrail text as runtime approval, implying Migration 022/024 approval, implying persistence/AI/provider/runtime adoption. | Extend static guard when new branch-level source-of-truth docs are added, keep `docs/design/README.md` and task archive indexes updated, add additional doc drift tests if PM asks. |

## Migration Status

### Migration 022

`migrations/022_create_engineer_mobile_read_model.sql` exists as an authoring-only artifact. It remains:

- no DB connection.
- no `psql`.
- no `db:migrate`.
- no DDL execution.
- no SQL execution.
- no dry-run.
- no apply.
- no modification in this branch dashboard.

### Migration 024

`migrations/024_create_brand_referral_contact_events.sql` exists as an authoring-only artifact. It remains:

- no DB connection.
- no `psql`.
- no `db:migrate`.
- no DDL execution.
- no SQL execution.
- no dry-run.
- no apply.
- no modification in this branch dashboard.

## Next Candidates

These are candidate branches only. Each requires explicit approval with allowed files, forbidden files, permissions, and verification.

1. Migration 022 disposable local/test DB dry-run.
2. Migration 024 disposable local/test DB dry-run.
3. Brand Referral persistence promotion behind injected DB.
4. Engineer Mobile read repository adoption.
5. Data Correction persisted audit/contact-log integration.
6. Repair intake handoff.
7. Identity verification and Case Binding.
8. Provider / LINE / webhook integration.
9. Entitlement / billing guard.
10. Admin UI or reporting.
11. AI/RAG branch.
12. Engineer Mobile write actions.
13. Completion submission and Field Service Report write flow.
14. ISO controls audit viewer / access review report.

## No Runtime Decision

This Task778 dashboard does not change runtime behavior and does not modify API, DB, migrations, provider integration, AI/RAG runtime, audit/contact runtime, admin UI, smoke tests, package files, permission logic, customer channel identity runtime, or completion/report write behavior.
