# Task 172 - System Architecture Master Handoff Index / Next Product Branch Selection / No Runtime Change

## Background

Task172 creates the system architecture master handoff index and next product branch selection. It does not implement runtime behavior, connect to DB, apply migrations, modify Admin UI, send provider messages, or enable survey runtime.

This document consolidates the major completed and paused design lines:

- core Case / Appointment / Field Service Report / `finalAppointmentId` runtime hardening,
- Field Service Report first-transition concurrency hardening,
- Survey / Migration 020 pause,
- Existing Case reverse LINE binding pause,
- Channel abstraction pause,
- inventory operator handoff freeze,
- future operations / billing / AI-ready roadmap boundaries.

Task172 is a handoff map only. It is not implementation approval.

## No-runtime-change Statement

Task172 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- add or modify APIs,
- implement Admin UI,
- send LINE / APP / SMS / email,
- implement notification delivery runtime,
- implement delivery resolver runtime,
- implement survey runtime,
- write survey intents or event outbox rows,
- implement outbox worker,
- implement reverse LINE binding runtime,
- implement APP channel runtime,
- implement AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed:

- `docs/task-171-channel-abstraction-final-pause-summary-no-runtime-change.md`
- `docs/task-170-channel-abstraction-handoff-qa-next-branch-selection-no-runtime-change.md`
- `docs/task-169-channel-abstraction-design-freeze-handoff-no-runtime-change.md`
- `docs/task-168-channel-abstraction-source-of-truth-index-no-runtime-change.md`
- `docs/task-167-channel-abstraction-core-model-review-no-runtime-change.md`
- `docs/task-166-reverse-line-binding-final-pause-summary-no-runtime-change.md`
- `docs/task-164-reverse-line-binding-design-freeze-implementation-handoff-no-runtime-change.md`
- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`
- `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md`
- `docs/task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md`
- `docs/task-162-reverse-line-binding-security-abuse-case-review-no-runtime-change.md`
- `docs/task-157-first-transition-hardening-closure-product-mainline-return-recommendation.md`
- `docs/task-150-migration-020-survey-runtime-final-pause-summary-no-runtime-change.md`
- `docs/task-147-migration-020-survey-runtime-handoff-index-pause-point-no-runtime-change.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`

Read-only code / foundation references remain the same source groups already reviewed by the prior tasks:

- `src/services/FieldServiceReportService.js`
- `src/repositories/FieldServiceReportRepository.js`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `migrations/010_create_notification_tables.sql`
- `migrations/012_create_line_integration_tables.sql`
- LINE / notification / customer inquiry services and Admin LINE identity panel.

No new runtime investigation was needed for Task172 because the referenced closure / pause documents already record the runtime and smoke evidence.

## Current System Status Summary

Current system status:

1. Core Case / Appointment / Field Service Report model is stable for the current scope.
2. One Case remains one formal Field Service Report.
3. One Case may have multiple appointments / visits.
4. `finalAppointmentId` is backend/system determined and stable after completion.
5. Admin completion payload does not need to send `finalAppointmentId`.
6. Completed report repeat completion is rejected before side effects.
7. First-transition completion has been hardened for near-concurrent completion.
8. One-open-appointment remains a service-level guard and is a future concurrency-hardening topic.
9. Survey / Migration 020 remains paused: file exists, no apply, no dry-run, no runtime writes, no sending.
10. Reverse LINE binding design is frozen and paused.
11. Channel abstraction design is frozen and paused.
12. Inventory operator docs are frozen with Task087 as source of truth.
13. AI remains AI-ready / advisory only.
14. Billing / settlement itemization remains future design.
15. SLA / operations risk escalation remains future design.

## Master Matrix

| Area | Current status | Source of truth | Runtime implemented? | Migration applied? | Frozen / paused? | Requires explicit approval? | Recommended next branch | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Core Case / Report completion | Stable current runtime | Task105-109, Task153-157 | Yes | Existing migrations through current applied baseline | Not paused | For further runtime changes, yes | Product-specific hardening only if needed | One Case = one formal report |
| `finalAppointmentId` | Backend/system determined | Task105-109 | Yes | Migration 019 already part of model | Stable | Yes for contract changes | No immediate branch needed | No Admin manual picker |
| First-transition hardening | Runtime hardened and verified | Task153-157 | Yes | No new migration | Closed | Yes for further changes | Appointment concurrency hardening future | Guards completion side effects |
| One-open-appointment guard | Service-level guard | Task104 / smoke:029 evidence | Yes, service-level | No DB-level constraint | Not frozen as DB-level | Yes for DB constraint or runtime hardening | Future concurrency hardening | DB-level partial constraint not implemented |
| Survey / Migration 020 | Design frozen and paused | Task150 / Task147 | No | No; Migration 020 file only | Paused | Yes | Stay paused unless explicit branch | No DB, no DDL, no sending |
| Reverse LINE Binding | Product/data/API/Admin/security design frozen and paused | Task166 / Task164 / Task158-162 | No | No | Paused | Yes | Resume only by explicit branch | No token runtime / no LIFF / no API |
| Channel Abstraction | Core review/index/freeze/QA/pause completed | Task171 / Task170 / Task169 / Task168 / Task167 | No new runtime | No | Paused | Yes | APP model or generic identity proposal | LINE is current channel candidate, not core |
| Notification foundation | Tables/service foundation only | Task167-171 and existing notification migration/service | Foundation only | Existing notification migration already exists | Not sending-approved | Yes for delivery runtime | Notification delivery readiness planning | Logs/preferences/templates do not approve sending |
| Admin Frontend | Existing Admin surfaces and final marker behavior | Task107-108 and Task167-171 for channel handoff | Yes for existing scope | No new migration | Not paused | Yes for new UI | Admin workflow polish if chosen | No survey status / no manual final picker |
| Smoke tests | Core smoke coverage exists | Task106-109, Task155-156 | Yes | No | Not paused | Yes for new smoke changes | Add only when runtime changes | Task172 does not run smoke |
| Inventory docs | Operator handoff frozen | Task087 and Task103 | N/A | N/A | Frozen | Yes for real behavior/policy change | Do not modify | Shared runtime remains read-only inventory |
| AI-ready | Advisory only | AI-ready scope notes and product docs | Foundation only | No current AI runtime branch | Not implementation-approved | Yes | AI risk radar docs only if chosen | No automatic decisions |
| Billing / settlement future | Future design only | product roadmap docs | No | No | Future | Yes | Billing / settlement itemization design | AI must not decide payable amount |
| SLA / operations future | Future design only | operations extension notes | No | No | Future | Yes | SLA / operations risk escalation design | Recommended product-mainline next branch |

## Core Runtime Source-of-truth Map

Core runtime entry points:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- Task106 implementation notes inside Task105 doc, if appended.
- Task107 Admin completion contract simplification notes.
- Task108 Admin no eligible completed visit error-path coverage notes.
- Task109 repeat completion / idempotency hardening notes.
- `docs/task-153-first-transition-concurrency-hardening-review-no-runtime-change.md`
- `docs/task-154-first-transition-conditional-update-implementation-planning-no-runtime-implementation.md`
- `docs/task-155-field-service-report-first-transition-conditional-update-runtime-hardening.md`
- `docs/task-156-first-transition-runtime-hardening-verification-browser-regression-review.md`
- `docs/task-157-first-transition-hardening-closure-product-mainline-return-recommendation.md`

Current core runtime summary:

- `finalAppointmentId` is resolved by backend/system when omitted.
- supplied `finalAppointmentId` compatibility remains strictly validated before first completion.
- completed report cannot be repeatedly completed for side effects.
- first successful completion transition is protected before completion side effects.
- Admin has no manual final appointment picker.

## Survey / Migration 020 Pause Source-of-truth Map

Survey / Migration 020 entry points:

- `docs/task-150-migration-020-survey-runtime-final-pause-summary-no-runtime-change.md`
- `docs/task-147-migration-020-survey-runtime-handoff-index-pause-point-no-runtime-change.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`

Current survey / Migration 020 status:

- Migration 020 SQL file exists.
- Static SQL review passed in prior tasks.
- Migration 020 has not been locally dry-run.
- Migration 020 has not been applied.
- No DB connection is approved.
- No DDL is approved.
- No runtime survey writes are implemented.
- No outbox worker or delivery resolver is implemented.
- No survey sending is approved.

Canonical future survey event name remains:

```text
case.service_completion.first_transitioned
```

## Reverse LINE Binding Source-of-truth Map

Reverse LINE binding entry points:

- `docs/task-166-reverse-line-binding-final-pause-summary-no-runtime-change.md`
- `docs/task-164-reverse-line-binding-design-freeze-implementation-handoff-no-runtime-change.md`
- `docs/task-163-reverse-line-binding-implementation-readiness-gate-no-runtime-change.md`
- `docs/task-162-reverse-line-binding-security-abuse-case-review-no-runtime-change.md`
- `docs/task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md`
- `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`
- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`

Current reverse LINE binding status:

- design package is frozen and paused,
- no migration file is authored for this line,
- no API is implemented,
- no token generation runtime is implemented,
- no LIFF flow is implemented,
- no Admin UX runtime is implemented,
- no LINE message is sent,
- no raw LINE user id should appear in handoff or survey payload.

## Channel Abstraction Source-of-truth Map

Channel abstraction entry points:

- `docs/task-171-channel-abstraction-final-pause-summary-no-runtime-change.md`
- `docs/task-170-channel-abstraction-handoff-qa-next-branch-selection-no-runtime-change.md`
- `docs/task-169-channel-abstraction-design-freeze-handoff-no-runtime-change.md`
- `docs/task-168-channel-abstraction-source-of-truth-index-no-runtime-change.md`
- `docs/task-167-channel-abstraction-core-model-review-no-runtime-change.md`

Current channel abstraction status:

- core Case / Customer / Appointment / Report / `finalAppointmentId` remain channel-agnostic,
- LINE is a current channel candidate, not the core model,
- APP / SMS / email / manual follow-up remain future channels,
- notification foundation is not delivery approval,
- provider identity should remain provider-specific or future generic channel identity,
- no channel runtime branch is approved.

## Inventory Freeze Reminder

Inventory operator docs remain frozen:

- source of truth: `docs/task-087-smoke-fixture-inventory-read-only-operator-guide-shared-runtime-policy.md`,
- freeze confirmed by Task103,
- do not expand inventory docs unless a real inventory behavior / policy change occurs,
- shared runtime inventory remains read-only,
- broad inventory permission does not grant cleanup permission,
- no destructive cleanup is approved.

## Explicit Non-approval Statement

Task172 does not approve:

1. migration proposal execution,
2. migration file authoring,
3. migration apply,
4. Migration 020 dry-run,
5. DB connection,
6. DDL execution,
7. backend API implementation,
8. Admin UI implementation,
9. smoke/test implementation,
10. APP channel runtime,
11. generic `customer_channel_identities` migration,
12. reverse LINE binding runtime,
13. token generation runtime,
14. LIFF runtime,
15. notification delivery runtime,
16. provider sending,
17. delivery resolver runtime,
18. outbox worker,
19. survey runtime,
20. LINE / APP / SMS / email push,
21. AI runtime,
22. destructive cleanup,
23. inventory docs expansion.

## Safe Next Branch Options

### Branch 1 - Stay Paused / Docs-only QA

- No approval required.
- No DB.
- No runtime.
- No provider sending.

### Branch 2 - APP Channel Model Proposal / No Runtime Change

- Docs-only.
- No migration.
- No APP push.
- Good if staying inside channel abstraction.

### Branch 3 - Generic `customer_channel_identities` Proposal / No Migration

- Docs-only.
- Compare provider-specific identity tables vs a generic identity model.
- No migration file.
- Good if preparing a future cross-channel identity layer.

### Branch 4 - Notification Delivery Readiness Planning / No Runtime Change

- Docs-only.
- No provider sending.
- Good before any resolver / worker / provider integration branch.

### Branch 5 - SLA / Operations Risk Escalation Design / No Runtime Change

- Docs-only.
- Product operations planning.
- Recommended default if the user wants product-mainline progress.

### Branch 6 - Billing / Settlement Itemization Design / No Runtime Change

- Docs-only.
- Fee itemization and settlement policy planning.
- No billing schema change or payable amount engine.

## Approval Interpretation Rules

The following wording does not authorize migration / DB / API / Admin / provider sending / survey runtime:

- continue,
- go ahead,
- next,
- do more tasks,
- looks good,
- accepted,
- proceed,
- ship it,
- follow workflow.

Explicit branch choice is required for:

- migration proposal,
- migration file authoring,
- DB dry-run / apply,
- backend API implementation,
- Admin UI implementation,
- LINE / APP / SMS / email sending,
- delivery resolver runtime,
- survey runtime,
- shared runtime mutation.

Approval for DB, runtime, sending, or shared-runtime mutation must be specific and must keep sensitive-output rules active.

## Recommended Default Branch

If the user wants product-mainline progress, recommend:

```text
Task173 - SLA / Operations Risk Escalation Design / No Runtime Change
```

Reason:

- it is high product value,
- it stays docs-only,
- it does not require Migration 020,
- it does not require DB / DDL,
- it does not require provider sending,
- it supports operations and risk dashboards later.

If the user wants to stay inside channel abstraction, recommend:

```text
Task173 - Own APP Channel Model Proposal / No Runtime Change
```

## Resume Instructions

When resuming the overall system planning line:

1. Start from Task172.
2. Choose a branch explicitly.
3. Read the matching pause / freeze document before planning.
4. Treat general continuation wording as docs-only unless the user explicitly approves runtime / migration / sending.
5. If the branch touches survey, read Task150 and confirm Migration 020 remains paused.
6. If the branch touches channel identity, read Task171 and Task166 first.
7. If the branch touches completion, read Task157 and Task105 first.
8. If the branch touches inventory, read Task087 and Task103 first and do not expand docs without a real behavior / policy change.
9. Do not ask the user to paste `DATABASE_URL`, secrets, customer mobile, raw LINE user id, or raw payload.

## Remaining Blockers

Remaining blockers before runtime expansion:

- DB-level one-open-appointment concurrency strategy.
- Migration 020 local dry-run / apply approval remains absent.
- Survey runtime feature flags and no-send tests are not implemented.
- Reverse LINE binding migration/API/Admin runtime are not approved.
- APP channel model is not designed.
- Generic channel identity model is not decided.
- Notification delivery resolver and provider-sending policy are not approved.
- SMS / email verified contact and opt-out policy are not defined.
- Billing itemization and settlement rule engine remain future design.
- SLA / escalation due-date rules remain future design.
- AI feedback / risk radar remains advisory-only future work.

## Final Recommendation

Use Task172 as the master handoff entry point.

Pause the current architecture handoff line unless the user explicitly selects a next branch.

Recommended next task if product-mainline work continues:

```text
Task173 - SLA / Operations Risk Escalation Design / No Runtime Change
```

Alternative if the user wants channel continuation:

```text
Task173 - Own APP Channel Model Proposal / No Runtime Change
```

Do not proceed to migration, schema, runtime API, Admin UI, delivery resolver, provider sending, survey runtime, shared runtime mutation, or inventory docs expansion without explicit approval.

## Non-goals

Task172 does not design or implement:

- backend runtime,
- Admin frontend runtime,
- APIs,
- migration files,
- schema / indexes,
- smoke tests,
- DB dry-run / apply,
- provider sending,
- LINE push,
- APP push,
- SMS / email,
- delivery resolver runtime,
- survey sending,
- reverse LINE binding runtime,
- trusted LINE / LIFF runtime,
- billing engine,
- SLA engine,
- AI automatic decisions,
- inventory docs changes,
- destructive cleanup.

## Verification Summary

Recommended verification for Task172:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive scan of this document

Sensitive scan matches for policy words such as `token`, `customer mobile`, `raw LINE user id`, or `payload` are expected if they are safety warnings or placeholders. They are not actual sensitive values.

Task172 does not require:

- `npm run smoke:028`,
- `npm run smoke:029`,
- `npm run smoke:071:browser`,
- migration apply,
- DB connection,
- psql,
- runtime tests,
- LINE / APP / SMS / email live tests,
- survey runtime tests,
- inventory verification.
