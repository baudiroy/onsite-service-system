# Task394 — Customer-Facing Pure Skeleton Branch Closure and Next-Phase Cutline / No Runtime Change

Task394 closes the current customer-facing access pure skeleton branch and
defines the next-phase cutline. It is documentation-only.

This task does not add code, tests, runtime behavior, routes, controllers,
repositories, DB access, migrations, schema, indexes, localization, provider
sending, browser automation, smoke tests, or package changes.

## Current Baseline

- Task370-379 customer-facing access documentation baseline is complete.
- Task380-384 customer-facing pure code skeleton is complete.
- Task385 integration guard review is complete.
- Task386-387 pure unit test convention review and decision are complete.
- Task388-392 pure unit tests are complete.
- Task393 pure utility test coverage closure review is complete.
- Customer-facing runtime has not started.
- No controller, route, or API runtime exists.
- No repository, DB access, migration, schema, or index exists for this branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Branch Closure Summary

Task370-393 establish and test a low-risk customer-facing utility baseline:

- Customer-facing access implementation sequencing.
- Customer-visible data classification.
- Response envelope and safe-deny contract.
- Projection DTO field map.
- Projection service interface contract.
- Customer access context resolver contract.
- Controller boundary contract.
- Safe-deny and projection scenario matrix.
- Pre-runtime readiness gate.
- Code-only skeleton cutline.
- Pure safe-deny helper.
- Pure response envelope utility.
- Pure customer access context utility.
- Pure projection DTO utility.
- Pure projection service skeleton.
- Integration guard review.
- Pure unit test convention decision.
- Pure unit coverage baseline.

This closure means the low-risk pure skeleton and one-file pure test baseline is
complete. It does not mean customer-facing runtime is approved, implemented, or
ready for DB/API/provider exposure.

## Accepted Code Artifacts

| File | Purpose | Runtime status |
| --- | --- | --- |
| `src/utils/customerFacingSafeDenyResponse.js` | Builds generic customer-safe deny/unavailable responses from symbolic categories. | Pure helper only; not wired. |
| `src/utils/customerFacingResponseEnvelope.js` | Builds customer-facing success/unavailable envelope shapes and shared safe reference validation. | Pure utility only; not wired. |
| `src/utils/customerAccessContext.js` | Builds internal customer access context skeleton after a future resolver decides access. | Pure utility only; not wired. |
| `src/utils/customerFacingProjectionDto.js` | Builds allow-listed customer-facing timeline/service report/unavailable DTO shapes. | Pure utility only; not wired. |
| `src/utils/customerFacingProjectionService.js` | Maps already-authorized, already-sanitized source concepts into DTOs. | Pure projection skeleton only; not wired. |

## Accepted Test Artifacts

| File | Purpose | Runtime status |
| --- | --- | --- |
| `tests/unit/utils/customer-facing/customerFacingSafeDenyResponse.test.js` | Covers safe-deny categories, fallback, request reference, retry hint, safe next actions, and forbidden detail omission. | Pure unit test only. |
| `tests/unit/utils/customer-facing/customerFacingResponseEnvelope.test.js` | Covers response envelope success/unavailable shape, message key fallback, sanitizer behavior, and request reference validation. | Pure unit test only. |
| `tests/unit/utils/customer-facing/customerAccessContext.test.js` | Covers access context constants, verified/non-verified states, scope refs, fail-closed behavior, and no customer-facing response fields. | Pure unit test only. |
| `tests/unit/utils/customer-facing/customerFacingProjectionDto.test.js` | Covers DTO constants, allowlists, forbidden filtering, access context fail-closed behavior, unavailable DTO shape, and no response envelope fields. | Pure unit test only. |
| `tests/unit/utils/customer-facing/customerFacingProjectionService.test.js` | Covers projection scope allow/deny, fail-closed access behavior, forbidden filtering, unavailable projections, and no envelope/raw source pass-through. | Pure unit test only. |

All accepted artifacts remain pure utility or pure unit test artifacts. None are
connected to routes, controllers, repositories, DB clients, provider SDKs, AI
clients, notification services, audit persistence, localization runtime, or
customer-facing public endpoints.

## Non-authorized Scopes

The following remain explicitly unauthorized:

- DB / DDL / migration / Migration020 dry-run or apply.
- Repository access.
- Route / controller / API runtime.
- Real resolver verification runtime.
- Token storage runtime.
- DB-backed customer channel identity runtime.
- Audit/security event persistence.
- Rate-limit / abuse runtime.
- Localization runtime.
- Provider sending.
- LINE / SMS / Email / App / survey sending.
- AI provider / RAG / vector DB runtime.
- File/photo/signature/document storage runtime.
- Billing/settlement/inventory runtime.
- API/DB/browser/smoke tests.
- Shared/prod/Zeabur runtime.

General "continue" or "go ahead" language must not be interpreted as approval
for these scopes.

## Next-phase Cutline

If work continues, the next PM task must choose exactly one bounded category:

- Additional docs closure.
- Pure utility consistency review.
- One-file pure unit test refinement.
- Additional low-risk pure utility skeleton that does not connect to runtime.

The next task must not jump directly to:

- DB/API/runtime/provider work,
- routes/controllers,
- repository-connected projection,
- token/channel identity runtime,
- audit persistence,
- localization runtime,
- provider sending,
- API/DB/browser/smoke testing.

If a future branch wants controller, route, API, DB, or migration work, it must
first have a separate explicit runtime authorization packet and disposable
local/test runtime confirmation where testing requires runtime access. That
authorization does not exist today.

## Safety Invariants To Carry Forward

Future tasks must preserve:

- Generic safe-deny.
- No existence leakage.
- Forbidden fields default deny.
- Sanitized, non-enumerable request reference concept.
- Organization/channel scope symbolic only until real resolver is approved.
- No internal ids in customer-facing output.
- No raw token or token hash in customer-facing output.
- No raw LINE id or raw provider identity in customer-facing output.
- No raw provider payload.
- No full phone, full mobile, full address, or full customer identity in
  customer-facing utility output.
- No AI raw payload.
- No billing/settlement internal rules.
- No inventory internals.
- No engineer internal comments or supervisor notes.
- LINE must remain a supported channel example, not the hard-coded only channel.

## Risk and Limitation Review

- Pure skeleton closure is not runtime authorization.
- Sanitizers are guardrail skeletons, not a full formal projection policy
  engine.
- No real customer verification exists.
- No token or customer channel identity persistence exists.
- No audit/security persistence exists.
- No localization runtime exists.
- No rate-limit runtime exists.
- No provider integration exists.
- No customer-facing public endpoint exists.
- Future runtime must not bypass the intended flow:

```text
resolver -> customerAccessContext -> projection -> envelope / safe-deny
```

Controllers must remain orchestration-only when future runtime is authorized.
They must not directly expose raw records, denial reasons, tokens, channel
identity internals, audit/security reasons, provider payloads, or AI output.

## Decision Output

Task370-393 customer-facing pure skeleton branch can be considered closed.

The current branch remains:

- no-runtime,
- no-DB,
- no-provider,
- no-API,
- no-smoke,
- no-shared-runtime.

The next PM task category should remain docs closure or low-risk pure
utility/test work only. DB/API/runtime/provider/smoke work remains blocked until
explicit future authorization.

## Non-goals

Task394 does not:

- modify `src/`,
- modify `admin/src/`,
- add test code,
- add smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add helper/service/repository/interface code,
- add controller/route/API runtime,
- modify localization files,
- modify scripts or smoke tests,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger LINE/SMS/Email/App/survey/AI provider sending,
- process real token, secret, customer personal data, raw LINE data, or raw
  provider payload.

## Verification Plan

For Task394 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw LINE data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only closure.

## Redaction Note

This document contains policy terms such as token, secret, raw LINE id, phone,
mobile, address, provider payload, and `DATABASE_URL` only as examples of data
that must not be exposed. It does not include credentials, database URLs, access
tokens, secrets, complete customer phone numbers, complete customer addresses,
raw channel identifiers, raw provider payloads, verification codes, or
production data details.
