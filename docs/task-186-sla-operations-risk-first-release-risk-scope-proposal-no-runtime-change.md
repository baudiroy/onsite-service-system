# Task 186 - SLA / Operations Risk First-Release Risk Scope Proposal / No Runtime Change

## Purpose and Non-Goals

Task186 defines a documentation-only first-release scope proposal for future SLA / operations risk implementation.

This document proposes the smallest safe initial risk categories and explicitly excludes categories that should not enter a first release. It is a planning artifact only.

Task186 does not approve implementation and does not authorize DB, DDL, migration, runtime, provider sending, survey runtime, or AI automatic decisions.

Required source-of-truth guardrails:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-185-sla-operations-risk-runtime-readiness-gate-no-migration-or-runtime-change.md`
- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`
- `docs/task-176-sla-operations-risk-clock-source-and-business-hours-policy-no-runtime-change.md`
- `docs/task-177-sla-operations-risk-dedupe-and-suppression-policy-no-runtime-change.md`
- `docs/task-178-sla-operations-risk-dashboard-role-queue-design-no-runtime-change.md`
- `docs/task-179-sla-operations-risk-human-action-workflow-design-no-runtime-change.md`
- `docs/task-180-sla-operations-risk-action-audit-and-evidence-policy-no-runtime-change.md`
- `docs/task-181-sla-operations-risk-permission-and-organization-scope-review-no-runtime-change.md`
- `docs/task-182-sla-operations-risk-admin-dashboard-wireframe-requirements-no-admin-code-change.md`
- `docs/task-183-sla-operations-risk-dashboard-copy-and-empty-state-policy-no-admin-code-change.md`
- `docs/task-184-sla-operations-risk-api-contract-draft-no-runtime-change.md`

Task186 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke or browser smoke scripts,
- modify `package.json`,
- add tests,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- add SLA runtime,
- add operations risk runtime,
- add dashboard implementation,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable delivery resolver runtime,
- enable outbox worker,
- add AI automatic decisions,
- change Case / Appointment / Report behavior,
- change `finalAppointmentId` logic,
- modify inventory docs,
- perform destructive cleanup,
- output sensitive values.

## Source-of-Truth Guardrails

Task186 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `field_service_reports.case_id` uniqueness principle remains intact,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- Admin has no normal manual `finalAppointmentId` picker,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

The proposed first release must reduce operational friction without introducing hidden automation or weakening official Case / Appointment / Field Service Report lifecycle rules.

## Current Architecture Assumptions

Task186 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk tables exist,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only,
- current implemented system already has Case / Appointment / Field Service Report foundations,
- future risk scope should start with reviewable operational signals, not automated actions.

## First-Release Scope Principles

The first release should be intentionally narrow.

Recommended principles:

1. Prefer risks that are explainable from existing Case / Appointment / Field Service Report state.
2. Prefer risks that reduce missed follow-up or stale operational work.
3. Prefer risks that can be reviewed by humans without changing official lifecycle state automatically.
4. Prefer risks that do not require provider delivery.
5. Prefer risks that do not require survey runtime.
6. Prefer risks that do not require billing / settlement rule engine runtime.
7. Prefer risks that can be displayed as safe summaries.
8. Avoid first-release risks that require final production RBAC, customer-facing commitments, or outbound notification guarantees.
9. Avoid first-release risks that need raw channel identifiers or customer contact values.
10. Keep all thresholds proposal-only until PM / operations approves.

The first release should prove that operators can safely see and review risk before adding automation.

## Proposed In-Scope Risk Categories

The following are candidate first-release risk categories. They are not approved implementation.

| Candidate risk | Reason to include | Owner role | Safe first-release behavior |
| --- | --- | --- | --- |
| `case_not_dispatched` | catches active cases that may be waiting too long before scheduling | dispatch / customer service | queue item only; no auto appointment |
| `case_no_open_appointment` | catches active cases without an open visit after prior terminal state | dispatch | queue item only; does not create appointment |
| `appointment_unassigned` | catches scheduled visits lacking assignment / dispatch confirmation | dispatch | queue item only; no auto engineer assignment |
| `appointment_unconfirmed` | catches visits needing customer confirmation | customer service | queue item only; no auto message |
| `appointment_not_started` | catches missed or late visit start risk | dispatch / engineer lead | queue item only; no route / GPS promise |
| `appointment_stale_on_site` | catches in-progress visits without timely result update | engineer lead | queue item only; no auto completion |
| `pending_parts_no_next_visit` | catches pending parts visits without ETA / next action / next visit | dispatch / parts coordinator | queue item only; no stock reservation |
| `pending_quote_no_customer_decision` | catches quote-pending cases lacking decision | customer service / supervisor | queue item only; no quote approval |
| `report_in_progress_too_long` | catches reports left unfinished after service work | engineer lead / supervisor | queue item only; no auto report completion |
| `completion_blocked_no_completed_visit` | catches failed completion because no eligible completed visit exists | supervisor | queue item only; no final appointment override |
| `repeated_reschedules` | catches coordination risk across appointment history | dispatch / supervisor | queue item only; no blame assignment |
| `multiple_incomplete_visits` | catches repeat service failure / rework risk | supervisor / quality | queue item only; no extra formal report |

These candidates align with existing multi-visit architecture and can remain internal review signals.

## Explicitly Out-of-Scope Risk Categories

The following should remain out of first release:

| Out-of-scope category | Reason |
| --- | --- |
| `survey_low_rating` | survey runtime remains paused and not implemented |
| customer-facing notification breach | provider sending and channel delivery are not approved |
| billing / settlement stale | billing rule engine and finance workflow need separate scope |
| quote amount anomaly | quote approval and billing itemization require separate future design |
| parts inventory shortage prediction | inventory / reservation runtime is not approved |
| engineer performance scoring | high sensitivity, requires policy and fairness review |
| AI-generated complaint prediction as authoritative risk | AI must remain advisory, not authoritative |
| automatic route delay prediction | route/GPS provider and operational policy not approved |
| customer identity / LINE binding stale | reverse binding runtime is separate and not implemented |
| post-completion survey delivery pending | survey delivery / channel resolver not implemented |

Out-of-scope does not mean unimportant. It means the first release should not take dependencies on unfinished policy, runtime, or provider decisions.

## Manual Review Requirements

Every first-release candidate risk must require human review.

Future runtime, if approved later, should require humans to:

- acknowledge risk,
- assign owner,
- add safe note if needed,
- escalate when policy requires,
- suppress only with reason and permission,
- resolve only after a human confirms the underlying operational condition is handled.

First-release risk items must not:

- create appointments automatically,
- assign engineers automatically,
- complete reports automatically,
- close cases automatically,
- choose or change `finalAppointmentId`,
- approve quotes,
- approve billing / settlement,
- send customer messages,
- write survey runtime rows,
- let AI resolve or suppress items automatically.

## AI Advisory-Only Scope

AI may be proposed for first release only as non-authoritative support:

- summarize why a risk is shown,
- identify missing fields,
- suggest possible owner role,
- suggest what the operator should review,
- summarize repeated incomplete visit patterns,
- flag uncertainty.

AI must not:

- decide severity as official truth,
- override policy thresholds,
- mutate Case / Appointment / Report state,
- send notifications,
- approve suppression,
- approve resolution,
- decide billing / settlement,
- expose sensitive values in summaries.

If AI is included in a future implementation, its output should be labeled as advisory and reviewable by humans.

## No Automation / No Auto-Decision Rules

First-release scope should be review-first.

Do not automate:

- dispatch,
- appointment creation,
- appointment cancellation,
- appointment reassignment,
- final appointment selection,
- report completion,
- case completion / closure,
- customer notification,
- quote approval,
- billing / settlement approval,
- complaint closure,
- survey sending,
- risk suppression / resolution.

Automation may be reconsidered only after the review layer proves safe, audited, scoped, and useful.

## No-Send / No-Provider Test Assumptions

Any future implementation must prove no-send behavior before provider delivery is considered.

Future no-send tests should confirm:

- risk creation does not send LINE messages,
- risk creation does not send APP push,
- risk creation does not send SMS / email,
- acknowledgment does not notify customer,
- escalation does not notify customer,
- suppression does not notify customer,
- resolution does not notify customer,
- no provider credentials are required to run risk detection tests,
- no raw provider payload is logged.

Provider integration is a separate future branch.

## Case / Appointment / Field Service Report Invariant Protection

First-release scope must not weaken:

- Case-level formal report invariant,
- appointment / visit history preservation,
- one-open-appointment invariant,
- completed report repeat completion guard,
- `finalAppointmentId` stability,
- backend-owned final appointment inference,
- absence of Admin manual final appointment picker.

Risk items may reference Case, appointment, and report context safely, but they must not become another source of official lifecycle truth.

## Channel-Agnostic Boundary Protection

First-release risk scope must remain channel agnostic.

Risk items may mention:

- customer confirmation needed,
- customer follow-up needed,
- channel availability unknown,
- channel resolution pending in future design.

Risk items must not:

- assume LINE is the only channel,
- include raw LINE user id,
- use `line_user_id` as authorization key,
- send LINE messages,
- require existing LINE binding,
- block future App / Web / SMS support.

## Organization / RBAC / Audit Prerequisites

Before implementation, the team must define:

- which roles can see each risk type,
- which roles can acknowledge each risk type,
- which roles can assign / reassign each risk type,
- which roles can suppress each risk type,
- which roles can resolve each risk type,
- which evidence is visible to each role,
- how organization scope is enforced,
- how audit history is preserved.

First-release proposal should assume least privilege and separation of duties.

## Migration / API / Admin / Runtime Dependencies

Task186 creates no dependencies by itself.

Future implementation would still require separate tasks for:

- migration design,
- local-only dry-run approval if a migration exists,
- repository design,
- service/evaluator design,
- API implementation,
- Admin dashboard implementation,
- RBAC mapping,
- audit writes,
- no-send tests,
- feature flags and kill switches.

No implementation should begin just because first-release scope is proposed.

## Data Sensitivity and Redaction Requirements

First-release risk displays and handoffs should use safe summaries only.

Do not include:

- customer mobile / phone / tel values,
- raw LINE user id,
- raw channel identifiers,
- raw provider payloads,
- full Case payloads,
- full customer payloads,
- full appointment payloads,
- full report payloads,
- credentials,
- tokens,
- secrets,
- database connection values.

Allowed proposal-level fields:

- internal ids,
- safe Case number summary,
- risk type,
- severity,
- owner role,
- status summary,
- due timestamp,
- reason code,
- safe latest-action summary,
- redacted evidence reference if future permission allows.

## First-Release Rollout Constraints

Future rollout should start small:

- one organization or internal test environment first,
- no provider sending,
- no customer-facing SLA promise,
- no AI authoritative action,
- no shared runtime destructive cleanup,
- feature flag default off,
- read-only queue before human actions,
- human actions before evaluator automation,
- evaluator automation before any provider integration,
- no production RBAC shortcut.

Rollout should pause if risk items are noisy, confusing, or not actionable.

## Pause / Rollback Criteria

Future rollout should pause if:

- operators cannot understand risk meaning,
- false positives overwhelm queues,
- risk visibility exposes too much data,
- organization scope cannot be proven,
- role permission behavior is unclear,
- risk actions are not audited,
- AI output is mistaken for official truth,
- risk state is confused with Case status,
- notification sending happens unexpectedly,
- survey runtime is touched unexpectedly,
- `finalAppointmentId` or report completion invariants are weakened.

Rollback should disable future feature flags and preserve audit evidence if implementation later exists.

## Open Decisions and Required Approvals

Open decisions:

- Which first-release risk categories are approved?
- Which roles own each category?
- Which severities are shown to which roles?
- Which thresholds are acceptable for pilot use?
- Which clocks use business hours?
- Which organization timezone is used?
- Are risk items read-only in first release?
- Are acknowledge / assign / suppress / resolve actions included in first release?
- What audit visibility is required?
- What no-send tests are mandatory before rollout?
- Should AI be excluded entirely from first release?

Required approvals:

- PM / product approval,
- operations approval,
- engineering approval,
- security / privacy approval,
- RBAC / organization-scope approval,
- QA / no-send verification approval,
- shared runtime safety approval if any shared runtime is involved.

## Alignment with Task173-Task185

Task186 narrows the broad candidate list from Task175 into a proposal for first-release candidates.

It preserves:

- Task173 escalation is human review only,
- Task174 data model remains proposal-only,
- Task175 thresholds remain placeholders,
- Task176 clocks remain policy-only,
- Task177 dedupe / suppression remains design-only,
- Task178 dashboards remain future screens,
- Task179 human actions remain future workflows,
- Task180 audit/evidence remains policy-only,
- Task181 permission scope remains draft,
- Task182/183 Admin work remains no-code,
- Task184 API remains draft-only,
- Task185 readiness gate remains the blocker before implementation.

## Future Task Candidates

Potential safe next tasks:

- Task187 - SLA / Operations Risk RBAC Matrix Draft / No Runtime Change.
- SLA / Operations Risk First-Release Threshold Review / No Runtime Change.
- SLA / Operations Risk No-Send Test Plan / No Runtime Change.
- SLA / Operations Risk Feature Flag and Kill Switch Design / No Runtime Change.
- SLA / Operations Risk Read-Only Queue API Implementation Plan / No Runtime Change.
- SLA / Operations Risk Admin Read-Only Dashboard Implementation Plan / No Admin Code Change.

These are candidates only and do not authorize implementation.

## Verification Checklist

Task186 is complete only if:

- documentation-only is preserved,
- only documentation files are changed,
- no backend source file is modified,
- no Admin source file is modified,
- no API implementation is added,
- no routes / controllers / services / repositories are changed,
- no OpenAPI / generated client files are added,
- no executable schema / config is added,
- no smoke or browser smoke scripts are changed,
- no migration / schema / index is changed,
- no `package.json` change is made,
- no DB / psql / `npm run db:migrate` action is performed,
- no DDL is performed,
- no Migration 020 dry-run or apply is performed,
- no notification provider integration is added,
- no survey runtime is added,
- no AI automatic decision is added,
- no sensitive values are introduced,
- inventory docs remain frozen,
- `docs/PROJECT_GUARDRAILS.md` is not violated.

## Task186 Completion Note

Task186 proposes first-release candidate scope only. It does not approve runtime behavior, final production SLA commitments, production RBAC, Admin implementation, API implementation, migration work, provider sending, survey runtime, or AI automatic decision-making.
