# Task 209 - SLA / Operations Risk Mock-vs-DB Test Strategy Decision Packet / No Runtime Change

## Purpose and Non-Goals

Task209 defines a documentation-only decision packet for future mock-vs-DB testing strategy for SLA / operations risk resource enumeration and non-leakage validation.

This document compares mock-only tests, disposable local/test DB tests, hybrid tests, and no-send/no-provider integration-style tests. It does not create tests, fixtures, DB connections, migrations, DDL, cleanup commands, runtime behavior, or Admin UI.

Task209 does not:

- create actual test files,
- create actual fixture files,
- connect to any DB,
- use psql,
- run `npm run db:migrate`,
- run migration dry-run or apply,
- apply or dry-run Migration 020,
- execute DDL,
- run cleanup commands,
- touch shared Zeabur runtime,
- create or modify localization files,
- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify API behavior,
- modify permission runtime,
- modify entitlement runtime,
- modify routes, controllers, services, repositories, validators, mappers, or middleware,
- modify smoke, browser smoke, automated tests, or QA scripts,
- modify logging or redaction utilities,
- modify OpenAPI / Swagger / generated client files,
- modify executable schemas or config,
- modify `package.json`,
- add a migration file,
- change schema or indexes,
- create usage metering runtime,
- create SaaS billing, subscription, payment, plan, or pricing runtime,
- add notification sending,
- send LINE / APP / SMS / email,
- enable survey runtime,
- enable AI automatic decisions,
- modify inventory docs,
- output sensitive values.

## Source-of-Truth Guardrails

Task209 preserves:

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

Task209 assumes:

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

## Mock-vs-DB Decision Principles

Future test strategy should:

1. start with the least risky validation layer,
2. avoid shared runtime and production-like data,
3. avoid DB/DDL until explicit approval exists,
4. use mocks for response equivalence and API shape design where possible,
5. use disposable local/test DB only when persistence or constraints matter,
6. guarantee no provider sending,
7. guarantee no destructive cleanup in shared runtime,
8. preserve Case / Appointment / Report invariants,
9. verify redaction and non-leakage,
10. keep AI advisory-only.

## Strategy Options Overview

| Strategy | Use case | Risk | Current recommendation |
| --- | --- | --- | --- |
| mock-only tests | response shape, mapping, non-leakage equivalence | low | good first step after runtime design |
| disposable local/test DB tests | persistence, transactions, constraints, query scope | medium | future only with approval |
| hybrid mock + disposable DB | layered validation | medium | likely best long-term |
| no-send/no-provider integration-style tests | verify no outbound delivery while exercising runtime | medium | future only |
| shared runtime tests | live shared environment | high | not allowed without explicit approval |

## Mock-Only Test Strategy Assessment

Mock-only tests are suitable for:

- API response shape equivalence,
- Admin empty-state mapping,
- localization key mapping,
- feature gate error mapping,
- permission/entitlement/scope decision table behavior,
- redaction assertions on synthetic payloads,
- AI unavailable fallback behavior,
- channel ambiguity response behavior.

Pros:

- no DB risk,
- no DDL,
- no cleanup,
- fast,
- safer for docs-to-runtime transition.

Limits:

- cannot verify actual repository queries,
- cannot verify DB constraints,
- cannot verify transaction behavior,
- cannot verify real migration compatibility.

## Disposable Local/Test DB Strategy Assessment

Disposable DB tests may eventually be needed for:

- organization/tenant query isolation,
- branch/team filtering,
- unique constraints,
- transaction boundaries,
- stale/concurrent update behavior,
- final query shape validation,
- index/query performance safety.

They require explicit future approval and must be local/test only.

Required safeguards:

- no shared Zeabur runtime,
- no production data,
- no secrets printed,
- no DDL without explicit approval,
- isolated database,
- deterministic fixture setup,
- deterministic teardown or disposable environment,
- no destructive cleanup in shared runtime.

## Hybrid Strategy Assessment

Recommended long-term direction:

1. mock-only tests for response equivalence and non-leakage behavior,
2. disposable local/test DB tests for persistence and query scope,
3. no-send/no-provider integration-style tests only after runtime exists,
4. never use shared runtime for resource enumeration mutation tests unless separately approved.

Hybrid tests reduce risk by proving logic at cheap layers before adding DB complexity.

## No-Send / No-Provider Integration-Style Strategy Assessment

Future integration-style tests may validate:

- feature gate behavior with runtime enabled,
- no provider sending,
- no notification delivery,
- no survey delivery,
- AI unavailable fallback,
- redaction in logs and Admin artifacts.

These tests must not call LINE / APP / SMS / email providers. They must use no-send and no-provider modes only.

## Shared Runtime / Zeabur Prohibition

Shared Zeabur runtime must not be used for:

- destructive cleanup,
- resource enumeration fixture mutation,
- DDL,
- migration dry-run/apply,
- DB reset,
- unsafe fixture creation,
- provider sending,
- survey delivery tests,
- resource enumeration probing with sensitive data.

Any shared runtime operation requires a separate explicit approval branch.

## Scenario Group Suitability Matrix

| Scenario group | Mock-only suitable? | Disposable DB eventually useful? | Notes |
| --- | --- | --- | --- |
| valid in-scope baseline | yes | yes | DB useful for final query scope |
| permission failure | yes | maybe | permission logic can start mocked |
| organization / tenant mismatch | yes | yes | DB useful for query isolation |
| branch/team mismatch | yes | yes if branch/team exists | placeholder only now |
| entitlement missing | yes | maybe | depends on entitlement storage |
| feature disabled | yes | maybe | storage future-only |
| usage/export limit | yes | maybe | metering future-only |
| AI add-on unavailable | yes | no initially | advisory-only |
| hidden vs nonexistent | yes | yes | DB useful for real lookup parity |
| audit/evidence denied | yes | yes | DB useful if audit/evidence tables exist |
| channel ambiguity | yes | yes if channel identity tables involved | no raw IDs |
| provider readiness | yes | no provider calls | no-send only |
| stale/concurrent update | mock partially | yes | DB/transaction tests eventually needed |
| duplicate/suppressed/resolved | yes | yes if persistence exists | future runtime |
| first-release excluded | yes | no initially | feature gate only |

## DB Safety Gates for Future Work

Before any DB-backed test work:

1. user explicitly approves DB usage,
2. database is disposable local/test only,
3. no shared Zeabur runtime,
4. no production-like data,
5. no secrets printed,
6. migration/apply/dry-run scope explicitly approved,
7. fixture setup is deterministic,
8. teardown is safe or environment is disposable,
9. no provider sending is possible,
10. logs and test artifacts are redacted.

## Cleanup and Isolation Requirements

Current task runs no cleanup.

Future cleanup strategy should prefer:

- disposable database teardown,
- transaction rollback for tests,
- unique synthetic fixture prefixes,
- no destructive cleanup in shared runtime,
- explicit dry-run for cleanup tools,
- safe summaries only.

## Migration / DDL / DB Command Boundaries

Task209 does not run:

- DB connection,
- psql,
- `npm run db:migrate`,
- migration dry-run,
- migration apply,
- Migration 020,
- DDL,
- cleanup commands.

Future DB work requires explicit approval packet.

## Provider Sending and Survey Runtime Boundaries

Future tests must use:

- no-send mode,
- no-provider mode,
- no real LINE / APP / SMS / email delivery,
- no survey sending,
- no notification provider calls,
- no outbox worker sending.

## Fixture Strategy Alignment with Task208

Task208 fixture labels should remain placeholders until a future implementation task creates safe fixtures.

Mock tests can start from synthetic objects that follow Task208 naming and invariant rules.

## Expected Response Alignment with Task206

Mock-only tests can validate Task206 expected response categories and equivalence groups before DB integration exists.

## Test Case Catalog Alignment with Task207

Task207 test case IDs can be used as planning labels. They should not become executable tests until a future implementation task approves test files.

## Diagnostic Redaction and QA Artifact Alignment

Future test output must not include:

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

## Channel-Agnostic and LINE-Safe Boundaries

Tests should use channel placeholders and must not require LINE as the only channel.

No raw LINE identity, access token, channel secret, or provider delivery should be used.

## AI Advisory-Only Boundary

AI tests should verify advisory unavailability and manual fallback. They must not test AI auto decisions because those are out of scope.

## Decision Recommendation and Open Questions

Recommendation:

1. start future implementation with mock-only response equivalence tests,
2. add disposable local/test DB tests only after runtime and DB strategy are approved,
3. add no-send/no-provider integration tests only after runtime exists,
4. never use shared runtime for unsafe fixture mutation or enumeration probing.

Open questions:

- Which test framework should own future mock-only tests?
- Should resource enumeration tests live near API tests or security tests?
- When should disposable DB tests be introduced?
- What fixture builder pattern should be used?
- How should branch/team scope be represented if not yet implemented?
- What redaction assertion helper should be used?

## Alignment with Task173-Task208

Task209 preserves the docs-only SLA / operations risk design sequence and does not create runtime, API, Admin, DB, migration, provider, survey, AI, localization, or test implementation.

## Implementation Blockers and Required Approvals

Before implementation, future tasks must approve:

1. test framework,
2. test file location,
3. fixture strategy,
4. DB strategy if any,
5. no-send/no-provider enforcement,
6. redaction assertions,
7. cleanup strategy,
8. security review.

## Future Task Candidates

Possible next docs-only tasks:

- mock-only response equivalence test design,
- disposable DB safety approval packet,
- no-send integration test design,
- fixture builder architecture review,
- redaction assertion helper design,
- resource enumeration security test readiness gate.

Runtime and test implementation remain out of scope.

## Verification Checklist

Task209 should be considered valid only if:

- it remains documentation-only,
- it does not create actual tests,
- it does not create fixture files,
- it does not connect to DB,
- it does not run psql,
- it does not run migrations or DDL,
- it does not run cleanup,
- it does not touch shared Zeabur runtime,
- it does not define final production test strategy,
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
