# Task426 - Customer-Facing Local-Only Runtime Spike Minimum Scope Packet / No Runtime Change

Task426 defines the minimum safe scope for a possible future customer-facing
local-only runtime spike if the user explicitly authorizes it later.

This task is documentation-only. It is not a runtime kickoff and does not add
route/controller/resolver/API/test/fixture/DB/runtime code.

## Current Baseline

Task426 follows the Task370-425 customer-facing no-runtime baseline.

It especially follows:

- runtime entry gate,
- local-only runtime authorization checklist,
- skeleton chain integration review,
- contract-to-test traceability matrix,
- synthetic fixture policy,
- fixture sensitive scan checklist.

Current state remains:

- no runtime authorization,
- no customer-facing runtime,
- no route/controller/API implementation,
- no resolver implementation,
- no repository / DB access,
- no migration / schema / index,
- no fixture files added,
- no test files added,
- no scan script or CI added,
- no localization/message catalog runtime,
- no customer channel identity persistence,
- no token/link persistence,
- no audit/security persistence,
- no provider sending,
- no AI provider / RAG / vector DB,
- no shared/prod/Zeabur runtime access.

Task426 is a future minimum scope packet, not runtime approval.

## Minimum Safe Spike Principle

If a future local-only runtime spike is explicitly authorized, the safest
minimum version should prefer:

- no DB,
- no repository,
- no provider sending,
- no AI provider / RAG / vector DB,
- no real customer data,
- synthetic in-memory fixtures only,
- sanitized symbolic references only,
- existing pure utilities only,
- fail-closed default.

Even after Task426 is complete, runtime work still must not begin without a
separate explicit authorization.

## Required Explicit Authorization Before Spike

Before any future spike starts, the user must explicitly confirm:

- local-only runtime spike is allowed,
- disposable local/test environment exists,
- shared / prod / Zeabur are not targets,
- no production data may be used,
- whether route/controller skeleton files may be added,
- whether resolver skeleton files may be added,
- whether synthetic fixtures may be added,
- whether unit / contract tests may be added,
- whether API / browser / smoke tests may be run,
- whether any DB / DDL / migration is allowed; if yes, it requires a separate
  task authorization.

General wording such as "continue", "go ahead", "next task", or "keep
developing" is not authorization.

## Allowed Future Spike Components

The following are proposal only and require explicit authorization before any
implementation:

| Component | Future-only scope | Requires explicit authorization? |
| --- | --- | --- |
| Route/controller skeleton | Minimal local route/controller orchestration for synthetic requests only. | Yes. |
| Resolver stub | Local-only resolver stub that returns synthetic allowed/denied results. | Yes. |
| customerAccessContext builder use only | Use existing or separately approved context builder with symbolic data only. | Yes. |
| Projection service use only | Use existing or separately approved projection service with allow-listed summaries only. | Yes. |
| Response envelope / safe-deny utility use only | Use existing or separately approved envelope/safe-deny utility for generic output. | Yes. |
| Synthetic in-memory resource summaries | No DB; no repository; no production-like records. | Yes. |
| Symbolic token/link references | Placeholder references only; no raw token values. | Yes. |
| Symbolic customer/channel/resource references | Placeholder scoped references only; no real channel/customer identifiers. | Yes. |

## Explicitly Excluded From Minimum Spike

The minimum spike must exclude:

- DB schema,
- migration,
- repository implementation,
- customer channel identity persistence,
- token/link persistence,
- audit/security event persistence,
- rate-limit middleware,
- provider sending,
- LINE / SMS / Email / App / survey sending,
- AI provider / RAG / vector DB,
- billing / settlement / inventory,
- survey runtime,
- support workflow runtime,
- link reissue runtime,
- complaint close / case close runtime,
- production-like data,
- Migration020.

If any excluded item becomes necessary, it requires a separate task and explicit
approval.

## Mandatory Future Flow

Any future minimum spike must preserve this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Minimum spike rules:

- It must not bypass any layer.
- Controller must not directly look up resources.
- Resolver must not output customer-facing DTO.
- Projection must not make authorization decisions.
- Envelope must not wrap raw data.
- No layer may mutate Case, Appointment, Field Service Report, support,
  complaint, billing, settlement, identity, token, link, or audit state.

## Synthetic Data Rules

Future spike data must comply with Task417 and Task418.

Allowed:

- symbolic fixtures,
- synthetic in-memory summaries,
- sanitized symbolic resource references,
- masked placeholder values,
- route-family-specific projection examples.

Forbidden:

- production data,
- real customer data,
- provider payload,
- real LINE/SMS/Email/App identifiers,
- raw token,
- secret,
- actual `DATABASE_URL` value,
- raw channel id,
- actual `line_user_id` value,
- complete phone number,
- complete address,
- signature content,
- photo content,
- file content,
- document content.

If a future scan detects suspected real sensitive data, the spike must fail
closed.

## Safe-Deny Acceptance Boundary

Minimum spike must preserve generic safe-deny.

The following cases must not expose external reason:

- missing token,
- malformed token,
- expired token,
- revoked token,
- wrong organization,
- wrong resource,
- wrong channel identity,
- unverified identity,
- no consent,
- unsupported route,
- forbidden field candidate.

The external response must not leak through:

- status code,
- message key,
- body shape,
- field count,
- redirect,
- headers,
- retry hints,
- next-action wording,
- timing bucket.

Internal categories may exist only as future audit/security event candidates.
They must not appear in customer-visible output.

## Customer-Visible Data Boundary

Success response must come only from allow-listed projection DTO.

Output must not include:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing / settlement internal data,
- vendor reconciliation rules,
- engineer internal comments,
- supervisor review,
- raw token,
- raw channel id,
- `line_user_id`,
- complete phone number,
- complete address,
- permission / entitlement internal reason,
- rate-limit / abuse reason,
- resolver denial reason.

Unknown fields default deny. Forbidden fields default deny.

## Field Service Report Invariant

The future spike must preserve Field Service Report invariants:

- One Case can have only one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Future spike must not create, modify, copy, or infer a formal Field Service
  Report.
- Multiple appointments / dispatch visits must not be interpreted as multiple
  formal reports.
- finalAppointmentId must not be decided by the customer-facing chain.
- Customer-facing report remains a projection, not raw internal report.

## Testing Boundary

Task426 does not add tests.

If future tests are explicitly authorized, the priority should be:

- pure utility unit tests,
- route/controller contract tests,
- resolver contract tests,
- customerAccessContext tests,
- projection service tests,
- response equivalence tests,
- fixture sensitive scan tests.

API / browser / smoke / DB tests require separate explicit authorization.

## Exit Criteria for Future Spike

Proposal only. No implementation is performed by Task426.

A future authorized spike should exit only if:

- no runtime provider sending occurred,
- no DB access occurred unless separately approved,
- all denied cases return generic safe-deny,
- no forbidden field appears in output,
- synthetic fixture scan passes,
- no real sensitive data is output,
- mandatory flow is not bypassed,
- guardrails report is completed,
- changes are limited to explicitly approved files,
- checks requested by the authorization packet pass.

## Recommended PM Options After Task426

Task426 does not choose the next branch automatically.

PM options:

- pause and ask user for explicit local-only runtime authorization,
- continue docs-only with branch closure summary,
- continue docs-only with local-only spike authorization question template,
- continue docs-only with schema proposal readiness checklist.

Task426 must not be treated as runtime approval.

## Explicit Non-goals

Task426 does not:

- modify `src/`,
- modify `admin/src/`,
- modify utilities,
- modify projection utilities,
- modify projection DTO utilities,
- modify forbidden field constants,
- modify response envelope utilities,
- modify safe-deny utilities,
- modify customerAccessContext utilities,
- add route files,
- add controller files,
- add API runtime,
- add resolver files,
- add repository runtime,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- modify localization files or message catalogs,
- add permission runtime,
- add audit/security event query runtime,
- add audit/security event tables,
- add support workflow runtime,
- add case runtime,
- add complaint runtime,
- add follow-up runtime,
- add link reissue runtime,
- add middleware,
- add rate-limit runtime,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger provider sending,
- trigger LINE/SMS/Email/App/survey sending,
- call AI provider,
- call RAG,
- call vector DB,
- process real token, secret, `DATABASE_URL`, raw channel id, complete customer
  phone number, complete customer address, raw provider payload, or production
  data.

## Decision

Task426 defines a future minimum safe local-only runtime spike scope only.

Decision summary:

- The minimum future spike should be synthetic, local-only, no-DB, no-provider,
  no-AI, and fail-closed by default.
- Every runtime, test, fixture, API, DB, browser, smoke, and scan-script action
  still requires separate explicit approval.
- Task426 does not authorize runtime work.

## Verification Plan

For Task426 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual credentials, tokens, complete
  customer personal data, raw channel identifiers, raw provider payloads, and
  production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only scope packet.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
