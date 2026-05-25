# Task 207 - SLA / Operations Risk Resource Enumeration Test Case Catalog / No Runtime Change

## Purpose and Non-Goals

Task207 defines a documentation-only catalog of future resource enumeration test cases for SLA / operations risk workflows.

This document turns Task206 expected response patterns into placeholder test case groups, equivalence groups, and pass/fail criteria. It does not create smoke tests, automated tests, test fixtures, API behavior, Admin UI, localization files, or runtime logic.

Task207 does not:

- create or modify smoke tests or automated tests,
- create test fixture files,
- define final production test cases,
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

Task207 preserves:

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

Task207 assumes:

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

## Test Case Catalog Principles

Future resource enumeration tests should:

1. compare hidden, out-of-scope, and nonexistent resource responses,
2. verify no hidden counts or identifiers are returned,
3. verify no raw diagnostics appear in API or Admin artifacts,
4. verify explicit 403 is used only when visibility is safe,
5. verify 404-style generic safe-deny is used when visibility is unsafe,
6. verify AI unavailable states are advisory-only,
7. verify channel ambiguity does not reveal LINE binding,
8. verify no-send test mode does not send providers,
9. verify Admin empty states match API error behavior,
10. remain future-only until implementation approval.

## Test Case ID Naming Convention

Placeholder ID pattern:

```text
RISK-ENUM-<GROUP>-<NUMBER>
```

Examples:

- `RISK-ENUM-BASE-001`
- `RISK-ENUM-PERM-001`
- `RISK-ENUM-SCOPE-001`
- `RISK-ENUM-HIDDEN-001`
- `RISK-ENUM-CHANNEL-001`

IDs are proposal-only and do not create test files.

## Test Case Field Definitions

Each future test case should define:

- test case ID,
- scenario group,
- actor role placeholder,
- organization / tenant / branch / team state,
- entitlement state,
- permission state,
- resource visibility state,
- requested surface / endpoint concept,
- expected API response category,
- expected Admin empty-state category,
- expected localization / messageKey family,
- response equivalence group,
- forbidden response differences,
- forbidden logs / diagnostics,
- pass/fail criteria.

## Scenario Group Overview

| Group | Purpose |
| --- | --- |
| `BASE` | valid in-scope access baseline |
| `PERM` | permission failure |
| `SCOPE` | organization / tenant / branch / team mismatch |
| `ENT` | entitlement / feature gate failure |
| `USAGE` | usage / export / AI add-on limits |
| `HIDDEN` | hidden vs nonexistent resources |
| `AUDIT` | audit / evidence access denial |
| `CHANNEL` | channel identity / LINE binding ambiguity |
| `PROVIDER` | provider / channel readiness |
| `STATE` | stale / concurrent / duplicate / suppressed state |
| `EXCL` | first-release exclusion / no-send mode |

## Valid In-Scope Access Baseline Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-BASE-001` | authorized actor views enabled dashboard | success with safe dashboard data |
| `RISK-ENUM-BASE-002` | authorized actor views empty queue | success with normal empty state |
| `RISK-ENUM-BASE-003` | deterministic queue available but AI add-on unavailable | queue succeeds, AI panel disabled |

Pass if success responses contain only allow-listed safe fields and no raw payloads, raw channel identifiers, or hidden diagnostics.

## Permission Failure Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-PERM-001` | visible item, action permission missing | explicit permission denied allowed |
| `RISK-ENUM-PERM-002` | hidden item, action permission missing | generic unavailable |
| `RISK-ENUM-PERM-003` | visible item requires reviewer | reviewer required safe denial |
| `RISK-ENUM-PERM-004` | visible item, evidence permission missing | evidence unavailable without count |
| `RISK-ENUM-PERM-005` | visible item, audit permission missing | audit unavailable without count |

Fail if the response reveals role internals, hidden evidence, hidden audit counts, or resource existence when visibility is unsafe.

## Organization / Tenant / Branch Scope Failure Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-SCOPE-001` | organization mismatch | generic not available |
| `RISK-ENUM-SCOPE-002` | tenant mismatch | generic not available |
| `RISK-ENUM-SCOPE-003` | branch mismatch | generic not available by default |
| `RISK-ENUM-SCOPE-004` | team mismatch | generic not available by default |
| `RISK-ENUM-SCOPE-005` | wrong queue role scope | queue unavailable without hidden count |

Fail if the response says the item belongs to another organization, tenant, branch, or team.

## Entitlement / Feature Gate Failure Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-ENT-001` | normal operator lacks feature entitlement | feature unavailable without plan detail |
| `RISK-ENUM-ENT-002` | entitlement missing and resource visibility uncertain | generic unavailable |
| `RISK-ENUM-ENT-003` | feature disabled until approval | feature unavailable |
| `RISK-ENUM-ENT-004` | future tenant admin views unavailable feature | safe admin next step only if approved |

Fail if plan internals, pricing, hidden feature keys, or commercial reasons are exposed.

## Usage / Export / AI Add-On Failure Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-USAGE-001` | usage limited | limited copy without values |
| `RISK-ENUM-USAGE-002` | export not enabled | export unavailable without hidden count |
| `RISK-ENUM-USAGE-003` | AI add-on not enabled | AI unavailable with manual review fallback |
| `RISK-ENUM-USAGE-004` | AI risk radar unavailable | disabled until approval |

Fail if provider costs, billing diagnostics, raw AI prompts, raw AI outputs, or usage values appear.

## Hidden Resource vs Nonexistent Resource Cases

| Test case ID | Scenario | Expected equivalence |
| --- | --- | --- |
| `RISK-ENUM-HIDDEN-001` | hidden resource vs nonexistent resource | same safe category and shape |
| `RISK-ENUM-HIDDEN-002` | out-of-scope resource vs nonexistent resource | same safe category and shape |
| `RISK-ENUM-HIDDEN-003` | hidden Case context vs missing Case context | no Case existence leak |
| `RISK-ENUM-HIDDEN-004` | hidden appointment context vs missing appointment context | no visit existence leak |
| `RISK-ENUM-HIDDEN-005` | hidden report context vs missing report context | no report existence leak |

Fail if response code, message key, metadata, or retry hint reveals hidden existence.

## Audit / Evidence Access Denial Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-AUDIT-001` | hidden evidence | evidence unavailable or generic unavailable |
| `RISK-ENUM-AUDIT-002` | missing evidence | equivalent to hidden evidence where unsafe |
| `RISK-ENUM-AUDIT-003` | hidden audit | audit unavailable or generic unavailable |
| `RISK-ENUM-AUDIT-004` | missing audit | equivalent to hidden audit where unsafe |

Fail if evidence counts, audit counts, file paths, object keys, provider payloads, or raw attachment details appear.

## Channel Identity / LINE Binding Ambiguity Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-CHANNEL-001` | hidden channel identity | channel context unavailable |
| `RISK-ENUM-CHANNEL-002` | LINE binding ambiguous | no binding status leak |
| `RISK-ENUM-CHANNEL-003` | no visible channel for customer | no customer contact value |
| `RISK-ENUM-CHANNEL-004` | reverse binding not implemented | feature unavailable without promise |

Fail if raw channel identifiers, LINE binding status, customer contact values, or provider details appear.

## Provider / Channel Readiness Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-PROVIDER-001` | provider not configured | delivery unavailable without provider detail |
| `RISK-ENUM-PROVIDER-002` | provider raw error hidden | generic delivery unavailable |
| `RISK-ENUM-PROVIDER-003` | provider delivery not approved | feature unavailable |
| `RISK-ENUM-PROVIDER-004` | no-send mode active | no customer notification sent |

Fail if provider account state, credentials, raw provider errors, or delivery payloads appear.

## Workflow-State Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-STATE-001` | visible item stale | 409-style refresh guidance |
| `RISK-ENUM-STATE-002` | visible concurrent update | 409-style refresh guidance |
| `RISK-ENUM-STATE-003` | visible already resolved | already handled copy |
| `RISK-ENUM-STATE-004` | visible already suppressed | already handled copy |
| `RISK-ENUM-STATE-005` | hidden stale item | generic unavailable |

Fail if hidden state differences reveal resource existence.

## First-Release Exclusion / No-Send Mode Cases

| Test case ID | Scenario | Expected result |
| --- | --- | --- |
| `RISK-ENUM-EXCL-001` | AI risk radar excluded | disabled until approval |
| `RISK-ENUM-EXCL-002` | export excluded | export unavailable |
| `RISK-ENUM-EXCL-003` | broad audit view excluded | unavailable or hidden |
| `RISK-ENUM-EXCL-004` | survey runtime excluded | not shown or feature unavailable |
| `RISK-ENUM-EXCL-005` | no-send test mode | no provider send and safe copy |

Fail if first-release exclusion implies hidden plan availability or provider sending.

## Response Equivalence Groups

Future tests should group responses:

| Group | Responses that should match when visibility is unsafe |
| --- | --- |
| `EQ-HIDDEN-NOTFOUND` | hidden existing resource, nonexistent resource |
| `EQ-SCOPE-NOTFOUND` | out-of-scope resource, nonexistent resource |
| `EQ-EVIDENCE-HIDDEN` | hidden evidence, missing evidence |
| `EQ-AUDIT-HIDDEN` | hidden audit, missing audit |
| `EQ-CHANNEL-HIDDEN` | hidden channel binding, absent channel binding |
| `EQ-ENTITLEMENT-HIDDEN` | missing entitlement, hidden feature when normal user cannot know |

Equivalence should cover status style, code family, message key family, response shape, retry hint, and absence of sensitive metadata.

## Forbidden Differences and Diagnostics

Forbidden differences include:

- exact hidden counts,
- raw IDs,
- hidden tenant / organization labels,
- role internals,
- plan internals,
- provider readiness details,
- customer contact values,
- raw channel ids,
- raw payload snippets,
- stack traces,
- SQL errors,
- DB constraint names,
- provider raw errors.

## Pass / Fail Criteria

Pass when:

- expected safe response category is used,
- expected Admin empty state is non-leaking,
- response shape is allow-listed,
- hidden/nonexistent equivalence holds where required,
- no sensitive values appear,
- no provider sending happens,
- AI remains advisory-only.

Fail when:

- response reveals hidden resource existence,
- response reveals tenant / organization mismatch,
- response reveals plan, usage, pricing, provider, or channel details,
- Admin copy differs in a way that exposes hidden state,
- logs or QA artifacts contain forbidden diagnostics.

## Alignment with Task206 Expected Response Matrix

Task207 expands Task206's expected response matrix into proposal-only test case catalog form. It does not create test files.

## Alignment with Task192 Resource Enumeration Test Plan

Task192 remains the broader test plan. Task207 provides candidate case IDs and scenario groups for future implementation planning.

## Admin Empty-State and API Error Mapping Alignment

Task207 aligns with:

- Task204 Admin surface inventory,
- Task205 Admin empty-state to API error mapping,
- Task201 feature gate API error mapping,
- Task196 API response shape.

## Diagnostic Redaction and QA Artifact Alignment

Task207 follows Task193 / Task194 / Task195. Future test output and screenshots must use safe summaries only.

## Channel-Agnostic and LINE-Safe Boundaries

Future tests must not require LINE as the only channel and must not expose raw LINE identifiers or LINE binding status.

## AI Advisory-Only Boundary

AI test cases must verify that AI unavailability does not imply AI authority and that deterministic workflows can still be reviewed manually when allowed.

## Alignment with Task173-Task205

Task207 preserves the docs-only SLA / operations risk design sequence and does not create runtime, API, Admin, DB, migration, provider, survey, AI, or test implementation.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. actual test framework location,
2. fixture strategy,
3. API route surface,
4. Admin surface behavior,
5. production expected responses,
6. localization keys,
7. redaction assertions,
8. security review.

## Future Task Candidates

Possible next docs-only tasks:

- resource enumeration fixture strategy plan,
- hidden vs nonexistent assertion checklist,
- API response equivalence assertion design,
- Admin empty-state screenshot redaction plan,
- channel ambiguity test design,
- AI unavailable test design,
- export unavailable test design.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task207 should be considered valid only if:

- it remains documentation-only,
- it does not create or modify tests,
- it does not create fixture files,
- it does not define final production test cases,
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
