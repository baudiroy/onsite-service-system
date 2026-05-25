# Task 185 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change

## Purpose and Non-Goals

Task185 defines a documentation-only readiness gate for future SLA / operations risk runtime implementation.

This document does not approve implementation. It defines what must be true before any future backend runtime, Admin UI, API, database, migration, job worker, notification delivery, provider sending, or AI automation work may begin.

Primary source of truth:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
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

Task185 does not:

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

All future SLA / operations risk tasks must preserve the following guardrails:

- One Case has one formal Field Service Report.
- One Case may have many appointments / dispatch visits.
- Same Case must not have multiple open appointments at once.
- Field Service Report remains the Case-level final summary.
- Preserve `field_service_reports.case_id` uniqueness principle.
- `finalAppointmentId` remains backend / system determined and stable after completion.
- Admin must not receive a normal manual `finalAppointmentId` picker.
- LINE remains a channel, not the hard-coded core model.
- `line_user_id` must not be treated as global identity.
- AI remains advisory only and must not approve, close, dispatch, settle, suppress, escalate, or change official state automatically.
- Large photos, signatures, and files must remain object / file storage design, not primary table blobs.
- Future design notes do not authorize runtime implementation.
- Documentation-only tasks may only modify documentation.

If a future task conflicts with `docs/PROJECT_GUARDRAILS.md`, it must stop and request clarification before implementation.

## Current Architecture Assumptions

Task185 assumes:

- Case is the core product entity.
- appointments / dispatch visits preserve visit-level history.
- Field Service Report is a single formal Case-level completion summary.
- completed report repeat completion is rejected before side effects.
- `finalAppointmentId` is stable after completion.
- Admin completion does not send `finalAppointmentId` by default.
- no SLA / operations risk runtime exists yet.
- no SLA / operations risk tables exist yet.
- no SLA / operations risk API exists yet.
- no SLA / operations risk Admin dashboard exists yet.
- no notification provider delivery is approved.
- survey runtime remains separate and paused.
- AI is advisory only.

SLA / operations risk design is currently a planning layer. It must not be confused with implemented system behavior.

## Task173-Task184 Readiness Summary

| Task | Contribution | Current status | Runtime implication |
| --- | --- | --- | --- |
| Task173 | escalation design | design-only | no runtime escalation approved |
| Task174 | data model proposal | no migration | no schema approved |
| Task175 | policy and threshold matrix | draft | thresholds need PM / operations approval |
| Task176 | clock source and business-hours policy | draft | timezone/calendar decisions still required |
| Task177 | dedupe and suppression policy | draft | write/idempotency rules not implemented |
| Task178 | dashboard role queue design | draft | no Admin screen approved |
| Task179 | human action workflow design | draft | actions not implemented |
| Task180 | action audit and evidence policy | draft | audit/evidence runtime not implemented |
| Task181 | permission and organization scope review | draft | production RBAC not finalized |
| Task182 | Admin dashboard wireframe requirements | no Admin code | UI is not implemented |
| Task183 | dashboard copy and empty-state policy | no Admin code | copy is not implemented |
| Task184 | API contract draft | no API code | routes/controllers/OpenAPI not implemented |

Task173 through Task184 are enough for structured planning. They are not enough to begin runtime implementation.

## Ready / Not Ready Matrix

| Area | Ready for planning | Ready for implementation | Reason |
| --- | --- | --- | --- |
| Product risk categories | Yes | No | first-release risk scope is not approved |
| SLA thresholds | Yes | No | brand/vendor/warranty/customer-tier differences need approval |
| Business-hours clock | Yes | No | calendar source and pause/resume policy need implementation design |
| Dedupe / suppression | Yes | No | idempotency, audit, and re-alert behavior need runtime proof |
| Human actions | Yes | No | permission, stale-state, and audit contracts are not implemented |
| Organization scope | Yes | No | production RBAC mapping is not finalized |
| Evidence references | Yes | No | storage, retention, and visibility are not finalized |
| API draft | Yes | No | no route/controller/service/repository/OpenAPI work approved |
| Admin dashboard | Yes | No | no Admin source work approved |
| Notification delivery | No | No | provider sending is out of scope |
| Survey interaction | No | No | survey runtime remains paused |
| AI advisory | Yes | No | AI runtime and permission boundaries are not implemented |

## PM / Business Approval Requirements

Before implementation, PM / business stakeholders must approve:

- first-release risk types,
- severity definitions,
- SLA threshold matrix,
- escalation ownership,
- role responsibility by queue,
- suppression policy by severity,
- re-alert / cooldown policy,
- customer-facing impact, if any,
- operator copy direction,
- dashboard first-release scope,
- definition of success metrics,
- rollout scope and pilot organization if applicable.

General continuation language is not enough. Runtime work requires explicit task-level approval.

## Technical Approval Requirements

Before implementation, engineering must approve:

- storage model,
- migration plan,
- organization-scope enforcement,
- RBAC mapping,
- audit log model,
- evidence reference and redaction model,
- idempotency keys,
- stale-state conflict behavior,
- dedupe grouping behavior,
- suppression write behavior,
- evaluator execution model,
- feature flag / kill switch behavior,
- no-send tests,
- safe API response allow-list,
- rollback and failure behavior,
- observability and error handling.

These approvals should be captured in a future implementation packet before code changes.

## Migration Readiness Blockers

No SLA / operations risk migration is approved by Task185.

Migration work is blocked until:

- table ownership is defined,
- retention policy is approved,
- redaction policy is approved,
- organization-scope constraints are designed,
- same-Case / same-organization relationships are guarded,
- local-only dry-run approval is explicit,
- shared apply is separately approved,
- rollback and compatibility are reviewed.

Migration 020 remains paused and unrelated to this SLA / operations risk branch unless a future task explicitly defines a safe interaction.

## Runtime Service Readiness Blockers

Runtime service work is blocked until:

- risk evaluator input events are defined,
- evaluator frequency is defined,
- clock calculation source is approved,
- idempotency behavior is designed,
- dedupe behavior is designed,
- suppression behavior is designed,
- action transition rules are approved,
- audit write contract is defined,
- evidence reference allow-list is defined,
- no-send behavior is tested,
- failure behavior is defined.

Future runtime must not mutate official Case / Appointment / Field Service Report lifecycle state automatically unless separately approved.

## API Implementation Readiness Blockers

Task184 is a draft only.

API implementation is blocked until:

- endpoint names are approved,
- request allow-lists are approved,
- response allow-lists are approved,
- pagination and sorting limits are defined,
- role visibility rules are mapped,
- evidence visibility checks are designed,
- stale-state conflict behavior is defined,
- idempotency behavior for actions is defined,
- error messages are reviewed for safety,
- generated clients or OpenAPI files are explicitly approved if needed.

Future API responses must not expose full customer, appointment, report, provider, channel, or evidence payloads by default.

## Admin Dashboard Readiness Blockers

Admin dashboard implementation is blocked until:

- first-release screens are selected,
- navigation placement is approved,
- queue list columns are approved,
- detail panel sections are approved,
- action controls are approved,
- empty states and error states are approved,
- permission-based visibility states are approved,
- no manual `finalAppointmentId` picker remains confirmed,
- no AI-authoritative copy is introduced,
- no provider-delivery copy appears before delivery exists.

Task182 and Task183 are planning references only. They do not authorize Admin source changes.

## Notification / Provider Readiness Blockers

Provider delivery is out of scope.

Notification/provider work is blocked until:

- delivery channel strategy is approved,
- delivery eligibility rules are defined,
- provider credential handling is reviewed,
- opt-out and suppression policy are defined,
- retry and failure behavior are defined,
- no-send tests exist,
- outbound shared runtime policy is approved,
- provider payload redaction is approved.

SLA / operations risk runtime must not send LINE, APP, SMS, email, or any other provider message by itself.

## Survey Runtime Interaction Blockers

Survey runtime remains a separate paused branch.

SLA / operations risk implementation must not:

- emit survey events,
- create survey intents,
- write event outbox rows,
- send survey messages,
- alter `case.service_completion.first_transitioned` semantics,
- weaken repeat completion guards,
- re-infer `finalAppointmentId` after completion.

If a future SLA risk feature references survey state, a separate integration design is required.

## Organization / RBAC / Audit Readiness Conditions

Before runtime, the design must prove:

- every risk item belongs to one organization,
- user visibility is organization-scoped,
- view permission is separate from action permission,
- action permission is separate from official lifecycle mutation permission,
- evidence visibility is permission-checked separately,
- suppression and resolution require stronger permission,
- audit history is preserved,
- cross-role visibility is explicit and auditable,
- raw channel identifiers do not become authorization keys.

Role dashboards must not become a shortcut around organization scope or Admin permission boundaries.

## AI Advisory Boundary Gate

AI may be used only as advisory support.

Allowed future AI-adjacent behavior:

- summarize risk context,
- suggest missing evidence,
- suggest possible next human review action,
- explain risk priority,
- flag uncertainty for human review.

Not allowed:

- AI auto-escalates,
- AI auto-suppresses,
- AI auto-resolves,
- AI changes Case / Appointment / Report state,
- AI chooses delivery channel,
- AI sends notifications,
- AI approves billing / settlement,
- AI overrides permissions,
- AI converts uncertain facts into official records.

Any AI field must be labeled as advisory and must remain distinct from official records.

## Data Sensitivity and Redaction Gate

Future implementation must use allow-listed fields only.

Do not include:

- customer mobile / phone / tel values,
- raw LINE user id,
- raw provider identifiers,
- raw provider payloads,
- full customer payloads,
- full appointment payloads,
- full report payloads,
- credentials,
- tokens,
- secrets,
- database connection values,
- unrestricted evidence payloads.

Safe summaries may include internal ids, status summaries, reason codes, severity, due timestamps, owner role, assigned owner summary, and redacted evidence references when the user has permission.

## Channel-Agnostic Integration Gate

SLA / operations risk design must remain channel agnostic.

Future implementation should:

- treat LINE as one possible channel, not the core identity model,
- support future APP / Web / SMS workflows without changing Case / Report invariants,
- keep reverse LINE binding as a separate identity flow,
- avoid raw channel identifiers in dashboard payloads,
- avoid provider-specific state in core risk records unless explicitly modeled,
- keep delivery resolver decisions outside the risk evaluator unless separately approved.

No risk item should assume the Case was created by LINE.

## Case / Appointment / Field Service Report Invariant Gate

Future implementation must not weaken:

- one Case = one formal Field Service Report,
- one Case may have many visits,
- visit outcomes belong to appointment / dispatch visit records,
- Field Service Report remains a Case-level summary,
- `finalAppointmentId` remains stable after completion,
- completed report repeat completion remains blocked before side effects,
- Admin has no normal manual final appointment picker,
- one-open-appointment invariant remains intact.

Risk state is an operational review layer. It is not official Case lifecycle state.

## Safe Implementation Sequencing Proposal

If implementation is approved later, a safe sequence would be:

1. Finalize first-release risk scope and threshold matrix.
2. Finalize RBAC / organization / audit policy.
3. Design migration with explicit local-only dry-run approval.
4. Add inert repositories without evaluator or provider sending.
5. Add no-send tests for risk creation and idempotency.
6. Add read-only list/detail API behind a feature flag.
7. Add Admin read-only dashboard behind a feature flag.
8. Add audited human actions one at a time.
9. Add evaluator runtime only after idempotency, dedupe, and suppression tests pass.
10. Consider provider or survey integration only in separate tasks.

Each step should be separately approved. Passing one step does not approve the next.

## Explicit No-Go Conditions

Do not start implementation if:

- product scope is unclear,
- severity thresholds are not approved,
- organization scope cannot be enforced,
- RBAC cannot separate view / action / evidence permissions,
- audit model is missing,
- redaction policy is missing,
- no-send test plan is missing,
- implementation requires shared DB apply without explicit approval,
- implementation would send provider notifications,
- implementation would write survey runtime rows,
- implementation would let AI decide outcomes,
- implementation would mutate official Case / Appointment / Report lifecycle state automatically,
- implementation would expose sensitive values,
- implementation would weaken completed report or `finalAppointmentId` invariants,
- implementation would violate `docs/PROJECT_GUARDRAILS.md`.

## Future Task Candidates

Potential next tasks that remain safe if scoped as documentation-only:

- SLA / Operations Risk Readiness Gate PM Review Follow-up.
- SLA / Operations Risk First-Release Risk Scope Proposal.
- SLA / Operations Risk RBAC Matrix Draft.
- SLA / Operations Risk Migration Design Review / No DDL.
- SLA / Operations Risk No-Send Test Plan.
- SLA / Operations Risk Feature Flag and Kill Switch Design.
- SLA / Operations Risk Evaluator Idempotency Design.
- SLA / Operations Risk Read-Only API Implementation Plan.
- SLA / Operations Risk Admin Read-Only Dashboard Implementation Plan.
- Existing Case Reverse LINE Binding Product Design.
- Channel Abstraction Core Model Review.

These are candidates only. They do not authorize implementation.

## Verification Checklist

Task185 is complete only if:

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

## Task185 Completion Note

Task185 creates a runtime readiness gate only. It does not mark SLA / operations risk runtime as ready to implement.

Future runtime work requires explicit product, technical, security, RBAC, migration, no-send test, shared runtime safety, and guardrail-alignment approvals. Until those approvals exist, SLA / operations risk work should remain documentation / planning only or move to another product-mainline design branch.
