# Task736 - Brand Channel Triage Policy Baseline

Status: completed.

Scope: pure runtime module / no AI / no DB.

## Goal

Create a pure deterministic brand channel triage policy helper for future Brand Official LINE / Brand Channel flows. It classifies incoming brand-channel intent into safe routing categories without calling AI, webhook, Case Binding, verification, provider, audit writer, or DB.

## Changes

- Added `src/brandChannel/brandChannelTriagePolicy.js`.
- Added `tests/brandChannel/brandChannelTriagePolicy.unit.test.js`.

## Runtime Boundary

The module is pure and deterministic:

- no DB import
- no repository import
- no API/router/controller/service wiring
- no provider / LINE / SMS / App push runtime
- no webhook adapter
- no AI/RAG runtime
- no env / fs / network / logger / config dependency

## Behavior

The helper exports triage categories:

- `brand_product_question`
- `new_repair_or_installation`
- `existing_case_inquiry`
- `complaint_or_dispute`
- `high_risk`
- `unknown`

It accepts safe hints and flags, such as intent hints, message category hints, safe referral metadata, and verification / Case Binding booleans. It returns only:

- `category`
- `route`
- `requiredNextStep`
- `reasonKey`
- safety booleans that deny identity, Case Binding, case-data access, AI final decisions, liability decisions, compensation promises, quote / settlement approval, and complaint closure.

It does not echo raw message text, token-like values, full phone / address, raw LINE id, provider payload, AI payload, or full customer payload.

## Non-goals

This task does not implement:

- AI/RAG classification
- webhook adapter
- customer verification
- Case Binding
- customer access
- complaint workflow
- audit writer
- DB persistence
- provider routing

## Verification

Run:

```bash
node --test tests/brandChannel/brandChannelTriagePolicy.unit.test.js
npm run check
git diff --check -- src/brandChannel/brandChannelTriagePolicy.js tests/brandChannel/brandChannelTriagePolicy.unit.test.js docs/task-736-brand-channel-triage-policy-baseline-no-ai-no-db.md docs/design/brand-official-line-channel-integration.md
```

Expected:

- Unit tests pass.
- Project syntax check passes.
- Diff whitespace check passes.

## Future Tasks

- Brand official LINE issue triage runtime.
- Customer verification and Case Binding integration.
- Brand Knowledge AI / RAG add-on integration.
- Customer Case AI permission-aware retrieval guard.
- Brand channel escalation workflow.
- Brand channel audit / contact persistence.
