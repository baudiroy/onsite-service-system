# Task731 - Brand Channel Triage and AI Layer Boundary Static Guard

Status: completed.

Scope: docs-only static guard / no runtime change.

## Goal

Add a static documentation guard proving Brand Official LINE / Brand Channel triage and AI layers remain separated before runtime. Brand product questions, repair intake, case inquiries, and complaints must route through distinct handling rules. Brand Knowledge AI must not read customer case data, and Customer Case AI must require verification plus Case Binding.

## Changes

- Added `tests/docs/brandChannelTriageAiBoundary.static.test.js`.
- Clarified `docs/design/brand-official-line-channel-integration.md`:
  - Complaint, dispute, and high-risk flows must route to escalation / human handling.
  - AI must not determine liability, promise compensation, approve quote / settlement, or close complaint.
  - Brand Knowledge AI must not read customer case data or customer identity binding records.
  - Internal Service AI must not expose internal data to customers, unverified brand official LINE users, or roles outside their allowed scope.

## Static Guard Coverage

- Brand official LINE triage categories:
  - brand product / official information
  - new repair / installation request
  - existing case inquiry / reschedule / missing data / completion issue
  - complaint / dispute / high-risk issue
- Brand Knowledge AI source boundary.
- Customer Case AI verification and Case Binding boundary.
- High-risk complaint / dispute escalation boundary.
- Separation between Brand Knowledge AI, Customer Case AI, and Internal Service AI.
- Add-on / Enterprise packaging boundary for brand official LINE webhook, Brand Knowledge AI/RAG, multiple LINE channels, deep routing, and brand reports.

## Non-runtime Decision

This task does not implement AI, RAG, webhook, triage runtime, escalation runtime, provider adapter, entitlement runtime, reports, templates, API, DB schema, migrations, permissions runtime, audit runtime, or smoke tests.

## Verification

Run:

```bash
node --test tests/docs/brandChannelTriageAiBoundary.static.test.js
git diff --check -- tests/docs/brandChannelTriageAiBoundary.static.test.js docs/task-731-brand-channel-triage-ai-boundary-static-guard-docs-only-no-runtime.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md
```

Expected:

- Static guard passes.
- Diff whitespace check passes.

## Future Tasks

- Brand official LINE issue triage runtime.
- Customer verification and Case Binding runtime for brand entry.
- Brand Knowledge AI / RAG add-on.
- Customer Case AI permission-aware retrieval guard.
- Brand channel escalation workflow.
- Brand channel entitlement and usage tracking.
