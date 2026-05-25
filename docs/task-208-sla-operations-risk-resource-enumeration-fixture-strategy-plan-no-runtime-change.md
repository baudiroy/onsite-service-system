# Task 208 - SLA / Operations Risk Resource Enumeration Fixture Strategy Plan / No Runtime Change

## Purpose and Non-Goals

Task208 defines a documentation-only fixture strategy plan for future SLA / operations risk resource enumeration tests.

This document proposes placeholder fixture entity categories, state combinations, naming conventions, and invariant requirements. It does not create fixture files, smoke tests, automated tests, DB data, API behavior, Admin UI, or runtime logic.

Task208 does not:

- create actual fixture files,
- create or modify smoke tests or automated tests,
- define final production fixture strategy,
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

Task208 preserves:

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

Task208 assumes:

- no SLA / operations risk runtime exists,
- no SLA / operations risk API exists,
- no SLA / operations risk Admin dashboard exists,
- no resource enumeration tests exist for this future branch,
- no test fixtures are approved,
- no entitlement runtime exists,
- no permission runtime changes are approved,
- no usage metering runtime exists,
- no SaaS billing / subscription / payment runtime exists,
- no notification provider delivery is approved,
- survey runtime remains paused,
- AI remains advisory only.

## Fixture Strategy Principles

Future fixtures should:

1. use synthetic placeholder data only,
2. isolate organization / tenant scope clearly,
3. include visible, hidden, out-of-scope, and nonexistent equivalents,
4. avoid real customer names, contact values, channel identifiers, provider data, and payloads,
5. preserve Case / Appointment / Field Service Report invariants,
6. avoid multiple open appointments for one Case,
7. avoid implying survey, notification, provider, or AI runtime exists,
8. be disposable and deterministic,
9. support response equivalence tests,
10. remain future-only until test implementation is approved.

## Placeholder Entity Inventory

Future fixture design may need placeholder entities:

- tenant,
- organization,
- branch,
- team,
- user / actor,
- role / permission set,
- entitlement set,
- feature gate state,
- Case,
- Appointment,
- Field Service Report,
- risk item,
- audit record,
- evidence reference,
- channel identity,
- LINE binding placeholder,
- provider/channel readiness state,
- no-send / no-provider mode.

These are conceptual fixture categories, not data files.

## Tenant / Organization / Branch / Team Fixtures

Recommended placeholder pattern:

| Fixture label | Purpose |
| --- | --- |
| `tenant_alpha` | primary in-scope tenant placeholder |
| `tenant_beta` | out-of-scope tenant placeholder |
| `org_alpha_main` | primary in-scope organization placeholder |
| `org_alpha_other` | same-tenant different-organization placeholder |
| `org_beta_main` | different-tenant organization placeholder |
| `branch_alpha_north` | in-scope branch placeholder |
| `branch_alpha_south` | branch mismatch placeholder |
| `team_alpha_dispatch` | in-scope team placeholder |
| `team_alpha_other` | team mismatch placeholder |

No real tenant, organization, branch, or team identifiers should be used.

## User / Role / Permission Fixtures

Placeholder actors:

| Fixture label | Purpose |
| --- | --- |
| `actor_dispatch_allowed` | can view dispatch queue and safe details |
| `actor_dispatch_no_action` | can view but cannot act |
| `actor_supervisor_allowed` | can perform higher review actions |
| `actor_auditor_read_only` | can view audit if allowed |
| `actor_evidence_denied` | can view risk but not evidence |
| `actor_wrong_org` | authenticated but outside organization scope |
| `actor_no_entitlement_visibility` | normal user without feature detail visibility |

Role labels must remain placeholders and must not imply production roles.

## Entitlement / Feature Gate Fixtures

Placeholder entitlement states:

| Fixture label | Purpose |
| --- | --- |
| `entitlement_sla_tracking_enabled` | first-release candidate enabled |
| `entitlement_risk_queue_enabled` | first-release queue enabled |
| `entitlement_risk_actions_enabled` | manual actions enabled |
| `entitlement_risk_dashboard_disabled` | dashboard feature disabled |
| `entitlement_export_disabled` | export unavailable |
| `entitlement_ai_hints_disabled` | AI add-on unavailable |
| `entitlement_advanced_rules_disabled` | advanced feature unavailable |
| `entitlement_usage_limited` | usage-sensitive unavailable state |

No plan names, commercial pricing, usage counts, or real entitlement values should be embedded.

## Case / Appointment / Field Service Report Fixtures

Future fixtures must protect core invariants.

Recommended placeholders:

| Fixture label | Purpose |
| --- | --- |
| `case_visible_open_workflow` | visible in-scope case with normal risk context |
| `case_hidden_same_tenant` | hidden same-tenant case for equivalence testing |
| `case_other_org` | out-of-organization case |
| `case_nonexistent_placeholder` | nonexistent id placeholder |
| `appointment_visible_current` | visible appointment in allowed workflow |
| `appointment_hidden_context` | hidden appointment context |
| `report_visible_in_progress` | visible report context |
| `report_hidden_context` | hidden report context |

Required invariant protection:

- one Case has one formal Field Service Report,
- one Case may have multiple appointments / dispatch visits,
- no Case has multiple open appointments at once,
- final appointment identity remains system-owned,
- cancelled / no-show / pending parts visits remain appointment-level history,
- fixture design must not create one report per visit.

## Risk Item / Workflow-State Fixtures

Placeholder risk items:

| Fixture label | Purpose |
| --- | --- |
| `risk_visible_active` | normal visible risk item |
| `risk_hidden_same_org` | hidden item with equivalent not-found response |
| `risk_out_of_scope` | wrong org / branch / team scope |
| `risk_stale_visible` | visible stale-state test |
| `risk_concurrent_visible` | visible concurrent update test |
| `risk_already_resolved` | already resolved state |
| `risk_already_suppressed` | already suppressed state |
| `risk_duplicate_grouped` | grouped duplicate state |

Workflow-state fixtures must not mutate official Case / Appointment / Report state automatically.

## Audit / Evidence Fixtures

Placeholder fixtures:

| Fixture label | Purpose |
| --- | --- |
| `evidence_visible_reference` | visible evidence reference only |
| `evidence_hidden_reference` | hidden evidence reference |
| `evidence_missing_placeholder` | missing evidence equivalent |
| `audit_visible_summary` | visible audit summary |
| `audit_hidden_summary` | hidden audit summary |
| `audit_missing_placeholder` | missing audit equivalent |

Fixtures should use references or labels only, not files, raw payloads, object keys, provider payloads, or attachment data.

## Channel Identity / LINE Binding Placeholder Fixtures

Channel fixtures must be abstract.

| Fixture label | Purpose |
| --- | --- |
| `channel_identity_visible_placeholder` | visible channel context summary |
| `channel_identity_hidden_placeholder` | hidden channel context |
| `line_binding_placeholder_present` | synthetic binding presence without raw id |
| `line_binding_placeholder_absent` | synthetic absence equivalent |
| `channel_context_ambiguous` | ambiguity test state |

Do not use real LINE user ids, channel secrets, access tokens, customer contact values, or provider payloads.

## Provider / No-Send Mode Fixtures

Provider and no-send states are future-only placeholders:

| Fixture label | Purpose |
| --- | --- |
| `provider_ready_placeholder` | synthetic ready state |
| `provider_unavailable_placeholder` | synthetic unavailable state |
| `provider_hidden_error_placeholder` | hidden provider error state |
| `no_send_mode_enabled` | no provider sending allowed |
| `no_provider_mode_enabled` | provider integration disabled |

Fixtures must never send LINE / APP / SMS / email or trigger provider calls.

## Resource Enumeration State Combination Matrix

| Combination | Required fixture relationship |
| --- | --- |
| valid in-scope | actor, entitlement, permission, scope, and resource visible |
| same tenant / different organization | tenant same, organization different |
| different tenant | tenant different, organization different |
| branch/team mismatch | organization same, branch or team outside scope |
| permission missing | resource visible, action denied |
| entitlement missing | actor visible surface, organization feature unavailable |
| hidden resource | resource exists but caller cannot know |
| nonexistent resource | matching placeholder id does not exist |
| audit/evidence restricted | risk visible, evidence/audit hidden |
| channel ambiguous | channel context cannot be safely disclosed |
| stale/concurrent | resource visible, state changed |
| first-release excluded | feature intentionally unavailable |

## Fixture Naming Conventions

Recommended naming:

- lower snake case,
- prefix by entity type,
- include only synthetic labels,
- no real tenant/customer/provider values,
- no customer contact fragments,
- no raw channel identifiers,
- no production-like secrets,
- no plan/pricing values.

Examples:

```text
case_visible_open_workflow
risk_hidden_same_org
actor_dispatch_allowed
entitlement_export_disabled
line_binding_placeholder_present
no_send_mode_enabled
```

## Prohibited Fixture Content

Do not include:

- real customer data,
- real tenant identifiers,
- real organization identifiers,
- customer contact values,
- raw LINE user ids,
- raw channel ids,
- provider raw values,
- tokens or secrets,
- URLs with secrets,
- raw payloads,
- stack traces,
- SQL errors,
- DB constraint names,
- provider credentials,
- real usage values,
- pricing values,
- AI prompts or raw AI outputs.

## Fixture Isolation and Non-Leakage Requirements

Future fixture strategy must ensure:

- hidden and nonexistent resources can be compared safely,
- out-of-scope and nonexistent resources can be compared safely,
- hidden evidence and missing evidence can be compared safely,
- hidden audit and missing audit can be compared safely,
- hidden channel binding and absent channel binding can be compared safely,
- no fixture requires shared runtime or production data,
- no fixture performs destructive cleanup.

## Case / Appointment / Report Invariant Protection

Fixtures must not break:

- one Case = one formal Field Service Report,
- one Case may have multiple appointments / visits,
- same Case cannot have multiple open appointments,
- final appointment is system-owned,
- completed report remains stable,
- repeat completion should not create duplicate side effects,
- appointment history does not create multiple formal reports.

## Channel-Agnostic and LINE-Safe Boundaries

Fixtures should support channel abstraction.

Do not design fixtures that require LINE as the only channel. Use channel placeholders and keep raw LINE identity out of examples.

## Diagnostic Redaction and QA Artifact Alignment

Fixture planning must align with diagnostic and QA redaction:

- safe labels only,
- safe summaries only,
- no raw payloads,
- no credentials,
- no provider diagnostics,
- no real customer or tenant data.

## Alignment with Task192 / Task206 / Task207

Task208 supports:

- Task192 resource enumeration test plan,
- Task206 expected response matrix,
- Task207 test case catalog.

It remains planning-only and does not create tests.

## Alignment with Task173-Task205

Task208 preserves the docs-only SLA / operations risk design sequence and does not create runtime, API, Admin, DB, migration, provider, survey, AI, localization, or test implementation.

## Implementation Blockers and Required Approvals

Before fixture implementation, future tasks must approve:

1. test framework location,
2. fixture data builder strategy,
3. disposable DB or mock strategy,
4. route/API surfaces,
5. Admin surface strategy,
6. redaction assertions,
7. cleanup policy,
8. security review.

## Future Task Candidates

Possible next docs-only tasks:

- fixture builder architecture review,
- disposable local fixture policy,
- mock-vs-DB test strategy,
- fixture redaction checklist,
- hidden vs nonexistent fixture equivalence plan,
- channel abstraction fixture strategy,
- no-send fixture strategy.

Runtime and fixture implementation remain out of scope.

## Verification Checklist

Task208 should be considered valid only if:

- it remains documentation-only,
- it does not create fixture files,
- it does not create or modify tests,
- it does not define final production fixture strategy,
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
