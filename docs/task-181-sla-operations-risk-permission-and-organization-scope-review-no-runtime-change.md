# Task 181 - SLA / Operations Risk Permission and Organization Scope Review / No Runtime Change

## Purpose and Non-Goals

Task181 defines a proposal-only permission and organization-scope review for future SLA / operations risk workflows.

This document builds on:

- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`
- `docs/task-176-sla-operations-risk-clock-source-and-business-hours-policy-no-runtime-change.md`
- `docs/task-177-sla-operations-risk-dedupe-and-suppression-policy-no-runtime-change.md`
- `docs/task-178-sla-operations-risk-dashboard-role-queue-design-no-runtime-change.md`
- `docs/task-179-sla-operations-risk-human-action-workflow-design-no-runtime-change.md`
- `docs/task-180-sla-operations-risk-action-audit-and-evidence-policy-no-runtime-change.md`

Task181 discusses future role permissions, organization boundaries, queue visibility, action authority, audit visibility, and escalation scope before any runtime, Admin UI, API, database, RBAC, organization model, workflow, or notification implementation exists.

Task181 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke or browser smoke scripts,
- add tests,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- add SLA runtime,
- add operations task runtime,
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

## Current Architecture Assumptions

Task181 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to dispatch and service execution,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / operations risk permissions must not replace official Case / Appointment / Report permissions,
- future queues and audit should remain organization scoped,
- channel delivery is not approved,
- AI is advisory only.

Permission design is a safety boundary. It should determine who may see, review, or act on future risk items without widening access to sensitive data or official lifecycle mutation.

## Permission Review Principles

Future SLA / operations risk permissions should follow these principles:

1. Start from least privilege.
2. Keep organization scope explicit on every risk item and action.
3. Separate view permission from action permission.
4. Separate action permission from lifecycle mutation permission.
5. Separate queue visibility from evidence visibility.
6. Require stronger permission for suppression, de-escalation, non-actionable marking, and severe risk resolution.
7. Preserve audit visibility for authorized reviewers.
8. Avoid cross-organization leakage.
9. Keep AI advisory and non-authoritative.
10. Do not assume provider sending permission from risk workflow permission.

## Organization Scope Principles

Future risk workflow should use organization scope as a primary boundary.

Recommended principles:

- a risk item belongs to one organization,
- queue visibility should be restricted to users authorized for that organization,
- evidence access should be checked separately from risk row visibility,
- cross-branch or multi-department views should still be within the approved organization scope,
- provider/channel identifiers should not be used as the organization boundary,
- raw LINE user id must not become a global authorization key,
- future reverse binding and channel identity design should remain separate from risk permissions.

If multi-organization support is expanded later, runtime must prevent a user from seeing or acting on another organization's risks unless an explicit cross-organization admin permission exists.

## Proposal-Only Actor Categories

The following categories are placeholders, not production RBAC definitions.

| Actor category | Possible visibility | Possible action boundary |
| --- | --- | --- |
| Customer service | Customer follow-up and appointment confirmation queues | acknowledge, triage, comment, request follow-up |
| Dispatch coordinator | scheduling and pending visit queues | acknowledge, assign, reassign within dispatch scope, comment |
| Engineer lead | field execution and report hygiene queues | acknowledge, triage, comment, request engineer follow-up |
| Supervisor / quality | severe risk, complaint, exception, suppression review | suppress, unsuppress, escalate, de-escalate, resolve high-risk items |
| Finance / settlement | billing / settlement risk queues | acknowledge, triage, comment, resolve finance evidence risk |
| Auditor / reviewer | audit and evidence review | view audit, review evidence, no operational mutation by default |
| Admin / operations manager | cross-role operational visibility | policy review, supervisor-level actions if granted |
| System policy | deterministic future evaluator | create/update risk candidates only after runtime approval |
| AI assistant | suggestion-only | no permission grants or authoritative action |

## Queue Visibility Scope

Future queue visibility should be scoped by:

- organization,
- user role,
- assigned owner,
- queue type,
- severity,
- risk category,
- evidence sensitivity,
- audit sensitivity,
- branch or department if future model supports it.

Queue visibility should not imply:

- ability to suppress,
- ability to resolve,
- ability to see all evidence,
- ability to send notifications,
- ability to mutate official Case / Appointment / Report state.

## Action Authority Matrix

The following matrix is proposal-only and must not be treated as production RBAC.

| Action | Suggested minimum authority | Notes |
| --- | --- | --- |
| view queue item | role or owner visibility | evidence may require separate permission |
| acknowledge | visible role member | does not resolve |
| triage | visible role member | should not change lifecycle |
| assign | queue owner / coordinator | cross-role assignment may need supervisor |
| reassign | current owner / coordinator / supervisor | preserve prior owner history |
| comment | visible role member | safe comments only |
| attach evidence | authorized role with evidence permission | no raw payload embedding |
| suppress | supervisor or approved queue owner | P0/P1 likely supervisor-only |
| unsuppress | supervisor or suppression owner | review required |
| escalate | owner / supervisor / deterministic policy | no provider sending |
| de-escalate | supervisor or authorized reviewer | reason required |
| resolve | owner or supervisor depending severity | evidence required |
| reopen | owner / supervisor / deterministic policy | preserve history |
| mark non-actionable | supervisor or authorized reviewer | reason required |
| review audit | auditor / supervisor / admin | scoped by organization and sensitivity |

## Audit and Evidence Visibility Scope

Task180 separates risk action audit from evidence references.

Future permission model should:

- allow a user to see a queue row without automatically seeing all evidence,
- restrict sensitive evidence to authorized roles,
- redact audit note content when necessary,
- separate operational audit visibility from provider delivery logs,
- preserve supervisor and auditor review paths,
- keep AI-suggested content labeled.

Evidence access should be checked by organization and evidence type.

## Sensitive Data Minimization

Future permission design should minimize sensitive exposure:

- show safe summaries by default,
- store internal ids and reason codes rather than raw values,
- hide customer contact values unless a role needs them through a separate approved workflow,
- hide raw channel identifiers,
- hide raw provider payloads,
- hide credentials and tokens,
- avoid full object payload display,
- avoid broad exports by default.

Minimization should apply to dashboards, audit views, exports, AI summaries, and handoff reports.

## Cross-Organization / Multi-Branch Risks

Future implementation should explicitly handle:

- user belongs to multiple organizations,
- organization has multiple branches or service teams,
- vendor or brand-specific work spans teams,
- supervisor needs cross-branch visibility,
- finance needs evidence without customer communication details,
- auditor needs history without mutation permissions,
- support staff should not see unrelated organization cases.

Cross-organization or cross-branch views should be explicit and auditable. They should not emerge accidentally from shared dashboards or broad queries.

## Least Privilege and Separation of Duties

Recommended separation:

- customer service can follow up but not suppress severe complaint risk without review,
- dispatch can assign scheduling risk but not close a Case,
- engineer lead can review field blockers but not override final report completion rules,
- finance can review billing evidence but not decide service completion,
- supervisor can resolve exceptions but actions remain audited,
- auditor can review but does not mutate by default,
- AI can suggest but cannot act.

Permission design should prevent one role from silently completing the full detect-suppress-resolve cycle for high-risk items without oversight.

## Escalation Scope and Manager Review

Escalated items should widen visibility only to authorized managers or supervisors within scope.

Escalation should not:

- reveal evidence to unauthorized users,
- cross organization boundaries by default,
- send provider notifications,
- mutate official Case / Appointment / Report lifecycle,
- grant permission to suppress or resolve automatically.

P0 / P1 risks should require stronger review for suppression, de-escalation, and non-actionable marking.

## Permission Failure Modes

Future runtime should be designed to fail closed.

Potential failure modes:

| Failure | Expected behavior |
| --- | --- |
| missing organization scope | deny action / hide item |
| unknown role | deny action |
| missing evidence permission | show risk row but hide evidence detail |
| stale assignment | require refresh before mutation |
| cross-organization action attempt | reject and audit safely |
| AI suggested unauthorized action | show suggestion only if allowed; never execute |
| provider channel unavailable | do not send; keep workflow internal |
| audit write unavailable | future runtime should decide fail-closed policy before implementation |

## AI Advisory Boundaries

AI may suggest:

- likely owner role,
- possible permission gap,
- safe summary for a user with access,
- missing evidence,
- duplicate risk pattern,
- severity review need.

AI must not:

- grant permissions,
- change visibility,
- route across organizations,
- assign,
- suppress,
- unsuppress,
- escalate authoritatively,
- de-escalate authoritatively,
- resolve,
- reopen,
- notify,
- decide whether a user may view evidence,
- decide final audit or permission outcome.

## Channel-Agnostic Notification Readiness Notes

Risk permission is not provider permission.

Future design should keep separate:

- risk queue visibility,
- workflow action authority,
- notification request authority,
- provider delivery authority,
- channel identity resolution,
- customer opt-out / suppression policy if future product requires it.

LINE may be a delivery candidate later, but core risk permission should not hard-code LINE or use raw LINE user id as an authorization boundary.

## Alignment with Task180 Audit / Evidence Policy

Task180 requires safe audit and evidence handling. Task181 adds:

- who may view audit,
- who may act on audit evidence,
- who may attach evidence,
- who may resolve based on evidence,
- how sensitive evidence remains protected.

Audit visibility should not imply mutation authority.

## Alignment with Task179 Human Action Workflow

Task179 defines proposal-only actions. Task181 adds authority boundaries for those actions.

Future implementation should map every action to:

- actor permission,
- organization scope,
- evidence access scope,
- audit requirement,
- failure behavior.

## Alignment with Task178 Dashboard Role Queues

Task178 defines queue views. Task181 clarifies that queue membership and visibility are not final RBAC.

Future dashboards should:

- filter by organization,
- filter by role / assignment,
- hide unauthorized evidence,
- show safe summaries,
- avoid cross-scope leakage,
- prevent unavailable actions from appearing as if allowed.

## Alignment with Task177 Dedupe / Suppression Policy

Task177 requires suppression to be explicit and auditable.

Task181 adds:

- P0 / P1 suppression likely requires supervisor authority,
- suppression visibility may remain available to supervisor queues,
- non-actionable marking should be restricted,
- dedupe grouping must not expose inaccessible source records.

## Alignment with Task176 Clock / Business-Hours Policy

Clock display and clock-affecting actions should require permission.

Future permissions should distinguish:

- viewing due / overdue state,
- pausing or resuming a risk clock,
- suppressing alert visibility,
- resolving a risk,
- changing policy configuration.

Task181 does not approve clock runtime.

## Alignment with Task175 Threshold / Severity Policy

Severity should influence permission strength.

Recommended direction:

- P0 / P1 suppression: supervisor review,
- P0 / P1 de-escalation: supervisor review,
- P0 / P1 non-actionable: supervisor or auditor review,
- P2 / P3 acknowledgment: role owner may handle,
- Info: view-only or batch review depending policy.

Severity still does not permit automatic mutation.

## Alignment with Task174 Data Model Proposal

Task174 proposed future `case_risk_flags`, `operations_tasks`, and safe metadata.

Task181 implies future data model may need:

- organization scope on every risk item,
- owner / role assignment fields,
- action actor references,
- evidence access control references,
- audit visibility scope,
- policy / role version references.

Task181 does not create migration-ready fields, constraints, or indexes.

## Alignment with Task173 Escalation Design

Task173 defines escalation as operational and advisory.

Task181 preserves:

- escalation must remain scoped,
- supervisor review should be explicit,
- AI cannot decide escalation outcome,
- escalation cannot send provider messages by itself,
- escalation cannot complete Cases or reports.

## Future Runtime / Admin / API / RBAC Guardrails

Before implementation, a future task must define:

- final RBAC model,
- organization / branch model,
- permission naming,
- API authorization contract,
- Admin UI disabled / hidden action behavior,
- evidence access rules,
- audit visibility rules,
- export restrictions,
- no-provider-send tests,
- cross-organization negative tests,
- AI suggestion visibility rules.

Task181 is not implementation approval.

## Future Task Candidates

Recommended future safe tasks:

1. Task182 - SLA / Operations Risk Admin Dashboard Wireframe Requirements / No Admin Code Change.
2. Task183 - SLA / Operations Risk API Contract Draft / No Runtime Change.
3. Task184 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change.
4. Task185 - SLA / Operations Risk Documentation Consolidation and Pause Summary / No Runtime Change.
5. Task186 - Product Mainline Branch Selection Review / No Runtime Change.

These suggestions do not approve runtime, API, Admin source, RBAC implementation, DB, migration, provider delivery, survey runtime, or AI automatic decision work.

## Verification Checklist

Task181 should be considered valid only if:

- it remains documentation-only,
- it does not modify backend `src/`,
- it does not modify Admin frontend `admin/src/`,
- it does not modify APIs,
- it does not modify smoke or browser smoke scripts,
- it does not add migrations,
- it does not change schema or indexes,
- it does not apply or dry-run Migration 020,
- it does not connect to DB,
- it does not run psql or `npm run db:migrate`,
- it does not send provider messages,
- it does not enable survey runtime,
- it does not add AI automatic decisions,
- it does not modify inventory docs,
- it does not output sensitive values,
- `npm run check` passes,
- `npm run admin:check` passes,
- `git diff --check` passes,
- sensitive scan shows no actual secrets, raw identifiers, raw payloads, or customer data.
