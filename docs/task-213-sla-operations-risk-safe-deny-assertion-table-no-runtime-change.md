# Task 213 - SLA / Operations Risk Safe-Deny Assertion Table / No Runtime Change

## Purpose and Non-Goals

Task213 defines a documentation-only safe-deny assertion table for future SLA / operations risk resource enumeration tests.

The table describes how future permission, organization scope, tenant scope, entitlement, feature gate, visibility, audit/evidence, channel identity, LINE binding, provider readiness, and no-send failures should collapse to safe non-leaking responses when resource existence is not authorized. It does not create executable tests, fixtures, API behavior, Admin UI, localization files, runtime behavior, or DB usage.

Task213 does not:

- create or modify test files,
- create or modify fixture files,
- create or modify smoke tests or automated tests,
- create or modify QA scripts,
- create or modify localization files,
- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify permission runtime,
- modify entitlement runtime,
- modify routes, controllers, services, repositories, validators, mappers, or middleware,
- modify logging or redaction utilities,
- modify OpenAPI / Swagger / generated client files,
- modify executable schemas or config,
- modify `package.json`,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- run cleanup commands,
- touch shared Zeabur runtime,
- create usage metering runtime,
- create SaaS billing, subscription, payment, plan, or pricing runtime,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable AI automatic decisions,
- modify inventory docs,
- output sensitive values.

## Source-of-Truth Guardrails

Task213 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data remains organization / tenant scoped,
- permission and entitlement remain separate concepts,
- entitlement does not bypass RBAC,
- customer-visible data and internal-only data remain separated,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

## Current Architecture Assumptions

Task213 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no localization implementation exists for this branch,
- no resource enumeration tests exist for this future branch,
- no test fixtures are approved,
- no entitlement runtime exists,
- no permission runtime changes are approved,
- no usage metering runtime exists,
- no SaaS billing / subscription / payment runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

## Safe-Deny Assertion Principles

Future safe-deny assertions should:

1. prevent unauthorized users from learning whether a protected resource exists,
2. collapse hidden, out-of-scope, and nonexistent resources when visibility is unsafe,
3. allow explicit denial only when resource existence is already authorized,
4. keep Admin empty states aligned with API safe-deny behavior,
5. avoid hidden counts, identifiers, and ownership hints,
6. avoid raw customer, channel, provider, diagnostic, and billing data,
7. avoid production translation strings,
8. preserve permission and entitlement separation,
9. preserve channel-agnostic and LINE-safe behavior,
10. keep AI advisory-only.

## Safe-Deny Table Field Definitions

| Field | Meaning |
| --- | --- |
| Assertion name | Proposal-only safe-deny assertion name aligned with Task211 |
| Scenario group | Task207 group |
| Actor / permission state | Placeholder permission condition |
| Scope state | Organization / tenant / branch / team placeholder |
| Entitlement state | Feature enabled, disabled, missing, or future-only |
| Resource visibility | Visible, hidden, nonexistent, or uncertain |
| Required safe-deny category | Expected safe response family |
| Allowed response fields | Safe fields allowed in future response |
| Forbidden response fields | Fields that would leak resource existence or internals |
| Admin category | Safe Admin empty/disabled state |
| Forbidden UI differences | UI differences that would leak |
| Diagnostic rule | Required redaction behavior |
| Pass/fail criteria | Future assertion interpretation |

## Safe-Deny Category Overview

| Category | Purpose |
| --- | --- |
| `generic_unavailable` | default for hidden, nonexistent, or out-of-scope resources when visibility is unsafe |
| `permission_denied_safe` | explicit permission failure only when resource visibility is safe |
| `feature_unavailable_safe` | feature gate / entitlement failure without hidden resource or plan details |
| `scope_missing_equivalent` | scope mismatch equivalent to nonexistent |
| `hidden_missing_equivalent` | hidden resource equivalent to nonexistent |
| `audit_evidence_unavailable_safe` | audit/evidence denied without counts or references |
| `channel_unavailable_safe` | channel state unavailable without raw identity or binding leak |
| `provider_unavailable_safe` | provider unavailable without provider diagnostics |
| `ai_unavailable_safe` | AI unavailable as advisory/manual fallback |

## Permission Safe-Deny Assertions

| Assertion name | Permission state | Resource visibility | Required safe-deny category | Admin category | Forbidden differences |
| --- | --- | --- | --- | --- | --- |
| `assert.safe_deny.perm.hidden.generic_unavailable` | action missing | hidden or uncertain | `generic_unavailable` | generic unavailable | action-specific hidden hint |
| `assert.permission.perm.visible.permission_denied_safe` | action missing | visible | `permission_denied_safe` | action disabled | role hierarchy detail |
| `assert.safe_deny.perm.evidence_hidden.generic_unavailable` | evidence permission missing | hidden evidence | `generic_unavailable` | evidence unavailable | evidence count/reference |
| `assert.permission.perm.audit_visible.permission_denied_safe` | audit permission missing | visible item | `permission_denied_safe` | audit disabled | hidden audit count |

Explicit permission denial is acceptable only when the user is already authorized to know the item exists.

## Organization / Tenant / Branch Scope Safe-Deny Assertions

| Assertion name | Scope state | Resource visibility | Required safe-deny category | Admin category | Forbidden differences |
| --- | --- | --- | --- | --- | --- |
| `assert.safe_deny.scope.organization.scope_missing_equivalent` | organization mismatch | existing out-of-scope | `scope_missing_equivalent` | generic unavailable | organization label |
| `assert.safe_deny.scope.tenant.scope_missing_equivalent` | tenant mismatch | existing out-of-scope | `scope_missing_equivalent` | generic unavailable | tenant label |
| `assert.safe_deny.scope.branch.scope_missing_equivalent` | branch mismatch | unsafe visibility | `scope_missing_equivalent` | generic unavailable | branch assignment |
| `assert.safe_deny.scope.team.scope_missing_equivalent` | team mismatch | unsafe visibility | `scope_missing_equivalent` | generic unavailable | team assignment |
| `assert.safe_deny.scope.queue.generic_unavailable` | wrong queue scope | hidden queue | `generic_unavailable` | queue unavailable | hidden queue count |

Scope mismatch responses must not say that an item belongs to another organization, tenant, branch, or team.

## Entitlement / Feature Gate Safe-Deny Assertions

| Assertion name | Entitlement state | Resource visibility | Required safe-deny category | Admin category | Forbidden differences |
| --- | --- | --- | --- | --- | --- |
| `assert.entitlement.ent.missing.feature_unavailable_safe` | entitlement missing | surface visible | `feature_unavailable_safe` | feature unavailable | plan internals |
| `assert.safe_deny.ent.hidden.generic_unavailable` | entitlement missing | hidden resource | `generic_unavailable` | generic unavailable | hidden feature/resource hint |
| `assert.entitlement.ent.disabled.feature_unavailable_safe` | disabled until approval | surface visible | `feature_unavailable_safe` | disabled until approval | approval internals |
| `assert.entitlement.ent.future_only.feature_unavailable_safe` | first-release excluded | surface visible | `feature_unavailable_safe` | future-only unavailable | implementation promise |

Entitlement assertions must not imply that entitlement bypasses RBAC.

## Resource Visibility Safe-Deny Assertions

| Assertion name | Resource visibility | Required safe-deny category | Allowed response fields | Forbidden response fields |
| --- | --- | --- | --- | --- |
| `assert.safe_deny.hidden.resource.hidden_missing_equivalent` | hidden existing resource | `hidden_missing_equivalent` | safe category, safe message family | resource id, existence hint |
| `assert.safe_deny.hidden.case.hidden_missing_equivalent` | hidden Case context | `hidden_missing_equivalent` | generic context unavailable | Case status, Case number |
| `assert.safe_deny.hidden.appointment.hidden_missing_equivalent` | hidden appointment context | `hidden_missing_equivalent` | generic context unavailable | visit count, appointment state |
| `assert.safe_deny.hidden.report.hidden_missing_equivalent` | hidden report context | `hidden_missing_equivalent` | generic context unavailable | report status, final marker |
| `assert.safe_deny.hidden.queue.generic_unavailable` | hidden queue item | `generic_unavailable` | safe empty/unavailable category | hidden queue count |

## Audit / Evidence Safe-Deny Assertions

| Assertion name | Scenario | Required safe-deny category | Admin category | Forbidden differences |
| --- | --- | --- | --- | --- |
| `assert.safe_deny.audit.hidden.audit_evidence_unavailable_safe` | hidden audit trail | `audit_evidence_unavailable_safe` | audit unavailable | audit action count |
| `assert.safe_deny.evidence.hidden.audit_evidence_unavailable_safe` | hidden evidence | `audit_evidence_unavailable_safe` | evidence unavailable | evidence count/reference |
| `assert.permission.audit.visible.permission_denied_safe` | visible item, audit permission missing | `permission_denied_safe` | audit disabled | hidden audit metadata |
| `assert.permission.evidence.visible.permission_denied_safe` | visible item, evidence permission missing | `permission_denied_safe` | evidence disabled | hidden evidence metadata |

## Channel Identity / LINE Binding Safe-Deny Assertions

| Assertion name | Scenario | Required safe-deny category | Admin category | Forbidden differences |
| --- | --- | --- | --- | --- |
| `assert.channel.channel.ambiguous.channel_unavailable_safe` | channel identity ambiguous | `channel_unavailable_safe` | channel unavailable | raw channel identity |
| `assert.channel.line.binding_hidden.channel_unavailable_safe` | LINE binding state unsafe | `channel_unavailable_safe` | generic channel unavailable | binding exists/does-not-exist hint |
| `assert.safe_deny.channel.case_binding.generic_unavailable` | hidden Case/channel relationship | `generic_unavailable` | generic unavailable | Case-channel link hint |
| `assert.channel.channel.no_available_channel.channel_unavailable_safe` | no channel deliverability | `channel_unavailable_safe` | channel unavailable | provider/account detail |

LINE-related assertions must not hard-code LINE as the only customer entry point.

## Provider / No-Send Mode Safe-Deny Assertions

| Assertion name | Scenario | Required safe-deny category | Admin category | Forbidden differences |
| --- | --- | --- | --- | --- |
| `assert.provider.no_send.no_delivery.provider_unavailable_safe` | no-send mode active | `provider_unavailable_safe` | provider unavailable | delivery attempt detail |
| `assert.provider.provider.not_ready.provider_unavailable_safe` | provider not configured | `provider_unavailable_safe` | provider unavailable | provider config |
| `assert.provider.survey.paused.provider_unavailable_safe` | survey runtime paused | `provider_unavailable_safe` | not available | survey delivery promise |
| `assert.provider.channel.not_deliverable.channel_unavailable_safe` | channel not deliverable | `channel_unavailable_safe` | channel unavailable | channel binding detail |

Task213 does not implement no-send mode, provider calls, or survey runtime.

## Explicit Denial Allowed Cases

Explicit denial may be acceptable when:

- the user is already authorized to view the resource,
- the action itself is not permitted,
- the feature surface is visible but the action is gated,
- the conflict state belongs to a visible resource,
- audit/evidence panels are visible but detailed access is restricted.

Explicit denial is not acceptable when it would reveal that a hidden, out-of-scope, or nonexistent resource exists.

## Forbidden Response and UI Differences

Future safe-deny assertions must fail if responses or UI reveal:

- existence hints,
- hidden identifiers,
- hidden counts,
- tenant names,
- organization names,
- branch or team labels,
- customer contact values,
- raw LINE user id,
- raw channel identifiers,
- raw payloads,
- token or secret values,
- provider account or raw provider error,
- stack traces,
- SQL errors,
- DB constraint names,
- internal diagnostic payloads,
- plan/pricing detail,
- usage values,
- AI token counts,
- production translation strings,
- timing/retry differences intentionally exposing resource existence.

## Diagnostic / Log Redaction Requirements

Diagnostics for safe-deny outcomes may include safe categories such as:

- `generic_unavailable`,
- `permission_denied_safe`,
- `feature_unavailable_safe`,
- `channel_unavailable_safe`,
- `provider_unavailable_safe`,
- `ai_unavailable_safe`.

Diagnostics must not include raw request/response payloads, raw channel identities, customer contact values, provider credentials, DB implementation details, or hidden resource identifiers.

## Assertion Naming Alignment with Task211

Task213 uses the Task211 naming style:

```text
assert.<surface>.<scenario_group>.<property>.<expected_safety_category>
```

Names remain proposal-only and do not create executable tests.

## Response Equivalence Alignment with Task212

Task213 narrows Task212 response equivalence into safe-deny cases where non-disclosure is required.

The main equivalence families are:

- `hidden_missing_equivalent`,
- `scope_missing_equivalent`,
- `feature_unavailable_safe`,
- `permission_denied_safe`,
- `channel_unavailable_safe`,
- `provider_unavailable_safe`,
- `ai_unavailable_safe`,
- `diagnostic_redacted`.

## Expected Response Matrix Alignment with Task206

Task213 follows Task206 expected response guidance:

- hidden / out-of-scope / nonexistent resources collapse when visibility is unsafe,
- explicit 403-style denial is reserved for visible resources,
- Admin empty states must match API non-leakage behavior,
- message keys remain safe placeholder families.

## Test Case Catalog Alignment with Task207

Task213 covers Task207 scenario groups:

- `PERM`,
- `SCOPE`,
- `ENT`,
- `HIDDEN`,
- `AUDIT`,
- `CHANNEL`,
- `PROVIDER`,
- `EXCL`.

The catalog remains documentation-only and does not convert Task207 labels into executable tests.

## Channel-Agnostic and LINE-Safe Boundaries

Safe-deny assertions must:

- treat LINE as one possible channel,
- avoid raw LINE identity values,
- avoid LINE access token and channel secret values,
- avoid assuming every Case starts from LINE,
- allow APP / SMS / email / manual follow-up as future channels,
- avoid revealing binding status when unsafe.

## AI Advisory-Only Boundary

Safe-deny assertions must not imply AI can:

- dispatch,
- complete,
- settle,
- approve,
- suppress,
- close,
- send,
- override official workflow decisions.

AI unavailable or risk-flag states remain advisory and manual-review oriented.

## Alignment with Task173-Task212

Task213 stays within the docs-only SLA / operations risk branch and aligns with:

- operational escalation design,
- human action workflow,
- permission and organization scope review,
- API contract draft,
- runtime readiness gating,
- API error and non-leakage decisions,
- resource enumeration expected response, catalog, fixture, mock-vs-DB, assertion strategy, naming, and response equivalence documents.

## Implementation Blockers and Required Approvals

Before implementing safe-deny assertions, future tasks must approve:

1. test framework,
2. test file location,
3. fixture implementation strategy,
4. mock-only vs DB-backed strategy,
5. disposable DB approval packet if DB is used,
6. localization approach if message keys become executable,
7. Admin test approach if UI assertions are implemented,
8. redaction assertion helper,
9. no-send / no-provider enforcement,
10. security review of output and artifacts.

## Future Task Candidates

Possible next docs-only tasks:

- message key assertion family decision packet,
- diagnostic redaction assertion helper design,
- Admin empty-state assertion readiness gate,
- disposable DB assertion approval packet,
- no-send integration assertion design,
- safe-deny implementation readiness gate.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task213 should be considered valid only if:

- it remains documentation-only,
- it does not create actual tests,
- it does not create fixture files,
- it does not connect to DB,
- it does not run psql,
- it does not run migrations or DDL,
- it does not run cleanup,
- it does not touch shared Zeabur runtime,
- it does not create or modify localization files,
- it does not modify backend source,
- it does not modify Admin source,
- it does not modify API behavior,
- it does not modify permission runtime,
- it does not modify entitlement runtime,
- it does not modify smoke, browser smoke, automated tests, or QA scripts,
- it does not modify OpenAPI / Swagger / generated clients,
- it does not create executable schema/config,
- it does not add migrations,
- it does not implement usage metering,
- it does not implement SaaS billing / subscription / payment,
- it does not implement plan / pricing runtime,
- it does not send LINE / APP / SMS / email,
- it does not implement survey runtime,
- it does not implement AI automatic decisions,
- it does not modify inventory docs,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.
