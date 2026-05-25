# Task 214 - SLA / Operations Risk MessageKey Assertion Family Decision Packet / No Runtime Change

## Purpose and Non-Goals

Task214 defines a documentation-only MessageKey assertion family decision packet for future SLA / operations risk resource enumeration tests.

The packet defines proposal-only message key families that may be asserted in future tests, when they must collapse to generic non-leaking families, when they may be explicit, and which patterns are forbidden. It does not create localization files, executable tests, API behavior, Admin UI, runtime behavior, DB usage, provider sending, or survey runtime.

Task214 does not:

- create or modify localization files,
- create or modify test files,
- create or modify fixture files,
- create or modify smoke tests or automated tests,
- create or modify QA scripts,
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

Task214 preserves:

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

Task214 assumes:

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

## MessageKey Assertion Family Principles

Future message key assertions should:

1. assert safe key families, not production translation strings,
2. collapse hidden, out-of-scope, and nonexistent resources to generic key families when visibility is unsafe,
3. allow explicit key families only when resource existence is already authorized,
4. avoid tenant, organization, branch, team, customer, Case, appointment, report, audit, evidence, channel, provider, and diagnostic details,
5. avoid plan, pricing, usage, and AI cost detail,
6. align Admin empty states with API error families,
7. keep LINE as a channel, not the core identity model,
8. keep AI advisory-only,
9. remain proposal-only until localization and test implementation are approved.

## MessageKey Family Field Definitions

| Field | Meaning |
| --- | --- |
| Family name | Proposal-only message key family |
| API error family | Related API category |
| Admin category | Related Admin empty/disabled state |
| Safe-deny category | Related Task213 category |
| Allowed scenario groups | Scenarios where the family may appear |
| Collapse-required groups | Scenarios where a generic family is required |
| Forbidden scenario groups | Scenarios where the family would leak |
| Allowed specificity | How specific the key may be |
| Forbidden specificity | Details that must not appear |
| Enumeration risk | Resource enumeration risk level |
| Pass/fail criteria | Future assertion interpretation |

## Family Specificity Levels

| Level | Meaning | Current recommendation |
| --- | --- | --- |
| `generic` | does not reveal resource type, owner, binding, provider, or internal reason | required for unsafe visibility |
| `surface_safe` | names a visible feature surface but not hidden resource detail | allowed when surface visibility is safe |
| `action_safe` | names a visible action failure but not hidden resource detail | allowed when item visibility is safe |
| `state_safe` | names visible workflow conflict state | allowed only for visible resources |
| `internal` | exposes implementation, provider, DB, diagnostic, or hidden state | forbidden |

## Generic Safe-Deny MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.unavailable.generic` |
| API error family | `generic_unavailable` |
| Admin category | generic unavailable |
| Safe-deny category | `hidden_missing_equivalent`, `scope_missing_equivalent` |
| Allowed scenario groups | hidden, nonexistent, unsafe scope, unsafe permission, unsafe channel |
| Collapse-required groups | hidden resource, out-of-scope resource, nonexistent resource |
| Forbidden specificity | resource type, owner, count, binding, provider, internal reason |
| Pass/fail | hidden, out-of-scope, and nonexistent unsafe cases share this family |

## Permission MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.permission.denied.safe` |
| API error family | `permission_denied_safe` |
| Admin category | action disabled / permission unavailable |
| Safe-deny category | explicit denial only when visible |
| Allowed scenario groups | visible resource with missing action/evidence/audit permission |
| Collapse-required groups | hidden resource, unsafe visibility |
| Forbidden specificity | hidden role hierarchy, hidden evidence/audit count |
| Pass/fail | explicit permission key appears only after existence is authorized |

If visibility is unsafe, use `risk.unavailable.generic`.

## Organization / Tenant Scope MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.unavailable.generic` by default |
| API error family | `generic_unavailable` |
| Admin category | generic unavailable |
| Safe-deny category | `scope_missing_equivalent` |
| Allowed scenario groups | organization / tenant / branch / team mismatch |
| Collapse-required groups | all unsafe scope mismatch cases |
| Forbidden specificity | organization, tenant, branch, team mismatch reason |
| Pass/fail | scope mismatch and nonexistent share safe family |

Task214 does not recommend a separate current `risk.scope.*` family for unsafe scope mismatch. If future tenant-admin surfaces need explicit scope copy, that requires a separate approval.

## Entitlement / Feature Gate MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.feature.unavailable.safe` |
| API error family | `feature_unavailable_safe` |
| Admin category | feature unavailable / disabled until approval |
| Safe-deny category | `feature_unavailable_safe` |
| Allowed scenario groups | visible feature surface with missing/disabled entitlement |
| Collapse-required groups | hidden resource behind missing entitlement |
| Forbidden specificity | plan internals, pricing, hidden feature state |
| Pass/fail | visible surface can show feature unavailable; hidden resource collapses generic |

Feature availability does not replace RBAC checks.

## Usage / Export / AI Add-On MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.usage.limited.safe` or `risk.ai.unavailable.safe` |
| API error family | `usage_limited_safe`, `ai_unavailable_safe` |
| Admin category | limited / AI unavailable |
| Safe-deny category | usage or AI unavailable without values |
| Allowed scenario groups | visible usage/export/AI surface |
| Collapse-required groups | hidden resource or unsafe feature visibility |
| Forbidden specificity | usage values, pricing, AI token counts, provider cost |
| Pass/fail | no numeric usage, cost, pricing, prompt, model output, or provider detail |

AI add-on unavailability must not block deterministic non-AI workflow.

## Hidden Resource / Not Available MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.unavailable.generic` |
| API error family | `generic_unavailable` |
| Admin category | generic unavailable |
| Safe-deny category | `hidden_missing_equivalent` |
| Allowed scenario groups | hidden, missing, uncertain visibility |
| Collapse-required groups | hidden vs nonexistent equivalence |
| Forbidden specificity | resource type, status, count, final marker, workflow state |
| Pass/fail | hidden and missing cases use same family |

## Audit / Evidence MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.audit.unavailable.safe` or `risk.evidence.unavailable.safe` |
| API error family | `audit_evidence_unavailable_safe` |
| Admin category | audit/evidence unavailable |
| Safe-deny category | audit/evidence safe-deny |
| Allowed scenario groups | visible item with audit/evidence panel unavailable |
| Collapse-required groups | hidden item, hidden audit/evidence |
| Forbidden specificity | audit count, evidence count, evidence reference, actor detail |
| Pass/fail | explicit audit/evidence family only when parent item visibility is safe |

If the parent item is hidden, use `risk.unavailable.generic`.

## Channel / Provider / LINE Binding MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.channel.unavailable.safe` or `risk.provider.unavailable.safe` |
| API error family | `channel_unavailable_safe`, `provider_unavailable_safe` |
| Admin category | channel/provider unavailable |
| Safe-deny category | channel/provider safe-deny |
| Allowed scenario groups | visible channel surface, provider readiness surface, no-send mode |
| Collapse-required groups | hidden channel identity, unsafe LINE binding, hidden Case/channel link |
| Forbidden specificity | raw LINE identity, binding exists/does-not-exist, provider config, provider raw error |
| Pass/fail | no raw channel id, no binding leak, no provider diagnostic |

LINE-specific key families should be avoided unless the assertion is specifically about LINE-safe non-leakage.

## Workflow-State MessageKey Family

| Field | Decision |
| --- | --- |
| Family name | `risk.state.conflict.safe` |
| API error family | `conflict_visible_only` |
| Admin category | visible conflict / stale state |
| Safe-deny category | visible conflict only |
| Allowed scenario groups | visible stale, concurrent, duplicate, suppressed, already resolved |
| Collapse-required groups | hidden resource state |
| Forbidden specificity | hidden workflow state, hidden timestamp, hidden actor |
| Pass/fail | conflict key appears only when resource visibility is safe |

## Collapse-to-Generic Decision Matrix

| Scenario | Required family |
| --- | --- |
| hidden existing resource | `risk.unavailable.generic` |
| nonexistent resource | `risk.unavailable.generic` |
| organization mismatch with unsafe visibility | `risk.unavailable.generic` |
| tenant mismatch with unsafe visibility | `risk.unavailable.generic` |
| branch/team mismatch with unsafe visibility | `risk.unavailable.generic` |
| permission missing and resource hidden | `risk.unavailable.generic` |
| entitlement missing and resource hidden | `risk.unavailable.generic` |
| hidden audit/evidence | `risk.unavailable.generic` |
| hidden LINE binding state | `risk.unavailable.generic` or `risk.channel.unavailable.safe` only if surface is safe |
| hidden provider configuration | `risk.provider.unavailable.safe` only if provider surface is safe; otherwise generic |

## Explicit MessageKey Allowed Cases

Explicit families may be used when:

- the resource is visible,
- the user is authorized to know the resource exists,
- the feature surface is visible,
- the denial is about an action rather than hidden resource existence,
- the state conflict is visible,
- the channel/provider surface is visible and the key remains safe.

Explicit families must still avoid sensitive details and internal diagnostics.

## Forbidden MessageKey Patterns

Future message key families must not include:

- resource IDs,
- tenant names,
- organization names,
- branch/team labels,
- customer contact values,
- raw LINE user id,
- raw channel identifiers,
- binding existence state,
- provider account/config names,
- provider raw errors,
- audit/evidence counts,
- internal diagnostic object names,
- SQL table/constraint names,
- stack trace fragments,
- plan/pricing details,
- usage values,
- AI token counts,
- production translation text.

Forbidden patterns:

```text
risk.scope.belongs_to_other_org
risk.tenant.actual_name.denied
risk.line.actual_user_bound
risk.provider.actual_config_missing
risk.audit.actual_count_hidden
risk.db.actual_constraint_failed
risk.usage.actual_limit_value
risk.ai.actual_token_count
```

## Assertion Naming Alignment with Task211

Task214 message key assertions should use Task211 naming style:

```text
assert.message_key.<scenario_group>.family.<expected_safety_category>
```

Examples:

```text
assert.message_key.hidden.family.hidden_missing_equivalent
assert.message_key.scope.family.scope_missing_equivalent
assert.message_key.perm.family.permission_denied_safe
assert.message_key.ent.family.feature_unavailable_safe
assert.message_key.channel.family.channel_unavailable_safe
assert.message_key.provider.family.provider_unavailable_safe
assert.message_key.ai.family.ai_unavailable_safe
```

## Assertion Strategy Alignment with Task210

Task214 supports Task210 by defining which placeholder message key families are safe to assert.

The assertion target is the safe family, not exact production copy.

## Response Equivalence Alignment with Task212

Task214 supports Task212 equivalence groups:

- hidden and missing resources share generic message key family,
- out-of-scope and missing resources share generic message key family,
- explicit permission keys are used only for visible resources,
- channel/provider/AI keys remain safe and non-authoritative.

## Safe-Deny Alignment with Task213

Task214 narrows safe-deny message behavior:

- unsafe visibility collapses to generic,
- visible permission failures may be explicit,
- visible feature surfaces may be feature-unavailable,
- hidden resource details must not appear in message keys,
- Admin categories must not leak beyond API categories.

## Localization Key Alignment with Task202

Task202 provides future localization key direction. Task214 does not create localization files.

If localization files are implemented later, they should:

- use safe family keys from this packet,
- avoid production copy in test names,
- avoid resource-specific keys for hidden resources,
- avoid LINE-specific keys unless the visible surface is explicitly LINE-related and safe,
- keep AI unavailable copy advisory-only.

## Channel-Agnostic and LINE-Safe Boundaries

Message key families must:

- treat LINE as one possible channel,
- avoid raw LINE identity values,
- avoid LINE access token and channel secret values,
- avoid implying LINE is the only customer entry point,
- support future APP / SMS / email / manual follow-up channels,
- avoid revealing binding status when unsafe.

## AI Advisory-Only Boundary

AI message key families must:

- describe AI as unavailable, advisory, or requiring manual review,
- not imply AI can decide, approve, send, suppress, close, dispatch, complete, settle, or override,
- not expose prompts, model output, provider detail, pricing, or usage.

## Alignment with Task173-Task213

Task214 stays within the docs-only SLA / operations risk branch and aligns with:

- operations risk lifecycle and escalation design,
- permission and organization scope review,
- API error allow-list and response shape drafts,
- non-leakage and resource enumeration planning,
- feature gate and Admin empty-state design,
- mock-vs-DB and assertion strategy documents,
- response equivalence and safe-deny assertion catalogs.

## Post-Task214 Continuation Summary Requirement

Task214 is the final task in the current PM conversation segment before rollover.

Before any Task215 planning, PM should produce a continuation summary that includes:

- accepted Task175 through Task214 scope and outcomes,
- current branch status,
- files added in this segment,
- hard boundaries that remain active,
- Migration020 pause state,
- no DB / DDL / runtime / provider / survey / AI-auto-decision confirmation,
- next safe branch candidates,
- reminder that inventory docs remain frozen.

Codex should not start Task215 until the continuation summary is captured and the next PM conversation is established or explicitly approved.

## Implementation Blockers and Required Approvals

Before message key assertions become executable, future tasks must approve:

1. localization file strategy,
2. message key namespace,
3. API error family implementation,
4. Admin copy and empty-state implementation,
5. assertion helper design,
6. test framework and test file location,
7. fixture strategy,
8. DB strategy if any,
9. redaction review,
10. security review.

## Future Task Candidates

Possible next docs-only tasks after rollover:

- continuation summary and new PM conversation kickoff,
- diagnostic redaction assertion helper design,
- Admin empty-state assertion readiness gate,
- disposable DB assertion approval packet,
- no-send integration assertion design,
- safe-deny implementation readiness gate.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task214 should be considered valid only if:

- it remains documentation-only,
- it does not create localization files,
- it does not create actual tests,
- it does not create fixture files,
- it does not connect to DB,
- it does not run psql,
- it does not run migrations or DDL,
- it does not run cleanup,
- it does not touch shared Zeabur runtime,
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
