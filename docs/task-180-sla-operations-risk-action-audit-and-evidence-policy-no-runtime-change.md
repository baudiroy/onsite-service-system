# Task 180 - SLA / Operations Risk Action Audit and Evidence Policy / No Runtime Change

## Purpose and Non-Goals

Task180 defines a proposal-only audit and evidence policy for future SLA / operations risk human actions.

This document builds on:

- `docs/task-173-sla-operations-risk-escalation-design-no-runtime-change.md`
- `docs/task-174-sla-operations-risk-data-model-proposal-no-migration.md`
- `docs/task-175-sla-operations-risk-policy-and-threshold-matrix-no-runtime-change.md`
- `docs/task-176-sla-operations-risk-clock-source-and-business-hours-policy-no-runtime-change.md`
- `docs/task-177-sla-operations-risk-dedupe-and-suppression-policy-no-runtime-change.md`
- `docs/task-178-sla-operations-risk-dashboard-role-queue-design-no-runtime-change.md`
- `docs/task-179-sla-operations-risk-human-action-workflow-design-no-runtime-change.md`

Task180 defines what future risk actions should record, how evidence should be referenced, and what must not be stored in audit notes or evidence fields.

Task180 does not:

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

Task180 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to dispatch and service execution,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / operations risk audit is separate from official Case / Appointment / Report lifecycle,
- future dashboard queues remain organization scoped,
- channel delivery is not approved,
- AI is advisory only.

Audit policy should support reviewability without expanding data exposure.

## Audit and Evidence Principles

Future SLA / operations risk audit should follow these principles:

1. Record who acted, what changed, when it happened, and why it was allowed.
2. Preserve prior state and next state for reviewable actions.
3. Store references to evidence rather than copying sensitive payloads.
4. Keep audit fields safe and allow-listed.
5. Separate human-authored notes from AI-suggested summaries.
6. Keep AI suggestions non-authoritative until human-confirmed.
7. Support dedupe, suppression, escalation, and resolution review.
8. Avoid raw channel identifiers, customer contact values, provider secrets, and full object payloads.
9. Do not let audit records mutate formal domain lifecycle by themselves.
10. Do not treat audit retention or storage policy as finalized in Task180.

## Audit Event Categories

Proposal-only audit event categories:

| Category | Meaning |
| --- | --- |
| `risk_detected` | A candidate risk was found or persisted |
| `risk_queued` | A risk became visible in a role queue |
| `risk_grouped` | A duplicate or related signal was grouped |
| `risk_acknowledged` | A human acknowledged the risk |
| `risk_triaged` | A human classified the next action |
| `risk_assigned` | Ownership was assigned |
| `risk_reassigned` | Ownership was transferred |
| `risk_suppressed` | Risk was quieted with reason |
| `risk_unsuppressed` | Suppressed risk returned to active review |
| `risk_escalated` | Priority / visibility increased |
| `risk_deescalated` | Priority / visibility decreased after review |
| `risk_resolved` | Human or deterministic rule marked it handled |
| `risk_reopened` | Risk became active again due to new evidence |
| `risk_commented` | Safe note was added |
| `risk_evidence_linked` | Evidence reference was attached |
| `risk_marked_non_actionable` | Human marked the item non-actionable |

These are names for design discussion only. Task180 does not create an enum, table, API, or event stream.

## Conceptual Minimum Audit Fields

Future audit records should conceptually support:

- organization scope,
- risk reference,
- Case reference,
- appointment reference if applicable,
- Field Service Report reference if applicable,
- actor id or safe actor summary,
- actor role summary,
- action category,
- prior risk state,
- next risk state,
- reason code,
- safe note,
- policy key / policy version if applicable,
- evidence reference ids if applicable,
- created timestamp,
- source type: human, deterministic policy, system job, or AI suggestion draft.

This is not migration-ready schema. Field names are proposal-only.

## Evidence Reference Policy

Evidence should usually be referenced, not copied.

Good evidence references may include:

- Case id / case number summary,
- appointment id / visit sequence summary,
- service report id,
- safe attachment id,
- quote id if future quote runtime exists,
- parts reservation id if future parts runtime exists,
- future survey response id if approved,
- future customer approval record id if approved,
- future internal audit entry id.

Evidence references should not store:

- customer contact values,
- raw LINE user id,
- raw provider payload,
- full customer payload,
- full appointment payload,
- full report payload,
- secrets,
- tokens,
- database connection strings.

## Operator Comment Policy

Operator comments should be short, factual, and safe.

Recommended comment style:

- describe action taken,
- describe next owner or next review point,
- use reason codes when available,
- avoid unnecessary customer details,
- avoid copying provider messages,
- avoid copying full payloads,
- avoid credentials or internal secrets.

Examples of safe comment direction:

- "Customer service confirmed callback needed; supervisor review requested."
- "Pending parts follow-up acknowledged; review due after ETA update."
- "Risk grouped with existing scheduling follow-up item."

Do not include sensitive values in comments.

## Attachment / External Evidence Boundary

Future evidence attachments may be useful, but Task180 does not create attachment runtime.

Future policy should define:

- allowed attachment types,
- maximum size,
- retention policy,
- access control,
- virus / malware scanning if needed,
- redaction requirements,
- whether customer-visible and internal-only attachments are separated,
- whether evidence can be reused across Case / Appointment / Report.

Audit records should link to approved evidence objects rather than embedding binary data or raw payloads.

## Sensitive Data Redaction Policy

Future audit and evidence display should use an allow-list approach:

- store stable internal ids,
- store safe reason codes,
- store safe state transitions,
- store safe actor summaries,
- store safe evidence references,
- store safe notes after human review.

Do not store or display raw sensitive values unless a future approved policy explicitly allows a limited, protected field.

Redaction should be conservative. If a field may contain sensitive text, it should be excluded or summarized.

AI may suggest redaction but cannot approve redaction automatically.

## Prohibited Audit Content

Future audit notes, evidence summaries, queue rows, and risk metadata must not include:

- database connection strings,
- passwords,
- password hashes,
- tokens,
- provider secrets,
- API keys,
- raw LINE user id,
- customer contact values,
- LINE channel secret,
- LINE channel access token,
- raw webhook payloads,
- full request payloads,
- full response payloads,
- full customer object,
- full appointment object,
- full service report object,
- production data dumps.

These prohibitions apply to human notes, AI suggestions, automated audit payloads, exports, and handoff summaries.

## Action-Specific Audit Expectations

| Action | Minimum audit expectation | Evidence expectation |
| --- | --- | --- |
| acknowledge | actor, timestamp, prior / next state | optional safe note |
| triage | actor, reason, next action classification | safe context reference |
| assign | prior owner, next owner, reason | role / owner reference |
| reassign | prior owner, next owner, reason | role / owner reference |
| suppress | reason, suppressed until / review point, actor | supervisor approval reference if needed |
| unsuppress | reason, actor, source condition | review point or new evidence reference |
| escalate | prior severity, next severity, reason | threshold or human review reference |
| de-escalate | prior severity, next severity, reason | human review reference |
| resolve | resolution reason, actor, resolved at | safe evidence reference |
| reopen | reopen reason, new evidence summary | linked prior resolution / suppression |
| comment | author, timestamp, note | optional evidence ref |
| mark non-actionable | reason, actor | policy / false-positive reference |

## Queue and Dashboard Audit Expectations

Future dashboard queues should be able to show action history safely:

- latest action summary,
- latest owner change,
- latest suppression status,
- escalation history summary,
- resolution summary,
- review due time.

Dashboard surfaces should avoid showing full audit payloads by default. Detailed audit views should still follow redaction and permission rules.

## Dedupe / Suppression Audit Expectations

Task177 requires dedupe and suppression to preserve history.

Future audit should record:

- dedupe / grouping decision,
- grouped source count summary,
- active representative risk reference,
- suppression reason,
- suppression actor,
- suppression review time,
- unsuppression reason,
- re-alert reason.

Dedupe audit should not copy all source payloads into one record.

## Clock / Business-Hours Audit Expectations

Task176 defines future clock source and business-hours semantics.

Future audit should record clock-related decisions when relevant:

- clock type,
- policy key / policy version,
- due time,
- breached time,
- paused state,
- pause reason,
- resumed time,
- stopped time,
- timezone / calendar policy summary.

Audit should not trust browser time, AI-generated time, or provider time unless normalized by future approved runtime.

## Escalation and Resolution Evidence Expectations

Escalation evidence may include:

- threshold breach reference,
- repeated re-alert reference,
- complaint risk reference,
- supervisor review reason,
- stale clock reference.

Resolution evidence may include:

- appointment scheduled,
- customer contacted summary,
- next visit arranged,
- report completed,
- quote decision recorded,
- parts ETA recorded,
- callback completed,
- finance proof reference.

Resolution evidence should prove that the risk condition ended or that a human accepted the outcome. It must not imply Case completion unless formal Case / Field Service Report state also indicates completion.

## Reviewability and Traceability Requirements

Future audit should answer:

- what risk was active,
- why it was shown,
- who reviewed it,
- what action was taken,
- what evidence supported the action,
- whether any suppression or escalation occurred,
- whether AI suggested anything,
- whether a human confirmed the final action,
- whether the item was later reopened.

Traceability should connect risk workflow back to Case-level service context while preserving the invariant that one Case has one formal Field Service Report.

## AI Advisory Boundaries

AI may help future audit and evidence workflows by:

- summarizing safe context,
- suggesting reason codes,
- suggesting missing evidence,
- drafting safe comments,
- detecting possible duplicate risks,
- explaining why a risk may be overdue.

AI must not:

- create authoritative audit facts,
- approve evidence,
- redact automatically without human review,
- acknowledge,
- suppress,
- unsuppress,
- escalate,
- de-escalate,
- resolve,
- reopen,
- notify,
- decide retention,
- mutate Case / Appointment / Report state,
- choose or override `finalAppointmentId`.

AI suggestions should be labeled and separately traceable if stored later.

## Channel-Agnostic Notification Readiness Notes

Audit and evidence policy should remain channel-agnostic.

Principles:

- audit records should not assume LINE delivery,
- notification sending is a separate future runtime,
- provider delivery should have its own event / audit trail if approved later,
- raw channel identifiers should not be stored in risk audit notes,
- manual follow-up and provider-based follow-up should be distinguishable,
- no provider sending is approved by Task180.

## Data Model Alignment with Task174

Task174 proposed future concepts like `case_risk_flags`, `operations_tasks`, and safe metadata.

Task180 maps audit needs to possible future model concepts without creating schema:

| Future audit need | Possible relation | Notes |
| --- | --- | --- |
| action history | future risk action log or audit table | Not created |
| evidence references | safe attachment / object references | Not raw payloads |
| suppression history | future risk suppression fields / log | Requires review policy |
| owner changes | future operations task history | Permission design needed |
| policy version | future SLA policy reference | Not executable config |
| AI suggestion trace | future AI feedback / suggestion log | Advisory only |

## Policy Alignment with Task175 / Task176 / Task177 / Task178 / Task179

Task180 aligns with:

- Task175 severity and threshold policy,
- Task176 clock / business-hours / timezone policy,
- Task177 dedupe / suppression / cooldown policy,
- Task178 dashboard role queue design,
- Task179 human action workflow.

Audit should make those policies reviewable. It should not override them or become an invisible workflow engine.

## Future Runtime / Admin / API / Storage Guardrails

Before implementation, a future task must define:

- audit storage model,
- retention and deletion policy,
- access control,
- API contract,
- Admin UI display rules,
- export policy,
- redaction allow-list,
- attachment policy,
- no-provider-send tests,
- AI suggestion labeling,
- migration review.

Task180 is not implementation approval.

## Future Task Candidates

Recommended future safe tasks:

1. Task181 - SLA / Operations Risk Permission and Organization Scope Review / No Runtime Change.
2. Task182 - SLA / Operations Risk Admin Dashboard Wireframe Requirements / No Admin Code Change.
3. Task183 - SLA / Operations Risk API Contract Draft / No Runtime Change.
4. Task184 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change.
5. Task185 - SLA / Operations Risk Documentation Consolidation and Pause Summary / No Runtime Change.

These suggestions do not approve runtime, API, Admin source, DB, migration, provider delivery, survey runtime, or AI automatic decision work.

## Verification Checklist

Task180 should be considered valid only if:

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
