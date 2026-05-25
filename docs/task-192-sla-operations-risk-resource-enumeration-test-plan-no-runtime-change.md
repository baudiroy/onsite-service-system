# Task 192 - SLA / Operations Risk Resource Enumeration Test Plan / No Runtime Change

## Purpose and Non-Goals

Task192 defines a documentation-only resource enumeration test plan for future SLA / operations risk workflows.

This document proposes future test scenarios for permission, organization scope, tenant scope, entitlement, visibility, evidence, audit, workflow-state, AI advisory, channel/provider, and LINE binding ambiguity. It does not create automated tests, smoke tests, backend code, Admin code, API behavior, OpenAPI files, schemas, migrations, entitlement runtime, SaaS billing, usage metering, notification delivery, survey runtime, or AI automation.

Task192 builds on:

- `docs/PROJECT_GUARDRAILS.md`
- the user-provided short guardrails version synced with PM
- `docs/task-181-sla-operations-risk-permission-and-organization-scope-review-no-runtime-change.md`
- `docs/task-187-sla-operations-risk-rbac-matrix-draft-no-runtime-change.md`
- `docs/task-188-sla-operations-risk-safe-error-and-permission-failure-copy-draft-no-runtime-change.md`
- `docs/task-189-sla-operations-risk-error-code-catalog-draft-no-runtime-change.md`
- `docs/task-190-sla-operations-risk-api-error-allow-list-review-no-runtime-change.md`
- `docs/task-191-sla-operations-risk-403-vs-404-non-leakage-decision-packet-no-runtime-change.md`

Task192 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify smoke, browser smoke, or automated tests,
- modify `package.json`,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- add SLA runtime,
- add operations risk runtime,
- add entitlement runtime,
- add usage metering runtime,
- add SaaS billing / subscription / payment implementation,
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

Task192 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- same Case must not have multiple open appointments at once,
- Field Service Report remains the Case-level final summary,
- `finalAppointmentId` remains backend / system determined and stable after completion,
- LINE is a channel, not the hard-coded core model,
- `line_user_id` is not global identity,
- all major future data must be organization / tenant scoped,
- permission and entitlement are separate concepts,
- API and Admin responses must protect organization / tenant isolation,
- AI is advisory only,
- future design notes do not authorize runtime implementation.

## Current Architecture Assumptions

Task192 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no resource enumeration test suite exists for this branch,
- no entitlement runtime exists,
- no SaaS subscription / billing / usage runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

This test plan is future-facing only.

## Resource Enumeration Threat Model

Resource enumeration happens when an unauthorized user can infer that a hidden resource exists by comparing API status, error code, message, timing, metadata, or UI behavior.

Future tests should protect against enumeration of:

- Cases,
- customers,
- appointments / visits,
- Field Service Reports,
- risk items,
- evidence references,
- audit records,
- organizations / tenants,
- feature entitlements,
- usage limits,
- channel identities,
- LINE bindings,
- provider configurations,
- AI advisory context.

## Test Plan Principles

Future tests should:

1. use placeholders only,
2. compare visible, hidden, nonexistent, wrong-organization, wrong-tenant, wrong-entitlement, and wrong-role cases,
3. assert safe-deny response equivalence where resource visibility is uncertain,
4. assert no raw customer, channel, provider, tenant, diagnostic, or payload values appear,
5. assert Admin UI does not reveal hidden counts,
6. assert internal diagnostics are redacted if exposed to logs,
7. assert permission and entitlement remain separate,
8. assert AI advisory cannot reveal hidden context,
9. assert provider/channel errors do not imply provider sending,
10. remain no-send and no-provider.

## Test Subject Categories

Future implementation may need test subjects such as:

- `org_visible_a`
- `org_hidden_b`
- `tenant_visible_a`
- `tenant_hidden_b`
- `user_frontline_visible`
- `user_supervisor_visible`
- `user_auditor_visible`
- `user_no_scope`
- `case_visible_placeholder`
- `case_hidden_placeholder`
- `case_nonexistent_placeholder`
- `risk_visible_placeholder`
- `risk_hidden_placeholder`
- `risk_nonexistent_placeholder`
- `channel_binding_hidden_placeholder`
- `entitlement_disabled_placeholder`

These names are placeholders only and must not be replaced with real customer, tenant, provider, LINE, or production values in documentation.

## Permission Failure Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| visible item, action denied | user can view item but lacks action permission | explicit safe permission denied is acceptable |
| hidden item, action attempted | user cannot view item | generic not available |
| visible item, evidence denied | user can view item but not evidence | evidence unavailable without count/type |
| visible item, audit denied | user can view item but not audit | action history unavailable without count |
| AI hint denied | user can view item but not AI context | AI suggestion unavailable with current permission |

Pass requires no hidden resource identity, count, raw id, or sensitive values.

## Organization / Tenant Scope Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| wrong organization risk id | caller belongs to another organization | generic not available |
| wrong tenant Case context | caller lacks tenant scope | generic context unavailable |
| wrong organization appointment context | caller lacks appointment visibility | visit context unavailable |
| wrong tenant audit request | caller lacks tenant scope | generic not available |
| cross-organization owner assignment | owner outside scope | owner unavailable without identity details |

Pass requires no response saying the resource belongs to another organization or tenant.

## Entitlement / Plan / Usage Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| feature disabled for organization | tenant lacks feature entitlement | generic feature unavailable |
| plan limit reached | usage limit reached | safe limit message only if caller may see usage context |
| AI add-on disabled | AI feature not enabled | AI suggestion unavailable for organization |
| export feature disabled | export entitlement missing | export unavailable |
| usage period hidden | caller lacks billing visibility | no exact usage counts or plan internals |

Pass requires no commercial plan internals unless future authorized billing/admin context exists.

## Resource Visibility / Not-Found Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| nonexistent risk id | no matching risk | not available |
| hidden risk id | matching risk outside scope | same externally observable behavior as nonexistent where policy requires |
| hidden Case context | risk visible but Case context restricted | Case context unavailable |
| hidden report context | risk visible but report restricted | report context unavailable |
| hidden channel context | risk visible but channel restricted | channel information unavailable |

Pass requires no distinguishable hidden-vs-nonexistent behavior where visibility is uncertain.

## Audit and Evidence Access Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| evidence hidden | user lacks evidence permission | no evidence details, count, type, file path, or object key |
| audit hidden | user lacks audit permission | no audit count, actor, note, or timestamp detail |
| invalid evidence reference | reference missing or hidden | evidence unavailable |
| provider evidence hidden | provider payload exists but restricted | no provider payload type or raw value |
| AI evidence hidden | AI context exists but restricted | no prompt, raw output, or hidden field |

Pass requires safe summary only.

## Workflow-State Failure Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| stale visible item | user can see item, stale version | refresh-required conflict |
| stale hidden item | user cannot see item | generic not available |
| duplicate grouped visible | user can see grouped item | grouped message without deletion implication |
| already suppressed visible | user can see item | already suppressed message |
| already resolved visible | user can see item | already resolved message |
| invalid action visible | user can see item | invalid action message |

Pass requires no duplicate side effects and no implication that AI or system silently resolved the issue.

## AI Advisory Boundary Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| AI unavailable | no suggestion exists | safe unavailable |
| AI hidden by permission | user lacks context visibility | safe permission-limited message |
| AI feature disabled | organization lacks AI entitlement | safe organization feature message |
| AI stale | suggestion stale | refresh / review manually |
| AI action attempted | user tries to treat AI as action authority | reject; AI is not authoritative |

Pass requires no prompt, raw model output, hidden context, inferred sensitive facts, or provider diagnostics.

## Channel / Provider / LINE Binding Ambiguity Test Scenarios

| Scenario | Future setup | Expected non-leakage behavior |
| --- | --- | --- |
| no deliverable channel | no approved channel available | no deliverable channel currently available |
| hidden LINE binding | binding exists but user lacks visibility | channel information unavailable |
| nonexistent LINE binding | no binding exists | externally similar to hidden where required |
| provider not configured | provider delivery unavailable | delivery not configured only in scoped admin context |
| provider raw error | provider error exists internally | no raw provider error in user-facing response |

Pass requires no raw LINE user id, channel secret, access token, provider account detail, recipient contact value, or provider raw error.

## Expected API Non-Leakage Behavior

Future API tests should assert:

- hidden and nonexistent resources produce safe equivalent responses where required,
- organization / tenant mismatch does not reveal scope details,
- entitlement failures do not reveal unauthorized plan internals,
- field validation does not echo raw input,
- errors do not include full payloads,
- errors do not include stack traces or SQL details,
- correlation ids are opaque and not credentials,
- response metadata is allow-listed.

## Expected Admin UI Non-Leakage Behavior

Future Admin UI tests should assert:

- hidden items do not appear in queues,
- empty states do not claim no risk exists globally,
- permission-denied copy is safe,
- hidden evidence and audit show unavailable messages without counts,
- hidden channel binding does not reveal LINE status,
- entitlement-disabled features do not expose plan internals to normal operators,
- no raw ids, customer values, provider diagnostics, or internal payloads appear.

## Placeholder Test Data Requirements

Future tests should use:

- placeholder organizations,
- placeholder tenants,
- placeholder users,
- placeholder roles,
- placeholder risk ids,
- placeholder case ids,
- placeholder appointment ids,
- placeholder report ids,
- placeholder channel states,
- placeholder entitlement states.

Future tests must not use production data, real customer values, real tenant identifiers, raw LINE identifiers, provider credentials, real tokens, or real payloads.

## Forbidden Logs / Artifacts / Diagnostics

Future tests must not produce artifacts containing:

- customer mobile / phone / tel values,
- raw LINE user id,
- LINE channel secret,
- LINE access token,
- provider credentials,
- token values,
- password values,
- `DATABASE_URL`,
- raw provider payload,
- raw customer payload,
- full Case / customer / appointment / report payload,
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors,
- internal diagnostic payloads,
- real tenant identifiers.

## Pass / Fail Criteria

Future test passes when:

- unauthorized callers cannot infer hidden resource existence,
- wrong-organization and nonexistent resources are safely indistinguishable where required,
- permission and entitlement failures do not leak sensitive context,
- Admin UI copy remains safe,
- API metadata remains allow-listed,
- diagnostics are redacted,
- no provider sending occurs,
- no AI action authority appears,
- no official Case / Appointment / Report lifecycle is mutated by the test unless explicitly in scope.

Future test fails if any response, UI, log, screenshot, artifact, or report exposes forbidden values or hidden resource existence.

## Alignment with Task188 / Task189 / Task190 / Task191

Task192 turns the safe copy, error code, error allow-list, and 403/404 decision design into future test scenario coverage.

- Task188: safe copy expectations.
- Task189: error code vocabulary.
- Task190: exposure classification.
- Task191: 403 vs 404 non-leakage decision rules.

## RBAC / Organization Scope Alignment

Task192 aligns with Task181 and Task187:

- organization scope is mandatory,
- queue visibility does not imply evidence visibility,
- evidence visibility does not imply audit visibility,
- action authority does not imply official lifecycle mutation,
- AI advisory visibility does not grant action authority.

## SaaS Entitlement Guardrail Alignment

Task192 aligns with `docs/PROJECT_GUARDRAILS.md`:

- entitlement and permission are separate,
- tenant feature availability must not be assumed,
- usage and plan limits remain future design,
- normal operators should not see unauthorized plan internals,
- future tenant admin / billing views need separate approval.

## Implementation Blockers and Required Approvals

Before implementing resource enumeration tests, the following must be approved:

- endpoint list,
- Admin screen list,
- fixture strategy,
- tenant / organization model,
- role and permission model,
- entitlement model,
- safe response equivalence rules,
- screenshot/log redaction rules,
- test data isolation,
- no-provider / no-send mode,
- security review.

This document does not approve implementation.

## Future Task Candidates

Possible follow-up tasks:

1. SLA / Operations Risk Resource Enumeration Fixture Strategy / No Runtime Change.
2. SLA / Operations Risk Internal Diagnostic Redaction Policy / No Runtime Change.
3. SLA / Operations Risk Entitlement Failure UX Draft / No Runtime Change.
4. SLA / Operations Risk API Error Response Shape Draft / No Runtime Change.
5. SLA / Operations Risk Security Review Checklist / No Runtime Change.
6. SLA / Operations Risk Error Handling Readiness Gate / No Runtime Change.

## Verification Checklist

Before using Task192 as input to future test implementation, verify:

- `docs/PROJECT_GUARDRAILS.md` still applies,
- Task192 is still treated as proposal-only,
- no production data is used,
- no real tenant identifiers are used,
- no raw LINE identifiers are used,
- hidden-vs-nonexistent behavior is tested safely,
- organization / tenant mismatch is tested safely,
- entitlement failures are tested without billing leakage,
- evidence and audit access denial is tested without counts or payloads,
- AI advisory boundaries are tested without prompts or raw outputs,
- provider/channel readiness is tested without provider diagnostics.

## Task192 Completion Note

Task192 is complete as a documentation-only resource enumeration test plan.

No backend source, Admin source, API implementation, route/controller/service/repository, smoke test, automated test, OpenAPI/generated client, executable config, migration, schema, index, DB, DDL, entitlement runtime, usage metering, SaaS billing/subscription/payment, provider sending, survey runtime, AI automatic decision, or inventory documentation was changed.
