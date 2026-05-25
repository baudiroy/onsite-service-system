# Task 318 - MVP Readiness Detail Branch Closure Review / No Runtime Change

## Scope And Non-goals

This document closes the docs-only MVP readiness detail branch that started after Task311.

Task318 reviews Task312 through Task317 and confirms that the first batch of core runtime candidates has readiness analysis, while no implementation has been approved.

Task318 does not choose a runtime sprint, does not approve implementation, and does not authorize backend, Admin, API, DB, migration, provider, AI, customer channel, billing, settlement, report/export, smoke, or test changes.

This task is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
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
- report / export / download runtime,
- test / smoke implementation,
- fixture change,
- package change.

Task318 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, views, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why This Closure Review Follows Task317

Task312 through Task317 created detail packets for the first set of MVP runtime candidates:

- Case / Appointment core workflow,
- Field Service Report completion,
- finalAppointmentId backend-owned inference,
- one-open-appointment invariant,
- customer-visible service result summary,
- customer fee consent.

These candidates are tightly connected. They define the core service workflow and the first customer-facing / fee evidence boundaries that future runtime may depend on.

Task318 exists to prevent design drift: it confirms what is ready at the documentation level, what remains future-only, and why implementation must pause until PM / product explicitly selects a first runtime task with a full approval packet.

## Task312-Task317 Summary

### Task312 - Case / Appointment Core Workflow Readiness

Task312 documented the base Case / Appointment invariants:

- one Case = one formal Field Service Report,
- one Case may have multiple appointments / dispatch visits,
- no multiple open appointments per Case,
- abnormal and multi-visit results belong to appointment / visit layer,
- Case status must not be mutated by survey, complaint, AI, billing, notification, or provider side effects,
- finalAppointmentId remains backend/system-owned.

### Task313 - Field Service Report Completion Hardening Readiness

Task313 documented completion invariants:

- Field Service Report is the Case-level final completion summary,
- repeat completion must be rejected before side effects,
- first completion transition requires future concurrency-safe design,
- completion must not trigger survey, notification, billing, settlement, provider, or AI side effects without explicit approval,
- completed finalAppointmentId must remain stable.

### Task314 - finalAppointmentId Backend-owned Inference Readiness

Task314 documented finalAppointmentId ownership:

- backend/system remains source of truth,
- Admin completion must not send finalAppointmentId by default,
- engineer must not select finalAppointmentId,
- future manual override requires explicit permission, audit, reason, and guardrails,
- finalAppointmentId must point to the same Case and same organization scope,
- AI must not decide or override finalAppointmentId.

### Task315 - One-open-appointment Invariant Readiness

Task315 documented one-open-appointment readiness:

- one Case may have multiple historical appointments,
- the same Case must not have multiple open / active / unfinished appointments,
- new appointment should follow a clear terminal outcome or approved replacement transition,
- ambiguous states such as pending parts, quote required, and reschedule requested require approved classification,
- AI must not create, reopen, or close appointments automatically.

### Task316 - Customer-visible Service Result Summary Readiness

Task316 documented the boundary between customer-visible summaries and internal Field Service Report data:

- customer-visible summary is not the full internal Field Service Report,
- internal notes, supervisor notes, billing / settlement internal data, audit logs, AI raw payload, and engineer internal comments stay internal-only,
- customer-visible access requires verification and safe-deny rules,
- AI may draft wording but cannot decide official service result or expose unsupported facts.

### Task317 - Customer Fee Consent Readiness

Task317 documented fee consent readiness:

- fee display is not consent,
- customer fee consent is not quote approval,
- quote approval is not settlement approval,
- engineer and AI cannot consent for the customer,
- customer-visible fee amounts must not expose internal billing rules, settlement rules, vendor payout, SaaS cost, or provider usage cost,
- future consent must be traceable by source, time, amount, scope, channel, actor, evidence, and audit trail.

## Readiness Status Table

`Runtime approved now` is `No` for every row.

| Task | Candidate capability | Protected invariant | Likely future runtime layers | Schema/API/test/audit gates still needed | Risk level | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- |
| Task312 | Case / Appointment core workflow hardening | Case-level report, multi-visit appointment layer, no side-effect Case mutation | Case service, Appointment service, dispatch, Admin timeline, Engineer Mobile future flow | API contract, state transition tests, organization isolation, audit readiness, possible schema/index review | Medium | No |
| Task313 | Field Service Report completion hardening | Repeat completion rejected before side effects, first transition needs concurrency-safe future design | FSR service, Case completion, finalAppointmentId resolution, audit/timeline, Admin completion display | Transaction/concurrency design, API behavior, tests, audit, side-effect gates | Medium / high | No |
| Task314 | finalAppointmentId backend-owned inference | finalAppointmentId system-owned, same Case / organization, stable after completion | FSR service, Appointment lookup, Admin completion client, smoke/browser coverage | API compatibility, override policy, test coverage, permission/audit if override ever allowed | Medium | No |
| Task315 | One-open-appointment invariant | No multiple open appointments per Case, multiple historical appointments allowed | Appointment create/update, dispatch/reschedule, Engineer Mobile outcome, Admin scheduling | Appointment state taxonomy, concurrency design, possible schema/index, tests, audit | Medium / high | No |
| Task316 | Customer-visible service result summary | Customer-visible summary excludes internal FSR data and safe-denies unverified access | Customer summary API, channel identity, customer portal/LINE/App future surfaces | Field allow-list, deny-list, safe-deny, API, possible view/schema, tests, audit | High | No |
| Task317 | Customer fee consent readiness | Consent traceability, consent/quote/settlement separation, no AI/engineer consent | Consent API, channel verification, evidence storage, quote/billing future links | Consent model, evidence metadata, API, safe-deny, tests, audit | High | No |

## Cross-candidate Dependency Review

Future implementation should respect these dependencies:

- Case / Appointment hardening should come before customer-facing lookup.
- Field Service Report completion hardening should come before survey and customer-visible final summaries.
- finalAppointmentId inference should come before final appointment survey context and final service result summaries.
- One-open-appointment invariant should come before reschedule, second visit automation, or customer channel appointment changes.
- Customer-visible summary should come before customer self-service and notification exposure.
- Customer fee consent should come before quote, billing, settlement, payment, or invoice runtime coupling.
- Data Access Control, organization isolation, audit readiness, and safe-deny must be reviewed before any customer-facing runtime.
- AI-assisted flows must wait for human review, official-record separation, and no-auto-decision gates.

## Explicit First-runtime Recommendation / Future-only

Recommended first implementation candidate, if PM / product later chooses to start runtime work:

**Case / Appointment core workflow hardening.**

Reason:

- It has the lowest external exposure among this branch's candidates.
- It protects the base service workflow invariants.
- It reduces downstream runtime risk for completion, customer-visible summaries, customer channel lookup, Engineer Mobile, survey, fee consent, billing, and AI.
- It can be scoped before provider sending, customer channel identity, AI/RAG, billing, settlement, survey, and report/export features.

This is only a future recommendation. It is not implementation approval.

Any future first-runtime task still requires explicit PM approval, allowed files/layers, API contract approval, test plan, rollback plan, Data Access review, audit review, and migration/DB approval if any schema work is proposed.

## Runtime Forbidden Confirmation

Task318 explicitly does not approve:

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
- payment runtime,
- invoice runtime,
- customer channel identity runtime,
- notification runtime,
- AI / RAG runtime,
- provider sending,
- report / export / download runtime,
- inventory documentation changes.

## Implementation Approval Gate Reminder

Future implementation tasks must explicitly approve the relevant layers:

- Future runtime task must explicitly approve files/layers.
- Future schema task must explicitly approve migration / DB / DDL.
- Future test task must explicitly approve test / smoke files.
- Future provider task must explicitly approve provider sending.
- Future AI task must explicitly approve AI provider, retrieval, masking, audit, and usage tracking.
- Future customer-facing task must explicitly approve safe-deny, non-enumeration, customer-visible allow-list, and internal-only deny-list.
- Future billing / settlement task must explicitly approve finance workflow, evidence, rule version, audit, and traceability boundaries.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough to approve runtime, DB, migration, provider sending, AI, customer channel, billing, payment, or test changes.

## Closure Decision

The MVP readiness detail branch has enough docs-only analysis to pause.

The branch should remain paused until PM / product explicitly selects a first runtime implementation task and provides a full approval packet.

Recommended next step, if runtime is not approved yet:

- stay docs-only,
- or ask PM / product to choose the first runtime candidate,
- or return to another product design branch.

## Conclusion

Task318 is a docs-only closure review.

It does not approve runtime implementation.

Task312 through Task317 can now be treated as the first MVP readiness detail packet set. Future runtime work must start with a new explicit implementation task and must not infer approval from these readiness documents.
