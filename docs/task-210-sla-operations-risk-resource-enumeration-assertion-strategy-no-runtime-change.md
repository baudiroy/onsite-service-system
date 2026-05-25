# Task 210 - SLA / Operations Risk Resource Enumeration Assertion Strategy / No Runtime Change

## Purpose and Non-Goals

Task210 defines a documentation-only assertion strategy for future SLA / operations risk resource enumeration tests.

This document translates the Task206 expected response matrix, Task207 test case catalog, Task208 fixture strategy, and Task209 mock-vs-DB decision packet into future assertion categories. It does not create tests, fixtures, DB connections, runtime behavior, localization files, Admin UI, API behavior, or smoke coverage.

Task210 does not:

- create or modify smoke tests or automated tests,
- create test fixture files,
- define final production assertion implementation,
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

Task210 preserves:

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

Task210 assumes:

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

## Assertion Strategy Principles

Future assertions should:

1. compare response categories instead of hidden resource details,
2. verify hidden, out-of-scope, and nonexistent resources do not become distinguishable,
3. assert allow-listed response shape and metadata,
4. assert safe `messageKey` families rather than production translations,
5. assert Admin empty-state categories rather than exact copy when copy is not yet implemented,
6. assert no raw diagnostics in API, Admin, logs, or QA artifacts,
7. assert no provider sending in no-send / no-provider scenarios,
8. assert AI advisory-only behavior,
9. remain mock-only first where possible,
10. require explicit approval before DB-backed assertions.

## Assertion Category Overview

| Category | Purpose | Current strategy |
| --- | --- | --- |
| API response equivalence | ensure hidden and nonexistent resources share safe response families | mock-only first |
| API error code allow-list | keep errors within approved code families | mock-only first |
| response shape safety | prevent hidden fields and identifiers | mock-only first |
| metadata safety | avoid retry/timing/diagnostic leaks | mock-only first, DB later if needed |
| `messageKey` family safety | avoid raw production copy or internal reason leaks | mock-only first |
| Admin empty-state equivalence | align UI states with API non-leakage | mock-only first |
| disabled-state copy category | keep entitlement/permission disabled states safe | mock-only first |
| 403 vs 404 non-leakage | prove explicit deny is used only when safe | mock-only first |
| diagnostic redaction | prevent internal data in diagnostics and QA artifacts | mock-only first |
| no-send / no-provider | prove no outbound delivery when future runtime exists | future only |
| AI advisory boundary | prevent AI authoritative behavior | mock-only first |

## API Response Equivalence Assertions

Future tests should assert equivalence groups, not hidden facts.

Recommended assertion families:

| Assertion family | Expected property |
| --- | --- |
| `response.category.same_for_hidden_and_missing` | hidden and nonexistent resources produce the same safe family when visibility is unsafe |
| `response.shape.allow_listed` | response contains only approved top-level keys |
| `response.no_hidden_counts` | no count, total, page, or related-resource value reveals hidden data |
| `response.no_cross_scope_identifiers` | no tenant, organization, branch, team, Case, appointment, report, audit, or evidence identifier leaks |
| `response.no_customer_or_channel_values` | no customer contact value or raw channel identity appears |

Assertions should compare status category, code family, `messageKey` family, response shape, metadata shape, and Admin empty-state category.

## API Error Code / Allow-List Assertions

Future tests should assert that API responses use approved categories from Task189, Task190, Task196, and Task201.

Suggested placeholder categories:

| Category | Assertion |
| --- | --- |
| `generic_not_available` | safe-deny for hidden / out-of-scope / nonexistent when visibility is unsafe |
| `permission_denied_safe` | explicit permission failure only when resource visibility is already safe |
| `feature_unavailable_safe` | entitlement / feature gate unavailable without plan internals |
| `usage_limited_safe` | usage unavailable without numeric usage, pricing, or provider data |
| `conflict_visible_only` | stale / duplicate / resolved conflicts only when item is visible |
| `provider_unavailable_safe` | provider readiness failure without provider diagnostics |

Assertions must not require raw internal error names, framework stack traces, SQL errors, DB constraint names, or provider raw errors.

## Response Shape and Metadata Safety Assertions

Future assertions should verify:

- response objects contain only allow-listed safe fields,
- metadata does not reveal hidden resource existence,
- retry hints do not differ between hidden and nonexistent resources when visibility is unsafe,
- correlation references, if any, are safe opaque request references,
- no diagnostic object includes internal implementation details,
- pagination metadata does not reveal hidden counts,
- feature availability metadata does not reveal unauthorized entitlement internals.

Forbidden metadata examples include internal IDs, hidden totals, SQL details, provider raw values, stack traces, pricing values, usage values, and raw channel identifiers.

## MessageKey / Localization Family Assertions

Future tests may assert placeholder `messageKey` families, not final production translations.

Recommended placeholder families:

| Message key family | Usage |
| --- | --- |
| `risk.unavailable.generic` | hidden / missing / out-of-scope safe-deny |
| `risk.permission.denied.safe` | visible resource but missing permission |
| `risk.feature.unavailable.safe` | feature gate or entitlement unavailable |
| `risk.usage.limited.safe` | usage or export limit unavailable |
| `risk.channel.unavailable.safe` | channel readiness unavailable without raw channel detail |
| `risk.provider.unavailable.safe` | provider unavailable without provider detail |
| `risk.state.conflict.safe` | visible stale / duplicate / resolved state |
| `risk.ai.unavailable.safe` | AI unavailable without provider, prompt, or cost detail |

Task210 does not create localization files and does not define production translation strings.

## Admin Empty-State Assertions

Admin assertions should verify empty-state categories aligned with Task204 and Task205.

Recommended categories:

| Admin category | Assertion |
| --- | --- |
| `normal_empty` | visible queue with no items shows ordinary empty state |
| `feature_unavailable` | disabled feature does not imply hidden resources |
| `permission_unavailable` | missing permission keeps action unavailable without resource leak |
| `generic_unavailable` | hidden / out-of-scope / nonexistent resources appear equivalent |
| `channel_unavailable` | channel state does not reveal raw LINE binding or identity |
| `provider_unavailable` | provider unavailable without delivery diagnostics |
| `ai_unavailable` | AI disabled/unavailable with deterministic workflow still usable |

Assertions should not require exact UI copy until localization and Admin implementation are approved.

## Disabled-State Copy Assertions

Future disabled-state assertions should verify:

- disabled actions do not imply hidden resource existence,
- entitlement disabled states do not reveal plan internals,
- permission disabled states do not reveal role hierarchy,
- channel disabled states do not reveal LINE binding status when unsafe,
- provider disabled states do not reveal provider configuration,
- AI disabled states remain advisory and do not block deterministic workflow.

Disabled state assertions should use placeholder category labels, not production copy.

## Generic Safe-Deny and 403 vs 404 Assertions

Future tests should assert:

- 403-style explicit deny is allowed only when resource visibility is safe,
- 404-style generic unavailable is required when visibility is unsafe,
- hidden existing and nonexistent resources remain equivalent,
- organization / tenant mismatch does not reveal ownership,
- branch / team mismatch does not reveal assignment,
- entitlement missing does not reveal hidden resource existence,
- evidence / audit denial does not reveal hidden counts.

The assertion target is the safety category, not exact status code until API implementation is approved.

## Timing / Retry / Metadata Leakage Assertions

Future assertions should avoid brittle timing tests, but should define safety expectations:

- hidden and nonexistent resources should not have intentionally different retry behavior,
- retry-after metadata must not reveal hidden workflow status,
- stale-state conflicts must only appear for visible resources,
- rate-limit or usage metadata must not expose real usage values,
- provider retry metadata must not expose provider configuration.

Any future timing assertion must use safe tolerances and synthetic data only.

## Diagnostic / Log Redaction Assertions

Future diagnostic assertions should verify that diagnostic output excludes:

- raw payloads,
- raw channel identities,
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

Diagnostics may contain safe high-level categories such as `permission_denied`, `feature_unavailable`, or `generic_unavailable`.

## QA Artifact Redaction Assertions

Future QA artifact assertions should verify:

- screenshots do not show customer contact values,
- saved logs do not include raw payloads,
- test summaries use placeholder actor/resource labels,
- fixture summaries do not include real tenant or organization names,
- failure output does not paste raw API responses when they include sensitive fields,
- artifacts remain safe for handoff review.

Task210 does not create QA scripts or artifacts.

## No-Send / No-Provider Assertions

Future no-send / no-provider assertions should verify:

- no LINE push is sent,
- no APP push is sent,
- no SMS or email is sent,
- no notification provider API is called,
- no survey delivery is attempted,
- no provider credential is required,
- no outbound channel is chosen by AI,
- provider unavailable states are represented safely.

These assertions are future-only and require runtime approval before implementation.

## AI Advisory Boundary Assertions

Future AI assertions should verify:

- AI unavailable states do not block deterministic manual workflow,
- AI suggestions are not authoritative records,
- AI does not decide escalation, suppression, dispatch, completion, survey sending, billing, settlement, quote approval, or complaint closure,
- AI output is not treated as fact without human/system confirmation,
- AI diagnostics do not include prompts, raw model output, provider detail, or cost detail.

## Forbidden Assertions

Future tests must not assert on:

- actual customer data,
- actual tenant or organization identifiers,
- raw LINE user id,
- raw payloads,
- provider raw values,
- tokens or secrets,
- URLs containing secrets,
- contact numbers,
- passwords,
- `DATABASE_URL`,
- framework stack traces,
- SQL errors,
- DB constraint names,
- provider credentials,
- raw diagnostic payloads,
- real usage values,
- pricing values,
- AI token counts,
- production translation strings.

Future tests also must not assert that AI made an official business decision.

## Response Equivalence Group Alignment with Task206 / Task207

| Task207 group | Response equivalence assertion |
| --- | --- |
| `BASE` | success shape contains only safe allow-listed fields |
| `PERM` | explicit denial only when resource visibility is safe |
| `SCOPE` | scope mismatch collapses to generic unavailable when unsafe |
| `ENT` | feature unavailable without plan or hidden-resource leak |
| `USAGE` | usage unavailable without values, costs, or provider detail |
| `HIDDEN` | hidden existing and nonexistent equivalent |
| `AUDIT` | denied audit/evidence without hidden counts |
| `CHANNEL` | channel ambiguity without raw LINE identity |
| `PROVIDER` | provider unavailable without provider diagnostics |
| `STATE` | conflict only for visible resource |
| `EXCL` | first-release exclusion does not imply runtime support exists |

## Mock-Only vs Future DB-Backed Assertion Suitability

| Assertion area | Mock-only now? | Future disposable DB useful? | Notes |
| --- | --- | --- | --- |
| response shape | yes | maybe | DB not needed for first pass |
| error category mapping | yes | maybe | DB useful only after routes exist |
| hidden vs missing equivalence | yes | yes | DB useful for real query parity |
| organization / tenant scope | yes | yes | DB useful for repository enforcement |
| branch/team scope | yes | yes if implemented | placeholder now |
| entitlement unavailable | yes | maybe | depends on future entitlement storage |
| usage / export limit | yes | maybe | usage metering future-only |
| Admin empty state | yes | no initially | Admin implementation future-only |
| no-send provider behavior | no until runtime exists | no provider calls | future integration-only |
| stale/concurrent conflict | partial | yes | needs persistence / transaction strategy |
| diagnostics redaction | yes | maybe | logs/artifacts future-only |

Task210 does not authorize DB-backed assertions.

## Fixture Strategy Alignment with Task208

Future assertions should use Task208 placeholder fixture labels only after fixture implementation is approved.

Before implementation, labels such as `tenant_alpha`, `org_alpha_main`, `risk_visible_active`, `risk_hidden_same_org`, and `risk_out_of_scope` remain conceptual examples. They must not be confused with real tenant, organization, customer, channel, or production data.

## Mock-vs-DB Strategy Alignment with Task209

Task210 follows Task209's layered strategy:

1. mock-only assertions first,
2. disposable local/test DB assertions only after explicit approval,
3. no-send/no-provider integration assertions only after runtime exists,
4. shared runtime remains prohibited for unsafe enumeration fixture mutation or probing.

## Admin Empty-State and API Error Mapping Alignment

Future assertions should verify Admin/API consistency:

- API `generic_unavailable` maps to Admin generic unavailable state,
- API `feature_unavailable_safe` maps to Admin feature disabled state,
- API `permission_denied_safe` maps to action disabled / permission unavailable state,
- API `channel_unavailable_safe` maps to channel unavailable state,
- API `ai_unavailable_safe` maps to AI unavailable with manual workflow available,
- hidden and nonexistent resources produce the same safe Admin category when visibility is unsafe.

No Admin code or API behavior changes are made in Task210.

## Channel-Agnostic and LINE-Safe Boundaries

Future assertions must:

- treat LINE as one channel, not the core identity model,
- avoid raw LINE identity values,
- avoid LINE access token and channel secret values,
- avoid assuming every Case was created through LINE,
- allow future APP / SMS / email / manual follow-up channels,
- verify that channel unavailable states do not reveal binding status when unsafe.

## Alignment with Task173-Task205

Task210 preserves the SLA / operations risk documentation sequence:

- Task173 through Task180 define operations risk lifecycle and human action controls,
- Task181 through Task184 define permission, Admin, and API contract direction,
- Task185 defines runtime readiness gating,
- Task186 through Task191 define first-release scope and non-leakage policy,
- Task192 through Task195 define resource enumeration testing and redaction policy,
- Task196 through Task205 define API/Admin response shape, entitlement UX, feature gates, and empty-state mapping.

Task210 does not supersede those documents; it narrows future assertion design.

## Implementation Blockers and Required Approvals

Before assertion implementation, future tasks must approve:

1. test framework and test file location,
2. whether assertions are mock-only, DB-backed, or hybrid,
3. fixture implementation strategy,
4. localization strategy if message keys become executable,
5. API route and response implementation if API tests are created,
6. Admin test approach if UI assertions are created,
7. redaction assertion helper,
8. no-send / no-provider enforcement,
9. DB approval packet if any disposable DB is used,
10. QA artifact storage and redaction policy.

## Future Task Candidates

Possible next docs-only tasks:

- resource enumeration assertion naming convention,
- mock-only response equivalence test design,
- message key assertion family decision packet,
- diagnostic redaction assertion helper design,
- disposable DB assertion approval packet,
- no-send integration assertion design,
- Admin empty-state assertion readiness gate.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task210 should be considered valid only if:

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
