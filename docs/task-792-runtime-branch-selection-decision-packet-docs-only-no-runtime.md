# Task792 - Runtime Branch Selection Decision Packet / Docs Only / No Runtime

Status: completed

Scope: runtime branch selection decision packet / docs-only / no runtime change

## Purpose

Task792 compares the next possible runtime branches after Task791 and defines the explicit approvals needed for each branch.

This packet is planning only. It does not authorize runtime, DB connection, DB dry-run, migration execution, migration apply, persistence promotion, provider/webhook work, AI/RAG runtime, completion write, `finalAppointmentId` changes, smoke expansion, package changes, admin UI, or secret/provider configuration changes.

## Global Non-authorization

No candidate branch is approved by Task792.

Any future runtime branch must restate:

- allowed files
- forbidden files
- whether runtime/src changes are allowed
- whether API behavior changes are allowed
- whether DB/migration/dry-run/apply is allowed
- whether permission/audit runtime is allowed
- whether provider/LINE/SMS/App push/webhook is allowed
- whether AI/RAG is allowed
- whether admin UI is allowed
- whether package changes are allowed
- whether smoke/integration tests are allowed
- exact verification commands
- acceptance criteria
- risks and stop conditions

## Candidate 1 - Migration 022 Disposable DB Dry-run

Current readiness:

- Migration 022 exists as an authoring artifact for Engineer Mobile read-model support.
- Engineer Mobile read-model mapper, fixture, repository, and injected fake DB behavior have been tested without real DB.
- Migration 022 remains no DB, no psql, no db:migrate, no DDL, no dry-run, and no apply.

Required explicit approvals:

- Explicit disposable local/test DB target approval.
- Explicit statement that shared, production, staging, Zeabur, or customer data DB targets are forbidden.
- Explicit approval to run only the named dry-run commands.
- Explicit confirmation that DATABASE_URL, credentials, tokens, passwords, and secrets must not be printed.

Allowed first bounded task:

- Migration 022 dry-run command envelope execution against disposable local/test DB only, with sanitized output summary.

Forbidden scope:

- shared/prod/staging/Zeabur DB
- DB credential printing
- schema apply to shared runtime
- runtime source changes
- API changes
- provider/webhook
- AI/RAG
- admin UI
- smoke expansion unless separately approved

Risk level:

- Medium-high, because DDL execution is involved even if disposable.

Recommended sequencing:

- Do not run until the user provides an explicit disposable local/test DB approval packet.

## Candidate 2 - Migration 024 Disposable DB Dry-run

Current readiness:

- Migration 024 exists as an authoring artifact for Brand Referral audit/contact persistence readiness.
- Brand Referral public normalization and injected writer boundaries are covered without real DB.
- Migration 024 remains no DB, no psql, no db:migrate, no DDL, no dry-run, and no apply.

Required explicit approvals:

- Explicit disposable local/test DB target approval.
- Explicit statement that shared, production, staging, Zeabur, or customer data DB targets are forbidden.
- Explicit approval to run only the named dry-run commands.
- Explicit confirmation that DATABASE_URL, credentials, tokens, passwords, and secrets must not be printed.

Allowed first bounded task:

- Migration 024 dry-run command envelope execution against disposable local/test DB only, with sanitized output summary.

Forbidden scope:

- shared/prod/staging/Zeabur DB
- DB credential printing
- provider/webhook
- identity verification
- Case Binding
- repair intake creation
- public API expansion
- default real audit/contact writer
- AI/RAG
- admin UI
- smoke expansion unless separately approved

Risk level:

- Medium-high, because DDL execution is involved and this branch is near identity/contact persistence.

Recommended sequencing:

- Do not run until a disposable local/test DB approval packet exists. If only one dry-run branch is chosen first, Migration 022 is slightly narrower because it is read-model oriented.

## Candidate 3 - Brand Referral Audit/Contact Persistence Promotion

Current readiness:

- Public route remains normalization-only.
- Public HTTP behavior is covered.
- Audit/contact writer path remains injected-only.
- Migration 024 exists but is not applied.

Required explicit approvals:

- Runtime/source scope for the specific writer path.
- DB/migration status decision: either no DB and fake/injected unit only, or explicit Migration 024 dry-run/apply prerequisites.
- Permission/audit/contact scope.
- Explicit public response body boundary.

Allowed first bounded task:

- Injected writer unit hardening only, or repository contract test using fake persistence only.

Forbidden scope:

- real DB writer without Migration 024 status approval
- public API response expansion
- identity verification
- Case Binding
- repair intake creation
- provider/webhook sending
- AI/RAG
- unmasked personal data

Risk level:

- Medium, because public intake/contact data can easily drift into identity or Case Binding behavior.

Recommended sequencing:

- Keep this behind Migration 024 dry-run/apply readiness unless the next task is fake/injected unit-only.

## Candidate 4 - Engineer Mobile Permission/Assignment Runtime Guard

Current readiness:

- Engineer Mobile route/controller/service permission shape has extensive unit/static coverage.
- Injected repository path remains no real DB and no API shape change.
- Engineer Mobile can only proceed safely when assignment and organization scope remain explicit.

Required explicit approvals:

- Runtime/source scope for specific Engineer Mobile permission/assignment files.
- Whether API behavior may change.
- Whether audit logging is included or excluded.
- Whether real repository/DB remains forbidden.

Allowed first bounded task:

- Permission/assignment guard unit hardening around existing injected provider behavior, no real DB and no API shape change.

Forbidden scope:

- real DB adoption
- completion submission
- Field Service Report writes
- `finalAppointmentId` mutation
- provider sending
- AI/RAG
- admin UI
- migration execution

Risk level:

- Medium-low if kept to no-DB unit coverage. Higher if real assignment repository is introduced.

Recommended sequencing:

- This is the safest next implementation slice if the goal is runtime progress without DB execution. It can improve access safety before real DB adoption.

## Candidate 5 - Engineer Mobile Real Repository DB Adoption

Current readiness:

- Injected repository exists and is fake DB tested.
- App/provider composition can opt in to the injected repository.
- HTTP-style app-like behavior is covered.
- Migration 022 remains no dry-run/no apply.

Required explicit approvals:

- Migration 022 dry-run/apply status decision.
- Explicit real DB read scope.
- Explicit allowed repository/app wiring files.
- Permission/assignment guard decision.
- Audit-read evidence decision.

Allowed first bounded task:

- Repository DB adapter wiring behind explicit injected dbClient only, without changing public API response shape and without completion writes.

Forbidden scope:

- DB adoption before Migration 022 readiness is resolved
- completion submission
- Field Service Report writes
- `finalAppointmentId` mutation/inference changes
- provider sending
- AI/RAG
- admin UI
- package changes
- smoke unless separately approved

Risk level:

- Medium-high, because real DB reads require schema readiness and assignment/organization scope correctness.

Recommended sequencing:

- Do not start before either Candidate 1 is completed or an equivalent explicit no-migration DB-read strategy is approved.

## Candidate 6 - Data Correction Next Runtime Hardening

Current readiness:

- Data Correction / Amendment Governance principles are established.
- Existing branch work has covered query executor and persistence shortcuts in bounded slices.
- Phone change re-verification and post-departure freeze remain high-value runtime candidates.

Required explicit approvals:

- Specific runtime files and API behavior.
- Whether DB/migration is in scope.
- Permission/audit/contact-log scope.
- Whether customer channel identity and LINE/App binding logic may be touched.

Allowed first bounded task:

- Phone change guard or post-departure freeze guard as a small unit-tested runtime slice, with no channel identity mutation unless explicitly approved.

Forbidden scope:

- silent phone overwrite
- customer_channel_identity reassignment without verification
- LINE/App binding transfer
- cross-organization access
- completion report duplication
- `finalAppointmentId` manual override outside admin exception
- AI auto-modification

Risk level:

- Medium, because data correction can affect identity, dispatch, completion, billing, and audit.

Recommended sequencing:

- Good product/runtime candidate after the current handoff, but should start with one tight guard only, not the full governance module.

## Cross-branch Invariants

All candidates must preserve:

- one Case = one formal completion report
- one Case may have multiple appointments / dispatch visits
- `field_service_reports.case_id` uniqueness must not be weakened
- `finalAppointmentId` remains backend/system-owned
- unverified users cannot query case data
- LINE identity is scoped by `organization_id + line_channel_id + line_user_id`
- `line_user_id` is not a global identity
- no cross-organization or cross-tenant data access
- no silent overwrite of formal data
- AI must not auto-dispatch, auto-complete, auto-settle, approve fees, or modify formal records

## Safest Next Implementation Slice

Recommendation only, not approval:

The safest next implementation slice is Candidate 4: Engineer Mobile Permission/Assignment Runtime Guard, limited to unit/static coverage and existing injected provider behavior, with no real DB, no migration, no API shape change, no completion writes, no provider sending, and no AI/RAG.

Rationale:

- It advances runtime safety without DB execution.
- It strengthens organization/assignment boundaries before real repository adoption.
- It avoids provider, identity, Case Binding, and completion-write risks.
- It keeps the path open for later Migration 022 dry-run or DB adoption.

Alternative low-risk product slice:

- Candidate 6 Data Correction hardening, if PM wants to return to product workflow.

## Verification

Required verification:

```bash
test -f docs/task-792-runtime-branch-selection-decision-packet-docs-only-no-runtime.md
grep -Ei "Migration 022|Migration 024|Brand Referral|Engineer Mobile|Data Correction|DB dry-run|runtime branch|explicit approval|no apply|no runtime" docs/task-792-runtime-branch-selection-decision-packet-docs-only-no-runtime.md
git diff --check -- docs/task-792-runtime-branch-selection-decision-packet-docs-only-no-runtime.md
```

## Decision

Task792 is docs-only and no runtime. It does not approve any candidate branch.
