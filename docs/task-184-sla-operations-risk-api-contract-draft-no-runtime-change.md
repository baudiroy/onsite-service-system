# Task 184 - SLA / Operations Risk API Contract Draft / No Runtime Change

## Purpose and Non-Goals

Task184 defines a proposal-only API contract draft for future SLA / operations risk review workflows.

This document builds on:

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

Task184 is not a backend implementation task. It does not create routes, controllers, services, repositories, OpenAPI files, generated clients, executable validators, database schema, migrations, Admin UI, runtime jobs, notification delivery, provider sending, survey runtime, or production RBAC.

Task184 does not:

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

Task184 assumes:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / visits,
- one Case should have at most one open appointment at the same time,
- appointment / visit history belongs to dispatch and service execution,
- `finalAppointmentId` is backend / system determined and stable after completion,
- completed report repeat completion is rejected before side effects,
- Admin has no manual final appointment picker,
- SLA / operations risk API resources are future review resources and do not replace official Case / Appointment / Report APIs,
- future risk APIs must remain organization scoped,
- channel delivery is not approved,
- AI is advisory only.

This draft intentionally separates future API shape from current implemented backend behavior.

## API Contract Draft Principles

Future SLA / operations risk APIs should follow these principles:

1. Organization scope is required for every list, detail, action, audit, and evidence operation.
2. Queue row payloads should be safe summaries.
3. Detail payloads should remain allow-listed and should not embed full Case / customer / appointment / report objects.
4. Human action endpoints should be explicit, audited, permission-checked, and reason-aware.
5. Evidence endpoints should return references and safe metadata, not raw evidence payloads.
6. AI fields should be advisory and clearly non-authoritative.
7. Channel availability fields should not imply provider delivery.
8. Error payloads should be safe and user-actionable.
9. Future implementation should define idempotency and stale-state protections before production.
10. API contracts should not weaken core Case / Appointment / Report invariants.

## Endpoint Group Overview

Proposal-only endpoint groups:

| Endpoint group | Purpose | Boundary |
| --- | --- | --- |
| Queue list | list visible risk items | safe summaries only |
| Risk detail | show scoped risk context | no full object payloads |
| Summary / counts | role and severity counts | no hidden data leakage |
| Human actions | acknowledge, assign, suppress, escalate, resolve | audited and permission checked |
| Audit trail | show action history | scoped and redacted |
| Evidence references | list safe evidence references | no raw payloads |
| AI advisory hints | show optional suggestions | no authoritative actions |

Endpoint paths below are proposal-only names. Task184 does not create actual API routes.

## Queue List Endpoint Draft

Proposal-only endpoint:

```text
GET /admin/operations-risks
```

Conceptual query parameters:

- `queue`
- `role`
- `assignedTo`
- `severity`
- `riskType`
- `riskState`
- `dueWindow`
- `overdue`
- `suppressed`
- `escalated`
- `caseId`
- `appointmentId`
- `page`
- `pageSize`
- `sort`

Conceptual response shape:

```json
{
  "items": [
    {
      "riskId": "<risk-id>",
      "organizationId": "<organization-id>",
      "caseId": "<case-id>",
      "caseNumberSummary": "<case-number>",
      "riskType": "pending_parts_overdue",
      "severity": "P1",
      "riskState": "queued",
      "queueOwnerRole": "dispatch",
      "assignedOwnerSummary": "<owner-summary>",
      "dueAt": "<timestamp>",
      "clockBasis": "business_hours",
      "overdueSummary": "<safe-overdue-summary>",
      "suppressionState": "not_suppressed",
      "escalationLevel": "role_lead",
      "latestActionSummary": "<safe-action-summary>",
      "aiAdvisoryAvailable": false
    }
  ],
  "page": {
    "page": 1,
    "pageSize": 25,
    "hasMore": false
  }
}
```

Queue list responses should not include customer contact values, raw channel identifiers, provider payloads, full customer objects, full appointment objects, full report objects, credentials, or secrets.

## Risk Detail Endpoint Draft

Proposal-only endpoint:

```text
GET /admin/operations-risks/{riskId}
```

Conceptual response shape:

```json
{
  "riskId": "<risk-id>",
  "organizationId": "<organization-id>",
  "riskSummary": {
    "riskType": "pending_quote_overdue",
    "severity": "P1",
    "riskState": "assigned",
    "reasonCode": "quote_pending_customer"
  },
  "caseContext": {
    "caseId": "<case-id>",
    "caseNumberSummary": "<case-number>",
    "caseStatusSummary": "<case-status>"
  },
  "appointmentContext": {
    "appointmentId": "<appointment-id>",
    "visitSequence": 2,
    "visitResult": "pending_quote"
  },
  "reportContext": {
    "serviceReportId": "<service-report-id>",
    "reportStatusSummary": "<report-status>",
    "finalAppointmentId": "<final-appointment-id-or-null>"
  },
  "clock": {
    "clockBasis": "business_hours",
    "dueAt": "<timestamp>",
    "clockState": "overdue",
    "summary": "<safe-clock-summary>"
  },
  "permissions": {
    "canAcknowledge": true,
    "canAssign": true,
    "canSuppress": false,
    "canResolve": false,
    "canViewEvidence": false
  }
}
```

Detail payloads should reference Case / appointment / report identity safely without embedding full domain payloads.

## Summary / Count Endpoint Draft

Proposal-only endpoint:

```text
GET /admin/operations-risks/summary
```

Conceptual response shape:

```json
{
  "visibleScope": {
    "organizationId": "<organization-id>",
    "roleScope": "<role-scope>"
  },
  "counts": {
    "active": 12,
    "nearDue": 4,
    "overdue": 3,
    "suppressedForReview": 1,
    "escalated": 2
  },
  "severityCounts": {
    "P0": 0,
    "P1": 2,
    "P2": 8,
    "P3": 2,
    "Info": 0
  }
}
```

Counts must reflect only the caller's authorized scope. Summary APIs should not leak hidden organization, branch, queue, or evidence counts.

## Filter / Sort / Search Parameter Draft

Future filter parameters should be allow-listed:

| Parameter | Purpose | Notes |
| --- | --- | --- |
| `queue` | role queue or dashboard queue | proposal-only values |
| `severity` | P0 / P1 / P2 / P3 / Info | aligns with Task175 |
| `riskType` | risk category | aligns with Task174 / Task175 |
| `riskState` | queued / assigned / suppressed / resolved | proposal-only |
| `dueWindow` | near due / overdue | aligns with Task176 |
| `suppressed` | include or isolate suppressed items | aligns with Task177 |
| `assignedTo` | owner summary id | permission checked |
| `caseId` | specific Case context | organization scoped |
| `appointmentId` | visit context | same-case guard required |
| `sort` | due time / severity / last action | deterministic ordering needed |

Search should target safe identifiers or summaries. It should not accept customer contact values, raw provider payloads, raw channel identifiers, or secret-like values as search keys.

## Human Action Endpoint Drafts

Proposal-only action endpoint pattern:

```text
POST /admin/operations-risks/{riskId}/actions/{actionType}
```

Candidate `actionType` values:

- `acknowledge`
- `triage`
- `assign`
- `reassign`
- `suppress`
- `unsuppress`
- `escalate`
- `deescalate`
- `resolve`
- `reopen`
- `mark_non_actionable`
- `comment`
- `link_evidence`

Conceptual request shape:

```json
{
  "reasonCode": "<safe-reason-code>",
  "note": "<safe-note>",
  "targetOwnerId": "<owner-id-if-needed>",
  "reviewAt": "<timestamp-if-needed>",
  "expectedVersion": "<risk-version-or-updated-at>"
}
```

Conceptual response shape:

```json
{
  "riskId": "<risk-id>",
  "actionId": "<action-id>",
  "riskState": "<next-risk-state>",
  "latestActionSummary": "<safe-action-summary>",
  "auditCreated": true
}
```

Action endpoints must not:

- mutate formal Case lifecycle by default,
- complete Field Service Reports,
- create appointments,
- override `finalAppointmentId`,
- approve billing / settlement,
- send provider messages,
- execute AI decisions.

## Audit Trail Endpoint Draft

Proposal-only endpoint:

```text
GET /admin/operations-risks/{riskId}/audit
```

Conceptual response shape:

```json
{
  "items": [
    {
      "auditId": "<audit-id>",
      "actionCategory": "risk_acknowledged",
      "actorSummary": "<actor-summary>",
      "actorRoleSummary": "<role-summary>",
      "priorState": "queued",
      "nextState": "acknowledged",
      "reasonCode": "<safe-reason-code>",
      "safeNote": "<safe-note>",
      "createdAt": "<timestamp>"
    }
  ]
}
```

Audit responses should be scoped by organization, risk visibility, and audit sensitivity. They should not include raw provider payloads, raw channel ids, customer contact values, credentials, full object snapshots, or hidden evidence data.

## Evidence Reference Endpoint Draft

Proposal-only endpoint:

```text
GET /admin/operations-risks/{riskId}/evidence
```

Conceptual response shape:

```json
{
  "items": [
    {
      "evidenceId": "<evidence-id>",
      "evidenceType": "appointment_reference",
      "label": "<safe-label>",
      "relatedCaseId": "<case-id>",
      "relatedAppointmentId": "<appointment-id>",
      "visibility": "restricted",
      "createdAt": "<timestamp>"
    }
  ],
  "redactions": [
    {
      "field": "customer_contact",
      "reason": "hidden_by_permission"
    }
  ]
}
```

Evidence endpoints should return references, not copied raw evidence content. Access to an evidence reference does not automatically mean access to the underlying attachment or source system.

## AI Advisory Hint Field Boundaries

AI advisory fields may appear in queue or detail payloads only as safe suggestions.

Conceptual shape:

```json
{
  "aiAdvisory": {
    "available": true,
    "summary": "<safe-suggestion-summary>",
    "suggestedReason": "<safe-reason-code>",
    "suggestedOwnerRole": "dispatch",
    "confidenceLabel": "medium",
    "requiresHumanConfirmation": true
  }
}
```

AI advisory fields must not include:

- executable action flags,
- automatic suppression decisions,
- automatic escalation decisions,
- customer contact choice,
- billing / settlement decisions,
- Case completion decisions,
- report completion decisions,
- `finalAppointmentId` selection or override.

## Permission / Organization Scope Contract Notes

Every future endpoint should enforce:

- organization scope,
- user permission,
- queue visibility,
- evidence visibility,
- action authority,
- audit sensitivity,
- same-case relationships for Case / appointment / report references.

The API should be able to express:

- visible but action-disabled states,
- visible but evidence-redacted states,
- stale item state requiring refresh,
- permission-denied actions without exposing hidden data.

Raw channel identifiers should never become authorization keys.

## Sensitive Data Exclusion Policy

Conceptual payloads must exclude:

- customer contact values,
- raw LINE user id,
- provider secrets,
- provider raw payloads,
- tokens,
- passwords,
- API keys,
- database connection strings,
- full customer payloads,
- full appointment payloads,
- full report payloads,
- full webhook payloads,
- full AI prompt or model payloads.

If examples need values, use placeholders such as `<case-id>`, `<risk-id>`, `<safe-note>`, `<safe-reason-code>`, and `<hidden-by-permission>`.

## Error / Empty / Loading-State Contract Notes

Error payloads should support safe UI copy from Task183.

Conceptual error shape:

```json
{
  "error": {
    "code": "RISK_ACTION_NOT_ALLOWED",
    "message": "This action is not available for your current permission.",
    "safeUserMessage": "This action is not available for your current permission.",
    "retryable": false
  }
}
```

Future error codes may include:

- `RISK_NOT_FOUND`
- `RISK_NOT_VISIBLE`
- `RISK_ACTION_NOT_ALLOWED`
- `RISK_STATE_CHANGED`
- `RISK_REASON_REQUIRED`
- `RISK_SUPPRESSION_REVIEW_REQUIRED`
- `EVIDENCE_NOT_VISIBLE`
- `QUEUE_FILTER_INVALID`

Error messages must not include raw SQL, stack traces, raw request payloads, provider responses, secrets, customer contact values, or raw channel ids.

## Idempotency and Concurrency Guardrail Notes

Future action endpoints should define stale-state and duplicate-submission behavior before runtime implementation.

Recommended concepts:

- use `expectedVersion` or equivalent stale-state guard for actions,
- make repeated button submissions safe,
- preserve action audit exactly once when possible,
- require idempotency key for high-risk actions if needed,
- reject actions on resolved / closed / stale risk items when appropriate,
- prevent suppression from overwriting a newer escalation without review.

These are design notes only. Task184 does not create concurrency guards, indexes, locks, transactions, or runtime code.

## Channel-Agnostic Notification Readiness Notes

Future APIs may expose channel availability summaries, but should not send messages from risk review contracts by default.

Safe conceptual fields:

- `channelAvailabilitySummary`
- `manualFollowUpRequired`
- `deliveryStatusSummary`
- `notificationActionAvailable`

These fields should not contain raw LINE user id, APP device token, provider payload, provider credentials, or delivery secrets.

Provider sending should require a separate approved notification API contract and runtime implementation.

## Data Model Alignment with Task174

Task174 proposed future `sla_policies`, `case_risk_flags`, and `operations_tasks` concepts. Task184 maps them to API needs only.

| Task174 concept | API draft use | Boundary |
| --- | --- | --- |
| `sla_policies` | expose safe policy summary / clock basis | no executable policy created |
| `case_risk_flags` | queue and detail risk row source | no table/query created |
| `operations_tasks` | owner/action tracking concept | no task runtime created |
| risk metadata | safe display payload | no raw payload |
| audit fields | audit endpoint concept | no audit implementation |

Task184 does not create migration-ready field names, DDL, indexes, or constraints.

## Policy Alignment with Task175 / Task176 / Task177

Future API contracts should align with:

- Task175 severity and threshold interpretation,
- Task176 clock source, timezone, business-hours, pause, resume, and stop semantics,
- Task177 dedupe, grouping, suppression, cooldown, re-alert, and reopen semantics.

APIs should expose those concepts as safe summaries and allow-listed fields, not as arbitrary config blobs.

## Dashboard / Workflow Alignment with Task178 / Task179 / Task180 / Task181 / Task182 / Task183

Future API contracts should support:

- Task178 role queues and ownership,
- Task179 human actions,
- Task180 audit and evidence references,
- Task181 permission and organization scope,
- Task182 dashboard wireframe requirements,
- Task183 safe copy, empty states, and error states.

The API should not force the Admin UI to infer sensitive hidden state from missing fields. Redaction and permission state should be explicit and safe.

## Future Backend / Admin / DB / Migration Guardrails

Future implementation tasks should decide:

- route naming and versioning,
- controller/service/repository ownership,
- permission middleware,
- pagination and sorting limits,
- field allow-lists,
- stale-state and idempotency behavior,
- audit write model,
- evidence reference storage,
- whether risk rows are computed, persisted, or hybrid,
- whether a migration is required,
- no-provider-sending test coverage,
- AI advisory field review and redaction.

No implementation should start from Task184 alone. A later readiness task should approve runtime scope, DB scope, API scope, Admin scope, and test coverage.

## Future Task Candidates

Recommended next safe tasks:

1. Task185 - SLA / Operations Risk Runtime Readiness Gate / No Migration or Runtime Change.
2. Task186 - SLA / Operations Risk No-Send Test Plan / No Runtime Change.
3. Task187 - SLA / Operations Risk Implementation Pause Summary / No Runtime Change.
4. Task188 - SLA / Operations Risk Admin Implementation Readiness Review / No Admin Code Change.
5. Task189 - SLA / Operations Risk Backend Runtime Contract Review / No Runtime Change.

These suggestions do not approve backend runtime, Admin source changes, API implementation, DB work, migration, provider delivery, survey runtime, or AI automatic decisions.

## Verification Checklist

Task184 should be considered valid only if:

- it remains documentation-only,
- it does not modify backend `src/`,
- it does not modify Admin frontend `admin/src/`,
- it does not modify APIs,
- it does not create routes, controllers, services, or repositories,
- it does not create OpenAPI or generated client files,
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
- sensitive scan shows no actual secrets, raw identifiers, raw payloads, provider values, or customer data.
