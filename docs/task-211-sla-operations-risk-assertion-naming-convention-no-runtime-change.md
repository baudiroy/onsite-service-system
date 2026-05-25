# Task 211 - SLA / Operations Risk Assertion Naming Convention / No Runtime Change

## Purpose and Non-Goals

Task211 defines a documentation-only assertion naming convention for future SLA / operations risk resource enumeration assertions.

The naming convention is proposal-only. It helps future tests stay readable, traceable, and safe without exposing hidden resource existence, tenant identifiers, customer data, raw channel values, provider details, diagnostics, or production copy.

Task211 does not:

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

Task211 preserves:

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

Task211 assumes:

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

## Assertion Naming Principles

Future assertion names should:

1. describe the safety property being asserted,
2. use placeholder scenario labels rather than real identifiers,
3. make response equivalence groups readable,
4. align with Task207 test case groups,
5. align with Task210 assertion categories,
6. avoid raw resource IDs, channel IDs, customer data, provider values, and diagnostics,
7. avoid production translation strings,
8. avoid implying runtime implementation exists,
9. avoid implying DB-backed tests are approved,
10. keep AI advisory-only.

## Naming Pattern Overview

Recommended naming pattern:

```text
assert.<surface>.<scenario_group>.<property>.<expected_safety_category>
```

Examples:

```text
assert.api.scope.safe_deny.generic_unavailable
assert.admin.hidden.empty_state.generic_unavailable
assert.response.hidden_missing.equivalent.no_identifier_leak
assert.diagnostic.provider.redacted.no_raw_provider_detail
assert.ai.unavailable.advisory.manual_fallback
```

These are proposal-only names and do not create test files.

## Assertion Category Prefixes

| Prefix | Assertion category |
| --- | --- |
| `assert.api` | API status, error, response shape, and metadata behavior |
| `assert.response` | response equivalence and allow-listed fields |
| `assert.message_key` | placeholder message key family behavior |
| `assert.admin` | Admin empty-state or disabled-state category |
| `assert.copy` | copy category, not production text |
| `assert.safe_deny` | generic unavailable / hidden-vs-missing equivalence |
| `assert.permission` | permission denial behavior when visibility is safe |
| `assert.entitlement` | feature gate / entitlement unavailable behavior |
| `assert.usage` | usage limit unavailable behavior without values |
| `assert.channel` | channel ambiguity and LINE-safe behavior |
| `assert.provider` | no-send / no-provider behavior |
| `assert.diagnostic` | log and diagnostic redaction behavior |
| `assert.qa_artifact` | screenshot, log, and test artifact redaction behavior |
| `assert.ai` | AI advisory-only behavior |

## Scenario Group Labels

Use Task207 scenario group labels:

| Label | Meaning |
| --- | --- |
| `base` | valid in-scope baseline |
| `perm` | permission failure |
| `scope` | organization / tenant / branch / team mismatch |
| `ent` | entitlement / feature gate failure |
| `usage` | usage / export / AI add-on limits |
| `hidden` | hidden or not visible resource |
| `audit` | audit / evidence access denial |
| `channel` | channel identity or LINE binding ambiguity |
| `provider` | provider / channel readiness |
| `state` | stale / concurrent / duplicate / suppressed state |
| `excl` | first-release exclusion / no-send mode |

Do not use real organization, tenant, branch, team, customer, Case, appointment, report, or channel names as group labels.

## Response Equivalence Group Labels

Recommended equivalence labels:

| Label | Meaning |
| --- | --- |
| `hidden_missing_equivalent` | hidden existing and nonexistent look the same when visibility is unsafe |
| `scope_missing_equivalent` | out-of-scope and nonexistent look the same when visibility is unsafe |
| `feature_unavailable_safe` | feature unavailable without hidden resource or plan leak |
| `permission_denied_safe` | explicit permission denial only when resource visibility is safe |
| `usage_limited_safe` | usage unavailable without usage value or pricing leak |
| `channel_unavailable_safe` | channel unavailable without raw channel or binding leak |
| `provider_unavailable_safe` | provider unavailable without provider diagnostics |
| `ai_unavailable_safe` | AI unavailable without provider, prompt, cost, or raw output leak |
| `conflict_visible_only` | stale / duplicate / resolved conflict only when the resource is visible |
| `diagnostic_redacted` | diagnostic output contains no sensitive or internal detail |

## Placeholder-Safe Examples

Acceptable placeholder-style assertion names:

```text
assert.api.scope.safe_deny.scope_missing_equivalent
assert.api.hidden.safe_deny.hidden_missing_equivalent
assert.response.hidden.no_hidden_counts.diagnostic_redacted
assert.message_key.ent.family.feature_unavailable_safe
assert.admin.ent.empty_state.feature_unavailable_safe
assert.copy.perm.disabled_state.permission_denied_safe
assert.channel.channel.no_raw_identity.channel_unavailable_safe
assert.provider.provider.no_send.provider_unavailable_safe
assert.ai.usage.unavailable.ai_unavailable_safe
assert.qa_artifact.hidden.redacted.diagnostic_redacted
```

These names use placeholders and safety categories only.

## Forbidden Naming Patterns

Future assertion names must not include:

- real customer names,
- real customer contact values,
- real tenant names,
- real organization names,
- raw LINE user id values,
- raw channel identifiers,
- raw payload labels that point to stored payloads,
- actual token or secret names,
- provider account names,
- provider raw error names,
- internal diagnostic object names,
- SQL table/constraint names when they reveal implementation detail,
- stack trace fragments,
- plan pricing,
- usage counts,
- AI token counts,
- production translation text.

Forbidden examples:

```text
assert.api.org_actual_name.case_actual_id.hidden
assert.channel.line_user_actual_value.binding_exists
assert.provider.raw_error_actual_value.retry
assert.diagnostic.sql_constraint_actual_name.exposed
assert.usage.actual_count.limit_reached
assert.copy.production_sentence.matches_exactly
```

## Sensitive-Data and Diagnostic Naming Boundaries

Assertion names should use categories such as:

- `redacted`,
- `safe_deny`,
- `generic_unavailable`,
- `no_identifier_leak`,
- `no_hidden_count`,
- `no_raw_provider_detail`,
- `no_raw_channel_identity`,
- `no_customer_contact`,
- `no_stack_trace`,
- `no_sql_detail`,
- `no_usage_value`,
- `no_pricing_detail`.

Names should not repeat the sensitive value being protected.

## Alignment with Task207 Test Case Catalog

Task207 test case IDs can be referenced as planning labels:

```text
RISK-ENUM-SCOPE-001 -> assert.api.scope.safe_deny.scope_missing_equivalent
RISK-ENUM-HIDDEN-001 -> assert.api.hidden.safe_deny.hidden_missing_equivalent
RISK-ENUM-CHANNEL-001 -> assert.channel.channel.no_raw_identity.channel_unavailable_safe
RISK-ENUM-PROVIDER-001 -> assert.provider.provider.no_send.provider_unavailable_safe
```

Task211 does not create executable tests for these IDs.

## Alignment with Task210 Assertion Strategy

Task211 naming prefixes map to Task210 assertion categories:

| Task210 category | Naming prefix |
| --- | --- |
| API response equivalence | `assert.api`, `assert.response` |
| API error code allow-list | `assert.api` |
| response shape and metadata safety | `assert.response` |
| message key / localization family | `assert.message_key` |
| Admin empty-state equivalence | `assert.admin` |
| disabled-state copy | `assert.copy` |
| generic safe-deny / 403 vs 404 | `assert.safe_deny` |
| diagnostic / log redaction | `assert.diagnostic` |
| QA artifact redaction | `assert.qa_artifact` |
| no-send / no-provider | `assert.provider` |
| AI advisory boundary | `assert.ai` |

## Alignment with Task206 Expected Response Matrix

Assertion names should remain tied to Task206 expected response families:

- success with safe allow-listed fields,
- generic unavailable,
- permission denied safe,
- feature unavailable safe,
- usage limited safe,
- channel unavailable safe,
- provider unavailable safe,
- conflict visible only,
- AI unavailable safe.

Names should not encode hidden data or alternate messages for hidden vs nonexistent resources.

## Channel-Agnostic and LINE-Safe Boundaries

Channel-related assertion names should:

- use `channel` as the general category,
- use `line` only when the assertion is explicitly about LINE-safe non-leakage,
- avoid raw LINE identity values,
- avoid access token and channel secret wording as values,
- avoid assuming LINE is the only customer entry point,
- leave room for APP / SMS / email / manual follow-up channels.

Examples:

```text
assert.channel.channel.no_raw_identity.channel_unavailable_safe
assert.channel.line.no_binding_leak.channel_unavailable_safe
assert.admin.channel.empty_state.channel_unavailable_safe
```

## AI Advisory-Only Boundary

AI assertion names should make advisory status explicit:

```text
assert.ai.unavailable.advisory.manual_fallback
assert.ai.suggestion.not_authoritative.no_workflow_action
assert.ai.risk_flag.manual_review_required
```

AI assertion names must not imply AI can dispatch, complete, settle, approve, suppress, close, send, or override official workflow decisions.

## Implementation Blockers and Required Approvals

Before naming becomes executable tests, future tasks must approve:

1. test framework and naming style,
2. test file location,
3. whether test names use full dotted names or helper labels,
4. localization approach if message key assertions become executable,
5. fixture implementation strategy,
6. redaction assertion helper,
7. DB strategy if any,
8. no-send / no-provider enforcement,
9. review of naming against security and privacy policy.

## Future Task Candidates

Possible next docs-only tasks:

- response equivalence assertion catalog,
- message key assertion family decision packet,
- safe denial assertion table,
- diagnostic redaction assertion helper design,
- Admin empty-state assertion readiness gate,
- disposable DB assertion approval packet.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task211 should be considered valid only if:

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
