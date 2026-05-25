# Task790 - PM Continuation Handoff after Brand Referral and Engineer Mobile Runtime-adjacent Closures / Docs Only / No Runtime

Status: completed

Scope: PM continuation handoff / docs-only / no runtime change

## Purpose

Task790 summarizes the current continuation point after the recent guardrail, Brand Referral, and Engineer Mobile runtime-adjacent closure work. This handoff is for PM and Codex continuity only.

This document does not authorize DB work, migration dry-run/apply, public API expansion, provider/webhook integration, AI/RAG runtime, identity verification, Case Binding, repair intake creation, completion writes, or `finalAppointmentId` changes.

## Task777-778 Guardrail and Dashboard Status

Task777-778 closed the recent guardrail/dashboard checkpoint. The accepted state is:

- PROJECT_GUARDRAILS and design-document routing remain the source-of-truth layer.
- Future runtime tasks must be explicitly bounded by allowed files, forbidden files, permissions, verification, and risk.
- Docs-only tasks do not imply runtime approval.
- Runtime/API/DB/migration/provider/AI/RAG/admin/package/smoke changes require explicit task-level approval.
- No sensitive data, token, secret, LINE access token, channel secret, DB URL, AI provider secret, raw payload, or full customer data should be printed or committed.

## Brand Referral Task779-781 Status

Brand Referral is closed at a no-runtime checkpoint.

Current accepted state:

- Public route HTTP behavior is covered.
- Public route remains normalization-only.
- Public route does not create Case, repair intake, identity verification, Case Binding, provider sending, webhook dispatch, AI/RAG execution, entitlement/billing effects, audit writer runtime, or contact-log runtime.
- Public body remains safe and does not expose audit writer internals such as `auditIntent`, `contactWriterResult`, or injected writer details.
- Audit/contact writer path remains injected-only.
- No default real DB writer is configured.
- Migration 024 exists as an authoring artifact only.
- Migration 024 remains no DB, no psql, no db:migrate, no DDL, no dry-run, and no apply.
- Migration 024 must not be executed or modified without a separately approved task.

Hard boundary:

- Brand Referral public normalization is not Case creation.
- Brand Referral public normalization is not Case Binding.
- Brand Referral public normalization is not identity verification.
- Brand Referral public normalization is not provider/webhook/LINE/SMS/App push sending.
- Brand Referral public normalization is not AI/RAG runtime.

## Engineer Mobile Task782-789 Status

Engineer Mobile is closed at a runtime-adjacent no-real-DB checkpoint.

Current accepted state:

- Task782 completed the runtime adoption readiness packet.
- Task783 added an injected read-model repository with fake DB / fake transaction unit tests only.
- The injected repository path was implemented with fake DB/unit tests only.
- Injected repository path implemented with fake DB/unit tests only.
- Task784 closed the injected repository boundary.
- Task785 added optional app-factory provider composition for explicit injected repository use.
- Task786 closed the provider composition boundary.
- Task787 added HTTP-style app-like behavior coverage for injected repository list/detail paths.
- HTTP behavior covered with app-like handler only.
- Task788 closed the HTTP behavior boundary.
- Task789 closed the Task783-788 injected repository runtime-adjacent branch.
- Engineer Mobile does not change API shape or completion behavior.

Engineer Mobile accepted boundary:

- injected repository path only
- fake DB / fake transaction test coverage only
- no real DB
- no psql
- no db:migrate
- no DDL
- no dry-run
- no apply
- no API shape change
- no server listen
- no completion writes
- no Field Service Report creation/update
- no `finalAppointmentId` exposure, inference, or mutation
- no provider sending
- no AI/RAG runtime
- no entitlement/billing runtime
- no admin UI
- no package change
- no smoke/integration expansion

Migration 022 status:

- Migration 022 exists as an authoring artifact.
- Migration 022 remains no DB, no psql, no db:migrate, no DDL, no dry-run, and no apply.
- Migration 022 must not be executed or modified without a separately approved task.

## Hard No-go Boundaries

The current continuation state still forbids:

- real DB connection
- psql
- db:migrate
- DDL
- migration dry-run
- migration apply
- Migration 022 execution or modification
- Migration 024 execution or modification
- provider sending
- LINE runtime
- SMS runtime
- App push runtime
- webhook runtime
- AI/RAG runtime
- admin UI implementation
- smoke/integration expansion
- package or dependency changes
- token/secret/provider config changes
- identity verification runtime
- Case Binding runtime
- repair intake runtime
- Case creation services
- audit/contact runtime promotion
- completion writes
- Field Service Report creation/update
- `finalAppointmentId` mutation or inference changes

Any future task that touches one of these areas must explicitly say so in its allowed files and permissions.

## Core Invariants to Preserve

The following invariants remain active:

- one Case = one formal completion report
- one Case may have multiple appointments / dispatch visits
- Field Service Report remains the Case-level formal completion summary for onsite service
- `field_service_reports.case_id` uniqueness must not be weakened
- `finalAppointmentId` remains backend/system-owned
- Engineer Mobile must not decide, expose, infer, or mutate `finalAppointmentId`
- unverified users cannot query case data
- LINE identity is scoped by `organization_id + line_channel_id + line_user_id`
- `line_user_id` is not a global identity
- no cross-organization or cross-tenant data access
- no silent overwrite of formal data
- customer-facing data excludes internal note, audit raw payload, AI raw payload, billing/settlement internals, engineer internal comments, supervisor review, provider payload, and unverified case data

## Sensitive Data Boundary

The current branch must not expose, persist in unsafe places, or send to PM/logs/tests:

- DB URL
- token
- secret
- credential
- LINE access token
- LINE channel secret
- raw LINE id
- full phone
- full address
- full customer name
- full customer payload
- provider payload
- AI raw payload
- audit raw payload
- internal note
- billing/settlement internals
- Field Service Report id in customer-facing/mobile read output
- formal report id in customer-facing/mobile read output
- `finalAppointmentId`
- stack traces
- SQL text in public error output

## Possible Next Branches

These are candidates only and require explicit approval before implementation:

1. Brand Referral runtime branch
   - identity verification
   - Case Binding
   - repair intake staging
   - contact/audit persistence promotion
   - provider/webhook adapter

2. Engineer Mobile runtime branch
   - real DB read repository after Migration 022 dry-run/apply approval
   - permission/assignment runtime around real repository usage
   - task-read audit evidence
   - mobile completion submission design/runtime
   - Field Service Report write flow

3. Migration branch
   - disposable local/test DB dry-run packet
   - explicit no-shared-runtime DB target
   - no secrets printed
   - dry-run result template

4. ISO/security controls branch
   - data classification
   - field-level visibility
   - export controls
   - file access controls
   - AI retrieval guard
   - provider secret management
   - audit log viewer
   - access review report

5. Product/runtime branch
   - bounded API slice with explicit allowed files
   - bounded permission/audit slice
   - bounded smoke coverage only if approved

## Next-task Requirements

The next PM task should state:

- allowed files
- forbidden files
- whether runtime/src changes are allowed
- whether API behavior changes are allowed
- whether DB/migration/dry-run/apply is allowed
- whether permission/audit runtime is allowed
- whether provider/LINE/SMS/App push/webhook is allowed
- whether AI/RAG is allowed
- whether admin UI is allowed
- whether smoke/integration tests are allowed
- verification commands
- acceptance criteria
- risks and stop conditions

## Verification

Required verification:

```bash
test -f docs/task-790-pm-continuation-handoff-after-brand-referral-and-engineer-mobile-runtime-adjacent-closures-docs-only-no-runtime.md
grep -Ei "Task777|Task789|Brand Referral|Engineer Mobile|Migration 022|Migration 024|normalization-only|injected writer|injected repository|no DB|no dry-run|no apply|finalAppointmentId|Case Binding|AI/RAG|explicit approval" docs/task-790-pm-continuation-handoff-after-brand-referral-and-engineer-mobile-runtime-adjacent-closures-docs-only-no-runtime.md
git diff --check -- docs/task-790-pm-continuation-handoff-after-brand-referral-and-engineer-mobile-runtime-adjacent-closures-docs-only-no-runtime.md
```

## Decision

Task790 is a docs-only handoff. It does not modify runtime behavior and does not approve any future runtime branch.
