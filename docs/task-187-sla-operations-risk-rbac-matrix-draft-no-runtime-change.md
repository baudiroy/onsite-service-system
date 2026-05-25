# Task 187 - SLA / Operations Risk RBAC Matrix Draft / No Runtime Change

## Purpose and Non-Goals

Task187 defines a documentation-only RBAC matrix draft for future SLA / operations risk workflows.

This document is a proposal-only planning artifact. It does not define production RBAC, executable permission configuration, backend code, Admin code, API behavior, database schema, runtime behavior, notification delivery, survey runtime, or AI automation.

Task187 builds on:

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
- `docs/task-185-sla-operations-risk-runtime-readiness-gate-no-migration-or-runtime-change.md`
- `docs/task-186-sla-operations-risk-first-release-risk-scope-proposal-no-runtime-change.md`

Task187 does not:

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

Task187 preserves:

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

RBAC design must reduce operational risk without widening access to official lifecycle mutation, sensitive customer data, raw channel identifiers, provider credentials, or unreviewed AI output.

## Current Architecture Assumptions

Task187 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk tables exist,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no executable permission configuration exists for this branch,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only,
- current Case / Appointment / Field Service Report behavior must not change.

Permission planning is therefore conceptual. Future implementation must revalidate this matrix against actual user roles, organization model, branch/team model, audit model, evidence model, and API contracts.

## RBAC Draft Principles

Future SLA / operations risk permissions should follow these principles:

1. Least privilege by default.
2. Every queue item and action must be organization scoped.
3. Queue visibility does not imply evidence visibility.
4. View permission does not imply action permission.
5. Action permission does not imply official Case / Appointment / Field Service Report lifecycle mutation permission.
6. Suppression, unsuppression, de-escalation, high-severity resolution, and non-actionable marking require stronger authority.
7. Cross-role or cross-team reassignment must be explicit and auditable.
8. Audit visibility should be scoped by role, organization, and sensitivity.
9. AI advisory visibility must not become AI action authority.
10. Provider delivery, customer messaging, survey sending, and channel resolution are outside this RBAC draft.

## Proposal-Only Actor Categories

These actor categories are placeholders for planning. They are not production role names and do not grant actual permissions.

| Actor category | Primary concern | Default posture |
| --- | --- | --- |
| Customer service | customer contact, appointment confirmation, quote follow-up | can view and triage customer-follow-up risks within scope |
| Dispatch coordinator | scheduling, assignment, route readiness, pending next visit | can view and act on dispatch queues within scope |
| Engineer lead | field execution, visit progress, report hygiene | can review field execution risks and request engineer follow-up |
| Parts coordinator | pending parts, ETA, stock readiness, next visit unblock | can review parts-related risks without financial approval |
| Supervisor / quality | severe risk, repeat incomplete visits, exceptions, customer quality | can resolve / suppress higher-risk items with reasons |
| Finance / settlement | billing evidence, settlement blockers, fee approval readiness | can review finance-related risks when future scope allows |
| Auditor / reviewer | audit trail, evidence review, policy adherence | view audit/evidence according to scope; no operational mutation by default |
| Admin / operations manager | operational oversight across queues | can perform supervisor-level actions if explicitly granted |
| System policy evaluator | deterministic future evaluator | may create/update risk candidates only after runtime approval |
| AI assistant | suggestions, summaries, missing-field reminders | no permission grants and no authoritative action |

## Permission Catalog

The following permission names are proposal-only labels for future discussion.

| Permission label | Meaning | Does it mutate official lifecycle? |
| --- | --- | --- |
| `risk.queue.view` | view permitted risk queue rows | No |
| `risk.detail.view` | view permitted risk detail summary | No |
| `risk.evidence.view` | view permitted evidence references or safe evidence summaries | No |
| `risk.audit.view` | view permitted risk action audit | No |
| `risk.acknowledge` | mark item as seen / owned for review | No |
| `risk.triage` | classify or prioritize within allowed workflow | No |
| `risk.assign` | assign owner within allowed scope | No official Case mutation |
| `risk.reassign` | move owner within allowed scope | No official Case mutation |
| `risk.comment` | add internal risk workflow note | No official Case mutation |
| `risk.evidence.attach_reference` | attach approved evidence reference, not raw payload | No official Case mutation |
| `risk.escalate` | raise visibility / severity path within policy | No official Case mutation |
| `risk.de_escalate` | lower escalation path with reason | No official Case mutation |
| `risk.resolve` | mark risk workflow item resolved after human review | No official Case mutation |
| `risk.reopen` | reopen risk workflow item | No official Case mutation |
| `risk.suppress` | suppress future alerts under policy | No official Case mutation |
| `risk.unsuppress` | remove suppression under policy | No official Case mutation |
| `risk.non_actionable.mark` | mark item non-actionable with reason | No official Case mutation |
| `risk.ai_hint.view` | view AI advisory hint if permitted | No |
| `risk.export.safe_summary` | export safe summaries only | No |

No permission in this catalog allows:

- completing a Field Service Report,
- closing a Case,
- creating or cancelling appointments,
- overriding `finalAppointmentId`,
- approving quotes,
- approving billing / settlement,
- sending customer notifications,
- triggering survey delivery,
- granting another user permissions.

## Organization / Branch / Team Scope Assumptions

Organization scope is mandatory for every future risk item and action.

Recommended scope labels:

| Scope label | Meaning | Notes |
| --- | --- | --- |
| organization | user may see or act only within authorized organization | required baseline |
| assigned-owner | user may act only on items assigned to self | least-privilege useful for frontline work |
| queue-role | user may act on queue categories matching role | customer service / dispatch / engineer lead examples |
| branch | future branch-level scope if branch model exists | placeholder only |
| team | future service team scope if team model exists | placeholder only |
| supervisor-scope | supervisor may see broader queue within organization | must be explicit |
| auditor-scope | auditor may review history/evidence without mutation | must be read-only by default |
| system-policy | deterministic evaluator writes under backend policy | future runtime only |

Branch and team scope are placeholders. Task187 does not approve branch/team schema, runtime filters, or cross-branch dashboards.

## RBAC Matrix Draft

This matrix is a draft for future planning only.

Legend:

- `Y` = likely allowed if organization and role scope match.
- `S` = supervisor / stronger permission likely required.
- `E` = evidence-specific permission required.
- `A` = audit-specific permission required.
- `N` = not allowed by default.
- `F` = future branch/team policy required.

| Action / actor | Customer service | Dispatch | Engineer lead | Parts coordinator | Supervisor / quality | Finance | Auditor | Admin / ops manager | AI assistant |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View own scoped queue | Y | Y | Y | Y | Y | Y | Y | Y | N |
| View cross-role queue | N | F | F | F | S | F | A | S | N |
| View safe detail summary | Y | Y | Y | Y | Y | Y | A | Y | N |
| View sensitive evidence | E | E | E | E | E | E | A | E | N |
| View audit history | N | N | N | N | A | A | A | A | N |
| Acknowledge | Y | Y | Y | Y | Y | Y | N | Y | N |
| Triage | Y | Y | Y | Y | Y | Y | N | Y | N |
| Assign within queue | N | Y | Y | Y | S | N | N | S | N |
| Reassign across queue | N | F | F | F | S | N | N | S | N |
| Comment safe note | Y | Y | Y | Y | Y | Y | A | Y | N |
| Attach evidence reference | E | E | E | E | E | E | N | E | N |
| Escalate | Y | Y | Y | Y | Y | Y | N | Y | N |
| De-escalate | N | N | N | N | S | N | N | S | N |
| Resolve low/medium risk | Y | Y | Y | Y | Y | Y | N | Y | N |
| Resolve high/severe risk | N | N | N | N | S | N | N | S | N |
| Reopen | Y | Y | Y | Y | S | Y | N | S | N |
| Suppress | N | N | N | N | S | N | N | S | N |
| Unsuppress | N | N | N | N | S | N | N | S | N |
| Mark non-actionable | N | N | N | N | S | N | N | S | N |
| View AI advisory hint | Y | Y | Y | Y | Y | Y | A | Y | read-only generation only |
| Export safe summary | N | N | N | N | S | F | A | S | N |

AI assistant has no RBAC action authority. It may generate suggestions only when a future approved service asks it to, and its output must be presented to authorized humans under their own permissions.

## Action Authority Boundaries

Future SLA / operations risk actions must stay separate from official lifecycle actions.

Risk workflow may eventually allow:

- acknowledging a risk item,
- triaging a risk item,
- assigning a human owner,
- adding an internal risk note,
- escalating for review,
- resolving the risk workflow item,
- suppressing with reason and authority.

Risk workflow must not by itself:

- create an appointment,
- cancel an appointment,
- mark a visit completed,
- complete a Field Service Report,
- close a Case,
- select or override `finalAppointmentId`,
- approve a quote,
- approve billing / settlement,
- send customer-facing messages,
- trigger survey sending,
- mutate customer identity or LINE binding.

If a future UI links from a risk item to a Case / Appointment / Report workflow, that target workflow must enforce its own existing permissions and guards.

## Audit and Evidence Visibility Matrix

Risk visibility and evidence visibility should be separated.

| Data / evidence type | Default visibility | Notes |
| --- | --- | --- |
| risk category | queue-visible roles | safe code or label only |
| risk severity | queue-visible roles | avoid implying blame |
| safe reason summary | queue-visible roles | no raw customer/channel values |
| Case reference | queue-visible roles | internal id/case number only if role can view case |
| Appointment reference | queue-visible roles | only if role can view appointment |
| Field Service Report reference | permitted report viewers | report visibility remains separate |
| customer contact value | not shown by default | use separate customer contact workflow if needed |
| raw LINE user id | not shown | never use as dashboard identity |
| provider payload | not shown | store/view only through separate provider log policy if approved |
| AI advisory hint | permitted roles only | must be labeled advisory |
| risk action audit | supervisor / auditor / authorized admin | organization scoped |
| suppression reason | supervisor / auditor / authorized admin | sensitive operational context |
| evidence attachment reference | evidence-permitted roles | reference only, not raw payload dump |

Future exports must be safe summary exports by default and should require explicit permission.

## AI Advisory Visibility and Action Boundaries

AI may support future risk review by:

- summarizing why a risk was detected,
- suggesting what fields to check,
- describing uncertainty,
- highlighting missing evidence,
- proposing a possible owner role,
- summarizing repeated incomplete visit patterns.

AI must not:

- grant permissions,
- widen visibility,
- route across organizations,
- assign or reassign risk items,
- suppress or unsuppress,
- escalate or de-escalate as authoritative action,
- resolve or reopen,
- approve quote / settlement / billing,
- mutate Case / Appointment / Report state,
- send customer messages,
- decide official severity without deterministic policy and human review,
- expose sensitive values in summaries.

Any AI hint must be visible only to users who already have permission to see the underlying risk context.

## Sensitive Data Minimization

Future SLA / operations risk RBAC should minimize exposure:

- show safe summaries rather than raw values,
- avoid raw contact values in risk rows,
- avoid raw channel identifiers,
- avoid provider payloads,
- avoid credential-like values,
- avoid full object payloads,
- avoid copying internal notes into customer-facing contexts,
- avoid embedding full report or appointment payloads,
- avoid broad exports,
- redact evidence details for unauthorized roles.

Risk views should not display:

- customer mobile / phone / tel values,
- raw LINE user id,
- LINE channel secret,
- LINE access token,
- provider credentials,
- token values,
- password values,
- `DATABASE_URL`,
- raw payload,
- full payload.

## Least Privilege and Separation of Duties

The first implementation should avoid giving a single frontline role full detect-to-suppress control for high-risk items.

Recommended separation:

- customer service may triage customer follow-up risk but not suppress severe unresolved risk,
- dispatch may handle scheduling risk but not close Case / Report state,
- engineer lead may handle field execution risk but not override final appointment rules,
- parts coordinator may handle parts blockers but not approve billing,
- finance may handle future finance risk but not complete service work,
- supervisor / quality may resolve or suppress severe items with audit,
- auditor may review without mutation by default,
- AI may advise but not act.

High-impact actions should require reason codes and audit trails.

## Permission Failure Modes and Safe-Deny Behavior

Future runtime should fail closed.

Safe-deny expectations:

- if organization scope cannot be verified, deny,
- if role scope cannot be verified, deny,
- if branch/team scope is requested but unsupported, deny or ignore safely according to approved policy,
- if evidence permission is missing, show risk summary without evidence details,
- if audit permission is missing, hide audit history,
- if AI context would expose data the user cannot see, hide AI hint,
- if suppression authority is missing, deny suppression,
- if stale-state conflict occurs, reject action and ask user to refresh,
- if provider/channel data is unavailable, do not expose raw fallback values,
- if permission error occurs, return safe generic error without leaking whether another organization's item exists.

Permission failures must not leak:

- whether a Case exists outside the user's scope,
- whether a customer phone value is correct,
- whether a LINE identity is bound,
- raw channel ids,
- raw provider payloads,
- credentials or tokens.

## First-Release Scope Alignment with Task186

Task187 RBAC draft supports the Task186 first-release candidate risks:

| Risk category | Likely queue role | Stronger review when |
| --- | --- | --- |
| `case_not_dispatched` | dispatch / customer service | aging or repeated missed handoff |
| `case_no_open_appointment` | dispatch | repeated terminal visits without next step |
| `appointment_unassigned` | dispatch | near due time or high severity |
| `appointment_unconfirmed` | customer service | repeated customer non-response |
| `appointment_not_started` | dispatch / engineer lead | high severity or repeated pattern |
| `appointment_stale_on_site` | engineer lead | long stale duration or complaint context |
| `pending_parts_no_next_visit` | parts coordinator / dispatch | overdue ETA or repeated pending parts |
| `pending_quote_no_customer_decision` | customer service / supervisor | high amount or repeated non-response |
| `report_in_progress_too_long` | engineer lead / supervisor | near completion blocking / repeat issue |
| `completion_blocked_no_completed_visit` | supervisor | final appointment / completion invariant risk |
| `repeated_reschedules` | dispatch / supervisor | repeated pattern or high customer impact |
| `multiple_incomplete_visits` | supervisor / quality | repeated service failure / rework risk |

These mappings are proposals only. PM / operations must approve actual queue ownership before implementation.

## Alignment with Task173-Task185

Task187 aligns with prior planning:

- Task173: escalation remains human-reviewed and scoped.
- Task174: data model proposal remains non-migrated.
- Task175: thresholds remain draft and not production commitments.
- Task176: business-hours policy remains planning only.
- Task177: suppression / dedupe remain future runtime design, not executable policy.
- Task178: dashboard role queues remain wireframe-level.
- Task179: human action workflow remains review-first.
- Task180: action audit and evidence policy remains separated from raw payload exposure.
- Task181: organization scope and permission separation are preserved.
- Task182: Admin dashboard requirements remain no-code.
- Task183: dashboard copy / empty states remain no-code.
- Task184: API contract remains conceptual.
- Task185: runtime readiness gate remains blocking.
- Task186: first-release risk scope remains proposal-only.

## Implementation Blockers and Required Approvals

Before any RBAC runtime work, the following must be approved:

- production role names,
- organization / branch / team scope model,
- queue ownership per risk category,
- severity-to-authority rules,
- evidence visibility rules,
- audit visibility rules,
- suppression authority rules,
- export policy,
- stale-state behavior,
- safe error copy,
- AI advisory visibility policy,
- API allow-lists,
- Admin UI visibility rules,
- feature flag / kill switch behavior,
- no-send behavior,
- test plan.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Safe Error and Permission Failure Copy Draft.
2. SLA / Operations Risk Evidence Visibility Redaction Matrix.
3. SLA / Operations Risk Queue Ownership Approval Packet.
4. SLA / Operations Risk API Permission Check Design.
5. SLA / Operations Risk Admin Role Visibility Wireframe Review.
6. SLA / Operations Risk No-Send / No-Provider Test Plan.
7. SLA / Operations Risk Runtime RBAC Readiness Gate.

## Verification Checklist

Before using Task187 as input to a future implementation task, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task187 is still treated as proposal-only,
- production RBAC has not been inferred from this draft,
- organization scope is explicit,
- evidence visibility is separate from queue visibility,
- audit visibility is separate from action authority,
- AI remains advisory only,
- no permission grants provider delivery,
- no permission grants official lifecycle mutation,
- no permission grants manual `finalAppointmentId` override,
- no permission exposes raw channel identifiers,
- no permission exposes credentials or secrets,
- no migration / schema / runtime approval is implied.

## Task187 Completion Note

Task187 is complete as a documentation-only RBAC matrix draft.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.
