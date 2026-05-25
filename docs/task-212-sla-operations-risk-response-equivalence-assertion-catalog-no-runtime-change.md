# Task 212 - SLA / Operations Risk Response Equivalence Assertion Catalog / No Runtime Change

## Purpose and Non-Goals

Task212 defines a documentation-only response equivalence assertion catalog for future SLA / operations risk resource enumeration tests.

This catalog describes which future scenarios must produce equivalent safe API, Admin, diagnostic, or QA artifact behavior; which differences are allowed; and which differences are forbidden. It does not create tests, fixtures, DB usage, runtime behavior, API behavior, Admin UI, localization files, smoke coverage, or provider integrations.

Task212 does not:

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

Task212 preserves:

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

Task212 assumes:

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

## Response Equivalence Catalog Principles

Future response equivalence assertions should:

1. protect resource existence when visibility is unsafe,
2. compare safe response families rather than exact hidden details,
3. keep API, Admin, diagnostics, and QA artifacts aligned,
4. use placeholder assertion names from Task211,
5. use Task206 response families and Task207 scenario groups,
6. avoid production translation strings,
7. avoid raw customer, tenant, organization, channel, provider, or diagnostic data,
8. allow explicit permission errors only when visibility is safe,
9. allow conflict states only for visible resources,
10. remain future-only until implementation is approved.

## Catalog Field Definitions

| Field | Meaning |
| --- | --- |
| Assertion name | Proposal-only name aligned with Task211 |
| Scenario group | Task207 scenario group |
| Equivalence group | Safe response equivalence family |
| Surface | API, Admin, diagnostics, QA artifact, provider/no-send, or AI |
| Required equivalent behavior | Behavior that must look the same |
| Allowed differences | Differences that may remain safe |
| Forbidden differences | Differences that would leak or confuse |
| Message/error family | Placeholder `messageKey` or error category |
| Admin category | Placeholder Admin empty/disabled state |
| Diagnostic rule | Redaction expectation |
| Pass/fail description | Future test interpretation |

## Equivalence Group Overview

| Equivalence group | Purpose |
| --- | --- |
| `hidden_missing_equivalent` | hidden existing and nonexistent resources are indistinguishable when visibility is unsafe |
| `scope_missing_equivalent` | out-of-scope and nonexistent resources are indistinguishable when visibility is unsafe |
| `feature_unavailable_safe` | unavailable feature does not expose hidden resource or plan internals |
| `permission_denied_safe` | explicit deny appears only when resource visibility is safe |
| `usage_limited_safe` | usage/export/AI limit does not expose usage, cost, or provider detail |
| `channel_unavailable_safe` | channel ambiguity does not expose raw channel identity or binding state |
| `provider_unavailable_safe` | provider readiness is unavailable without raw provider diagnostic |
| `ai_unavailable_safe` | AI unavailable/advisory state is non-authoritative |
| `conflict_visible_only` | stale/duplicate/resolved conflict appears only for visible resources |
| `diagnostic_redacted` | diagnostics and artifacts contain only safe categories |

## API Response Equivalence Assertions

| Assertion name | Scenario group | Required equivalent behavior | Allowed differences | Forbidden differences |
| --- | --- | --- | --- | --- |
| `assert.api.hidden.safe_deny.hidden_missing_equivalent` | `hidden` | hidden existing and nonexistent resource return same safe family | safe request reference may differ | existence hint, hidden ID, hidden count |
| `assert.api.scope.safe_deny.scope_missing_equivalent` | `scope` | out-of-organization and nonexistent resource return same safe family | generic request timing variation | organization label, tenant label, ownership hint |
| `assert.api.scope.branch.safe_deny.scope_missing_equivalent` | `scope` | branch/team mismatch and nonexistent resource remain equivalent when visibility is unsafe | safe category label | branch/team assignment hint |
| `assert.api.audit.safe_deny.hidden_missing_equivalent` | `audit` | hidden audit/evidence and unavailable audit/evidence do not reveal count or existence | safe disabled reason family | audit count, evidence reference |
| `assert.api.ent.safe_deny.feature_unavailable_safe` | `ent` | entitlement missing does not reveal hidden resources | safe feature unavailable category | plan internals, hidden entitlement status |
| `assert.api.perm.safe_deny.permission_denied_safe` | `perm` | permission failure uses explicit deny only when resource is visible | safe role/action family | hidden role hierarchy, hidden item hint |
| `assert.api.channel.safe_deny.channel_unavailable_safe` | `channel` | channel ambiguity and unavailable channel return safe family | safe channel category | raw LINE identity, binding existence |
| `assert.api.provider.safe_deny.provider_unavailable_safe` | `provider` | provider unavailable does not reveal provider configuration | safe provider category | provider account, provider raw error |
| `assert.api.ai.unavailable.ai_unavailable_safe` | `usage` | AI unavailable returns advisory/manual fallback | safe AI category | prompt, model output, cost, authoritative action |

## Admin Empty-State Equivalence Assertions

| Assertion name | Scenario group | Required equivalent behavior | Allowed differences | Forbidden differences |
| --- | --- | --- | --- | --- |
| `assert.admin.hidden.empty_state.hidden_missing_equivalent` | `hidden` | hidden and nonexistent resource show same generic unavailable state | safe request retry copy family | hidden resource name or count |
| `assert.admin.scope.empty_state.scope_missing_equivalent` | `scope` | wrong organization/tenant and nonexistent resource show same unavailable state | safe generic label | organization/tenant name |
| `assert.admin.ent.empty_state.feature_unavailable_safe` | `ent` | disabled feature shows feature unavailable without hidden data | safe contact-admin category | plan/pricing or hidden feature detail |
| `assert.admin.perm.disabled_state.permission_denied_safe` | `perm` | visible item with missing action permission shows safe disabled action | action category | hidden role hierarchy |
| `assert.admin.channel.empty_state.channel_unavailable_safe` | `channel` | channel unavailable does not reveal binding state | safe channel setup category | raw channel identity or binding status |
| `assert.admin.ai.empty_state.ai_unavailable_safe` | `usage` | AI unavailable still allows deterministic manual workflow | safe AI unavailable category | provider/cost/prompt detail |

## Error Code / MessageKey Family Equivalence Assertions

| Assertion name | Related family | Required behavior |
| --- | --- | --- |
| `assert.message_key.hidden.family.hidden_missing_equivalent` | `risk.unavailable.generic` | hidden and missing use same safe family when visibility is unsafe |
| `assert.message_key.scope.family.scope_missing_equivalent` | `risk.unavailable.generic` | scope mismatch and missing use same safe family when visibility is unsafe |
| `assert.message_key.perm.family.permission_denied_safe` | `risk.permission.denied.safe` | explicit permission family appears only when resource is visible |
| `assert.message_key.ent.family.feature_unavailable_safe` | `risk.feature.unavailable.safe` | feature unavailable family contains no plan internals |
| `assert.message_key.channel.family.channel_unavailable_safe` | `risk.channel.unavailable.safe` | channel family contains no raw LINE identity |
| `assert.message_key.provider.family.provider_unavailable_safe` | `risk.provider.unavailable.safe` | provider family contains no raw provider detail |
| `assert.message_key.ai.family.ai_unavailable_safe` | `risk.ai.unavailable.safe` | AI family stays advisory |

Task212 does not create localization files or production translation strings.

## Diagnostic / Log Redaction Equivalence Assertions

| Assertion name | Surface | Required equivalent behavior | Forbidden differences |
| --- | --- | --- | --- |
| `assert.diagnostic.hidden.redacted.diagnostic_redacted` | diagnostics | hidden and missing diagnostics use same safe category | hidden ID, hidden count, internal payload |
| `assert.diagnostic.scope.redacted.diagnostic_redacted` | diagnostics | scope mismatch diagnostic does not reveal owner | tenant/org/branch/team label |
| `assert.diagnostic.provider.redacted.provider_unavailable_safe` | diagnostics | provider unavailable diagnostic is safe category only | provider raw error, credential, account |
| `assert.diagnostic.db.redacted.diagnostic_redacted` | diagnostics | DB-related failure does not expose implementation detail | SQL error, constraint name, stack trace |
| `assert.diagnostic.usage.redacted.usage_limited_safe` | diagnostics | usage/limit diagnostic does not expose values | usage value, cost, pricing detail |

## QA Artifact Equivalence Assertions

| Assertion name | Artifact surface | Required behavior |
| --- | --- | --- |
| `assert.qa_artifact.hidden.redacted.hidden_missing_equivalent` | screenshot / log / summary | hidden and missing artifacts reveal no different resource detail |
| `assert.qa_artifact.scope.redacted.scope_missing_equivalent` | screenshot / log / summary | out-of-scope artifacts reveal no owner or internal route |
| `assert.qa_artifact.channel.redacted.channel_unavailable_safe` | screenshot / log / summary | channel artifacts reveal no raw LINE identity |
| `assert.qa_artifact.provider.redacted.provider_unavailable_safe` | screenshot / log / summary | provider artifacts reveal no provider detail |
| `assert.qa_artifact.ai.redacted.ai_unavailable_safe` | screenshot / log / summary | AI artifacts reveal no prompt, output, or provider cost |

Task212 does not create QA scripts, screenshots, logs, or artifacts.

## No-Send / No-Provider Equivalence Assertions

| Assertion name | Required equivalent behavior | Forbidden differences |
| --- | --- | --- |
| `assert.provider.no_send.no_delivery.provider_unavailable_safe` | no-send mode does not call LINE / APP / SMS / email provider | provider request id, credential, delivery attempt |
| `assert.provider.no_send.channel_unavailable.channel_unavailable_safe` | channel unavailable and no-send remain safe Admin/API categories | raw channel identity, binding status |
| `assert.provider.no_send.survey_paused.provider_unavailable_safe` | survey runtime paused does not deliver anything | survey delivery attempt, provider payload |

These assertions are future-only and require runtime/no-send approval before implementation.

## AI Advisory Boundary Equivalence Assertions

| Assertion name | Required equivalent behavior | Forbidden differences |
| --- | --- | --- |
| `assert.ai.unavailable.advisory.ai_unavailable_safe` | AI unavailable keeps manual workflow available | provider detail, prompt, model output |
| `assert.ai.suggestion.not_authoritative.ai_unavailable_safe` | AI suggestion never becomes official action by assertion name | dispatch/complete/settle/approve action |
| `assert.ai.risk_flag.manual_review.ai_unavailable_safe` | AI risk flag requires human review | auto escalation, suppression, closure |

## Allowed Differences

Allowed differences may include:

- opaque request reference generated per request,
- generic timestamp in safe logs if it does not reveal hidden state,
- safe correlation category,
- localized copy family after localization is approved,
- visible-resource conflict detail when the user is authorized to see the item,
- explicit 403 category when item visibility is already safe,
- normal success data for valid in-scope access.

Allowed differences must not identify hidden resources or reveal internal diagnostics.

## Forbidden Differences

Forbidden differences include:

- existence hints,
- hidden resource IDs,
- hidden counts,
- tenant or organization labels,
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

## Assertion Naming Alignment with Task211

Task212 uses the Task211 pattern:

```text
assert.<surface>.<scenario_group>.<property>.<expected_safety_category>
```

Names remain proposal-only and do not create executable tests.

## Assertion Strategy Alignment with Task210

Task212 expands Task210 categories into a catalog. It preserves:

- API response equivalence,
- API error allow-list safety,
- response shape and metadata safety,
- message key family safety,
- Admin empty-state equivalence,
- disabled-state copy equivalence,
- generic safe-deny and 403 vs 404 guidance,
- diagnostic and QA artifact redaction,
- no-send / no-provider behavior,
- AI advisory-only behavior.

## Expected Response Matrix Alignment with Task206

The catalog aligns with Task206 expected response families:

- success with safe allow-listed fields,
- generic unavailable,
- permission denied safe,
- feature unavailable safe,
- usage limited safe,
- channel unavailable safe,
- provider unavailable safe,
- conflict visible only,
- AI unavailable safe.

## Test Case Catalog Alignment with Task207

Task212 maps Task207 scenario groups into future assertion rows. It does not convert Task207 IDs into executable tests.

Future implementation may choose to reference Task207 IDs alongside assertion names for traceability.

## Fixture and Mock-vs-DB Strategy Alignment

Task212 assumes:

- Task208 fixture labels remain placeholders,
- Task209 mock-only-first strategy remains preferred for early assertion implementation,
- DB-backed equivalence assertions require explicit disposable local/test DB approval,
- shared Zeabur runtime remains prohibited for unsafe enumeration fixture mutation or probing.

## Channel-Agnostic and LINE-Safe Boundaries

Channel assertions must:

- treat LINE as one possible channel,
- not hard-code LINE as the only customer entry point,
- avoid raw LINE identity values,
- avoid access token and channel secret values,
- allow future APP / SMS / email / manual follow-up channels,
- avoid revealing binding status when unsafe.

## Implementation Blockers and Required Approvals

Before implementing this catalog as executable tests, future tasks must approve:

1. test framework,
2. test file location,
3. fixture strategy,
4. assertion helper design,
5. localization approach if message key assertions become executable,
6. Admin test approach if Admin assertions are created,
7. DB strategy if any disposable DB is used,
8. no-send / no-provider enforcement,
9. redaction review for test output and QA artifacts.

## Future Task Candidates

Possible next docs-only tasks:

- safe-deny assertion table,
- message key assertion family decision packet,
- diagnostic redaction assertion helper design,
- Admin empty-state assertion readiness gate,
- disposable DB assertion approval packet,
- no-send integration assertion design.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task212 should be considered valid only if:

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
