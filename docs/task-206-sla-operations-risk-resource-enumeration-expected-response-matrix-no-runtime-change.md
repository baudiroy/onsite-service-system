# Task 206 - SLA / Operations Risk Resource Enumeration Expected Response Matrix / No Runtime Change

## Purpose and Non-Goals

Task206 defines a documentation-only expected response matrix for future SLA / operations risk resource enumeration protection.

This document describes how future API and Admin behavior should respond to permission, entitlement, scope, hidden-resource, nonexistent-resource, channel, provider, stale-state, and first-release exclusion scenarios without leaking sensitive resource existence. It does not create tests, API behavior, Admin UI, or runtime logic.

Task206 does not:

- create or modify smoke tests or automated tests,
- define final production expected responses,
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
- create usage metering runtime,
- create SaaS billing, subscription, payment, plan, or pricing runtime,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable AI automatic decisions,
- modify inventory docs,
- output sensitive values.

## Source-of-Truth Guardrails

Task206 preserves:

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

Task206 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no localization implementation exists for this branch,
- no entitlement runtime exists,
- no permission runtime changes are approved,
- no usage metering runtime exists,
- no SaaS billing / subscription / payment runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

## Expected Response Matrix Principles

Future expected responses should:

1. collapse hidden, out-of-scope, and nonexistent resources when needed,
2. avoid response differences that reveal resource existence,
3. avoid hidden counts and hidden identifiers,
4. avoid plan, pricing, usage, and provider diagnostics,
5. avoid raw customer/contact/channel values,
6. allow explicit permission errors only when visibility is already safe,
7. allow stale / conflict errors only when the item is visible,
8. keep Admin empty states aligned with API errors,
9. keep AI and channel behavior advisory / unavailable without raw context,
10. remain proposal-only until tests and implementation are approved.

## Matrix Column Definitions

| Column | Meaning |
| --- | --- |
| Scenario category | Type of access attempt or failure |
| Actor placeholder | Future role category, not production role |
| Scope placeholder | Organization / tenant / branch / team visibility state |
| Entitlement state | Feature enabled, disabled, missing, or future-only |
| Permission state | User permission present or missing |
| Resource visibility | Visible, hidden, nonexistent, or uncertain |
| Expected API category | Safe response family |
| Expected Admin behavior | Safe empty/disabled state |
| Message key family | Placeholder localization family |
| 403 vs 404 guidance | Explicit deny or generic safe-deny |
| Forbidden differences | Differences that must not leak existence |
| Pass/fail criteria | Future test expectation |

## Scenario Category Overview

Covered scenarios:

- valid in-scope access,
- permission missing,
- organization / tenant mismatch,
- branch/team scope mismatch,
- entitlement missing,
- feature disabled,
- usage/export limit reached,
- AI add-on not enabled,
- resource hidden or not visible,
- nonexistent resource,
- audit/evidence denied,
- channel identity ambiguity,
- LINE binding ambiguity,
- provider/channel readiness unavailable,
- stale / concurrent update,
- duplicate / suppressed / already resolved,
- first-release intentionally excluded feature,
- no-send / no-provider test mode.

## Valid In-Scope Access Baseline

| Scenario | Expected API category | Expected Admin behavior | Pass/fail criteria |
| --- | --- | --- | --- |
| authorized user, entitlement enabled, permission present, resource visible | success | show safe queue/detail/action surface | response contains only allow-listed fields |
| authorized user, no visible queue items | success with empty list | normal empty state | no hidden counts |
| authorized user, feature enabled but no AI add-on | success for deterministic queue, AI panel disabled | deterministic UI available, AI unavailable | AI disabled does not block non-AI workflow |

Baseline success must still avoid raw payloads, raw channel identifiers, customer contact values, and hidden diagnostics.

## Permission Failure Expected Responses

| Scenario | Expected API category | Admin behavior | 403 vs 404 guidance |
| --- | --- | --- | --- |
| user can view item but cannot act | permission denied | disabled action copy | 403 acceptable |
| user cannot view item and cannot act | generic unavailable | item unavailable | 404-style |
| reviewer required for visible item | reviewer required | higher review copy | 403 acceptable |
| evidence permission missing but risk visible | evidence unavailable | evidence panel disabled | 403 acceptable |
| audit permission missing but item visible | audit unavailable | audit panel disabled | 403 acceptable |

Forbidden differences:

- do not reveal hidden role hierarchy,
- do not reveal hidden evidence counts,
- do not reveal hidden audit counts.

## Organization / Tenant / Branch Scope Failure Expected Responses

| Scenario | Expected API category | Admin behavior | 403 vs 404 guidance |
| --- | --- | --- | --- |
| organization mismatch | item not available | generic unavailable | 404-style |
| tenant mismatch | item not available | generic unavailable | 404-style |
| branch mismatch | item not available unless branch visibility exists | generic unavailable | 404-style by default |
| team mismatch | item not available unless team visibility exists | generic unavailable | 404-style by default |
| wrong queue role scope | queue unavailable | queue unavailable | 403 only if queue visibility is safe |

Forbidden differences:

- no "belongs to another organization" copy,
- no tenant names,
- no branch/team identifiers,
- no timing or metadata differences that reveal existence.

## Entitlement / Feature Gate Expected Responses

| Scenario | Expected API category | Admin behavior | 403 vs 404 guidance |
| --- | --- | --- | --- |
| feature not enabled for normal operator | feature unavailable | feature unavailable / contact admin | 403 if surface visibility is safe |
| feature not enabled and visibility uncertain | generic unavailable | generic unavailable | 404-style |
| feature disabled until approval | feature unavailable | disabled until approval | 403 if safe |
| tenant admin future view | feature unavailable with safe admin next step | safe admin summary | future policy only |

Forbidden differences:

- no plan internals,
- no commercial reason,
- no raw feature key for customers,
- no hidden entitlement status for unauthorized users.

## Usage / Export / AI Add-On Expected Responses

| Scenario | Expected API category | Admin behavior | Forbidden differences |
| --- | --- | --- | --- |
| usage limited | usage limited | limited copy | no usage value |
| plan limit reached | limit reached | limited copy | no plan/pricing detail |
| export not enabled | export unavailable | export disabled | no export count |
| AI add-on not enabled | AI unavailable | review manually | no provider/cost detail |
| AI risk radar unavailable | feature unavailable | disabled until approval | no AI capability promise |

Usage, export, and AI responses must not expose provider costs, billing diagnostics, raw AI prompts, raw AI outputs, or hidden usage state.

## Resource Hidden / Not Found Expected Responses

| Scenario | Expected API category | Admin behavior | Equivalence requirement |
| --- | --- | --- | --- |
| hidden existing resource | item not available | generic unavailable | same as nonexistent where visibility is unsafe |
| nonexistent resource | item not available | generic unavailable | same as hidden where visibility is unsafe |
| hidden Case context | context not available | generic context unavailable | no Case existence leak |
| hidden appointment context | context not available | generic context unavailable | no visit existence leak |
| hidden report context | context not available | generic context unavailable | no report existence leak |

Future tests should compare status style, code family, message key family, response shape, and metadata safety.

## Audit / Evidence Access Expected Responses

| Scenario | Expected API category | Admin behavior | Forbidden differences |
| --- | --- | --- | --- |
| evidence hidden | evidence not available or generic unavailable | evidence unavailable | no evidence count |
| evidence permission denied | evidence permission denied | evidence disabled | no raw reference |
| audit hidden | audit not available or generic unavailable | audit unavailable | no audit count |
| audit permission denied | audit permission denied | audit disabled | no action count |

Evidence and audit responses must not include file paths, object keys, provider payloads, raw attachments, or hidden counts.

## Channel Identity / LINE Binding Ambiguity Expected Responses

| Scenario | Expected API category | Admin behavior | Forbidden differences |
| --- | --- | --- | --- |
| channel identity hidden | channel context unavailable | channel info unavailable | no binding status |
| LINE binding ambiguous | channel context unavailable | generic channel unavailable | no raw LINE id |
| customer has no visible channel | channel context unavailable | channel info unavailable | no customer contact value |
| reverse binding not implemented | feature unavailable | feature unavailable | no workflow promise |

Channel ambiguity must not reveal whether a LINE identity exists, whether a customer is bound, or whether a hidden channel is configured.

## Provider / Channel Readiness Expected Responses

| Scenario | Expected API category | Admin behavior | Forbidden differences |
| --- | --- | --- | --- |
| provider not configured | delivery unavailable | delivery unavailable | no provider account detail |
| channel delivery unavailable | delivery unavailable | delivery unavailable | no raw channel ids |
| provider error hidden | generic unavailable | delivery unavailable | no provider raw error |
| provider delivery not approved | feature unavailable | disabled until approval | no provider sending assumption |

No provider sending is approved by this design.

## Workflow-State Expected Responses

| Scenario | Expected API category | Admin behavior | 403 vs 404 guidance |
| --- | --- | --- | --- |
| stale visible item | stale state | refresh copy | 409 acceptable |
| concurrent visible update | concurrent update | refresh copy | 409 acceptable |
| already resolved visible item | already resolved | already handled copy | 409 acceptable |
| already suppressed visible item | already suppressed | already handled copy | 409 acceptable |
| duplicate grouped visible item | duplicate grouped | grouped copy | future policy |
| hidden item stale state | generic unavailable | generic unavailable | 404-style |

Stale and conflict responses are safe only when item visibility is already established.

## First-Release Exclusion / No-Send Mode Expected Responses

| Scenario | Expected API category | Admin behavior | Notes |
| --- | --- | --- | --- |
| first-release excluded feature | feature unavailable | disabled until approval | no promise of availability |
| AI risk radar excluded | feature unavailable | disabled until approval | no AI authority |
| export excluded | export unavailable | export disabled | no hidden count |
| no-send test mode | success / disabled state | no-send copy | no provider send |
| provider delivery excluded | delivery unavailable | delivery unavailable | no provider detail |

No-send / no-provider mode must never send customer notifications.

## Response Equivalence Requirements

Future tests should ensure equivalence where required:

- hidden resource and nonexistent resource should be indistinguishable when visibility is unsafe,
- out-of-scope and nonexistent resource should be indistinguishable when visibility is unsafe,
- hidden evidence and missing evidence should not leak existence,
- hidden audit and missing audit should not leak existence,
- hidden channel binding and absent binding should not leak existence,
- feature not enabled and disabled-until-approved should not expose plan internals,
- missing permission and hidden item should collapse when visibility is unsafe.

Equivalence should cover status style, safe code family, message key family, response shape, and absence of sensitive metadata.

## Forbidden Response Differences

Future implementations must avoid differences in:

- exact status when it reveals existence,
- error code specificity when it reveals existence,
- message specificity when it reveals existence,
- hidden counts,
- hidden ids,
- timing that is obviously different,
- retry hints that expose hidden state,
- correlation ids that encode resource identity,
- metadata shape that differs only for existing hidden resources.

## Forbidden Logs / Diagnostics

Logs, QA artifacts, support notes, and handoff summaries must not include:

- raw payloads,
- raw channel identifiers,
- customer contact values,
- provider credentials,
- tokens or secrets,
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors,
- internal diagnostic payloads,
- hidden tenant identifiers,
- hidden organization identifiers,
- real usage values,
- pricing values.

## Admin Empty-State Alignment

Task206 aligns with Task204 / Task205:

- generic unavailable for hidden resources,
- permission copy only when visibility is safe,
- feature unavailable for safe entitlement failures,
- manual review copy for AI unavailability,
- no-send copy only in test contexts where safe,
- no hidden counts or ids.

## API Error Mapping and Response Shape Alignment

Task206 aligns with:

- Task201 feature gate error mapping,
- Task196 response shape,
- Task189 error catalog,
- Task190 allow-list review.

Future responses should expose only safe fields and must not include raw diagnostics.

## 403 vs 404 and Non-Leakage Alignment

Task191 remains the decision guide:

- 403 when the user can know the item exists and lacks action permission,
- 404-style generic safe-deny when resource visibility is unsafe,
- 409 only for visible stale/conflict states,
- 400 only for allow-listed validation failures.

## Resource Enumeration Test Plan Alignment

Task206 refines Task192 into expected response equivalence requirements. It does not add tests.

Future tests should compare:

- visible vs hidden response shapes,
- hidden vs nonexistent response shapes,
- out-of-scope vs nonexistent response shapes,
- entitlement failure vs hidden resource behavior,
- channel ambiguity behavior,
- AI unavailable behavior,
- export unavailable behavior.

## Diagnostic Redaction and QA Artifact Alignment

Task206 follows Task193 / Task194 / Task195. Future QA evidence must use safe summaries only and avoid raw diagnostic details.

## Channel-Agnostic and LINE-Safe Boundaries

Expected responses must not hard-code LINE.

Do not reveal:

- LINE binding status,
- raw LINE identifiers,
- LINE provider credentials,
- LINE delivery diagnostics,
- channel secrets,
- channel provider readiness.

## AI Advisory-Only Boundary

AI-related responses must not imply AI authority.

AI unavailable should lead to manual review, not blocked official workflow unless a future product policy explicitly approves otherwise.

## Alignment with Task173-Task205

Task206 preserves:

- escalation remains human-reviewed,
- data model remains proposal-only,
- thresholds remain proposal-only,
- dashboards and copy remain design-only,
- human actions remain future-only,
- audit and evidence policy remains design-only,
- organization and permission scope remain mandatory,
- API contract remains draft-only,
- readiness gate remains blocking before runtime,
- first-release scope remains narrow,
- RBAC remains proposal-only,
- error and response guidance remains non-leaking,
- entitlement UX remains non-runtime,
- feature keys remain placeholder-only,
- localization keys remain placeholder-only,
- disabled-state copy remains placeholder-only,
- empty-state surfaces remain inventory-only,
- Admin/API mapping remains proposal-only.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. production resource enumeration test cases,
2. production expected response matrix,
3. API response shape,
4. error code catalog,
5. Admin copy and localization keys,
6. permission / entitlement / scope evaluation,
7. diagnostic redaction behavior,
8. security review.

## Future Task Candidates

Possible next docs-only tasks:

- resource enumeration test case catalog,
- hidden vs nonexistent response equivalence checklist,
- channel ambiguity non-leakage matrix,
- AI unavailable non-leakage matrix,
- export unavailable non-leakage matrix,
- QA artifact redaction examples for enumeration tests.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task206 should be considered valid only if:

- it remains documentation-only,
- it does not create or modify tests,
- it does not define final production expected responses,
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
- it does not connect to DB,
- it does not run DDL,
- it does not apply or dry-run Migration 020,
- it does not implement usage metering,
- it does not implement SaaS billing / subscription / payment,
- it does not implement plan / pricing runtime,
- it does not send LINE / APP / SMS / email,
- it does not implement survey runtime,
- it does not implement AI automatic decisions,
- it does not modify inventory docs,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.
