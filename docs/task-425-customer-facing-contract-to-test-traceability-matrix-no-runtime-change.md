# Task425 - Customer-Facing Contract-to-Test Traceability Matrix / No Runtime Change

Task425 maps accepted customer-facing design contracts to future test
acceptance criteria.

This task is documentation-only. It does not add tests, modify tests, add
fixtures, add scan scripts, add CI gates, run API/DB/browser/smoke tests, or
authorize runtime work.

## Current Baseline

Task425 follows the Task370-424 customer-facing no-runtime baseline.

It especially consolidates:

- runtime entry gate,
- route/controller contract,
- resolver contract,
- customer channel identity proposal,
- token/link lifecycle proposal,
- audit/security event model,
- permission matrix,
- generic safe-deny localization/message key proposal,
- safe-deny test matrix,
- runtime readiness cutline,
- rate-limit / abuse proposal,
- support fallback proposal,
- local-only runtime authorization checklist,
- projection allow-list checklist,
- synthetic fixture policy,
- fixture sensitive scan checklist,
- route/controller skeleton design,
- resolver skeleton design,
- customerAccessContext skeleton design,
- response envelope / safe-deny skeleton design,
- projection service skeleton design,
- skeleton chain integration review.

Task425 is a traceability matrix, not test implementation.

## Traceability Purpose

The purpose is to map future requirements to possible future test layers.

Task425 does not:

- create test files,
- modify test files,
- create fixtures,
- modify fixtures,
- add scan scripts,
- add CI gates,
- authorize runtime,
- authorize API work,
- authorize DB work,
- authorize browser smoke work,
- authorize integration tests.

General user wording such as "continue", "go ahead", "next task", or "keep
developing" must not be treated as runtime authorization or test authorization.

## Traceability Matrix

All rows are future-only. No tests are created by Task425.

| Requirement / contract | Source task(s) | Future test layer candidate | Expected assertion | Data / fixture requirement | Sensitive scan requirement | Runtime authorization required? | DB authorization required? | External leakage risk | Current implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Controller must not bypass resolver. | Task404, Task419, Task424 | Route/controller contract tests; local-only integration tests after approval. | Controller invokes resolver path before projection/envelope and never queries protected resource directly. | Synthetic route request only. | Scan fixture/request samples for raw token/channel/customer data. | Yes for route/controller runtime tests. | No for pure mocked contract tests; yes if DB-backed. | Resource existence and denial cause leakage. | Future only; no tests now. |
| Resolver must not bypass customerAccessContext. | Task405, Task420, Task421, Task424 | Resolver contract tests; customerAccessContext tests. | Resolver output is internal and must pass through context builder before projection. | Synthetic resolver decision and symbolic references. | Scan for denial reason exposure and raw identity values. | Yes for runtime resolver tests. | No for synthetic unit tests; yes if persistence is used. | Identity, consent, token, resource state leakage. | Future only; no tests now. |
| Projection must not bypass customerAccessContext. | Task416, Task421, Task423, Task424 | Projection service tests. | Projection rejects missing/malformed/denied context and never accepts raw resolver output. | Synthetic customerAccessContext and allow-listed summaries. | Scan for raw row, raw channel id, actual `line_user_id`, complete phone/address. | No for pure utility tests if approved; yes for runtime chain tests. | No unless DB-backed. | Raw internal data reaching customer DTO. | Future only; no tests now. |
| Envelope must not bypass projection. | Task410, Task411, Task422, Task424 | Response envelope equivalence tests. | Envelope wraps allow-listed DTO or generic safe-deny only; it never wraps raw resolver/context output. | Synthetic DTO and generic safe-deny candidates. | Scan response fixtures for forbidden fields. | No for pure utility tests if approved; yes for runtime route tests. | No. | Internal denial reason or raw context exposure. | Future only; no tests now. |
| External denial must remain generic safe-deny. | Task410, Task411, Task420, Task421, Task422, Task424 | Safe-deny matrix tests; response envelope equivalence tests. | Sensitive denials collapse to generic external response. | Synthetic denial cases only. | Scan expected responses for internal category labels. | No for pure tests if approved; yes for runtime route tests. | No. | Enumeration, token state, identity state, existence leakage. | Future only; no tests now. |
| Status code, message key, body shape, redirect, header, retry hint, and timing must not leak denial cause. | Task410, Task411, Task422, Task424 | Response equivalence tests; localization/message key tests; timing bucket tests after authorization. | Equivalent external behavior across sensitive denial causes. | Synthetic denials and sanitized message keys. | Scan message keys for reason-specific wording. | Yes for route/timing tests. | No unless DB-backed. | Denial cause inference. | Future only; no tests now. |
| `line_user_id` must not be a global identity. | Task406, Task420, Task421, Task423, Task424 | Customer channel identity tests; permission matrix tests. | Identity is scoped by organization/channel context and never treated globally. | Synthetic scoped channel identity references only. | Scan for actual channel identifiers. | Yes for real identity resolver tests. | Yes if identity persistence is used. | Cross-tenant or cross-channel identity leakage. | Future only; no tests now. |
| Token/link is not customer identity and cannot replace resolver. | Task407, Task420, Task424 | Resolver contract tests; token/link lifecycle tests. | Token/link reference only gates a resolver path; it does not become customer identity. | Synthetic token references, never real token values. | Scan fixtures/logs for raw token. | Yes for token/link runtime tests. | Yes if persistence is used. | Token state and resource existence leakage. | Future only; no tests now. |
| Unknown fields default deny. | Task391, Task416, Task423 | Projection DTO tests; projection service tests. | Unknown candidate field is omitted or fail-closed by approved policy. | Synthetic DTO candidates. | Scan output fixtures for unknown/forbidden fields. | No for pure utility tests if approved. | No. | Unexpected internal field exposure. | Future only; no tests now. |
| Forbidden fields default deny. | Task398, Task416, Task423, Task424 | Projection DTO tests; forbidden field constants tests. | Forbidden field candidate never appears in customer-facing DTO. | Synthetic forbidden-field candidates. | Scan for forbidden names and policy-only terms. | No for pure utility tests if approved. | No. | Internal note/audit/billing/identity leakage. | Future only; no tests now. |
| Projection is allow-list first. | Task391, Task416, Task423 | Projection DTO tests; projection service tests. | Only explicit customer-visible allow-list fields are emitted. | Synthetic allow-listed summaries. | Scan snapshots for disallowed fields. | No for pure tests if approved. | No. | Over-projection of internal data. | Future only; no tests now. |
| Customer-facing output must not include internal note, audit log, AI raw payload, raw provider payload, or billing/settlement internal data. | Task371, Task398, Task416, Task423, Task424 | Projection DTO tests; fixture sensitive scan tests; response envelope tests. | Output excludes all forbidden internal categories. | Synthetic resource summary with forbidden candidates. | Required scan against forbidden field names and actual sensitive patterns. | No for pure tests if approved; yes for route tests. | No unless DB-backed. | Direct sensitive data exposure. | Future only; no tests now. |
| One Case equals one formal Field Service Report. | Task104-109, Task416, Task423, Task424 | Contract tests; future integration tests after authorization. | Customer-facing chain never creates or implies multiple formal reports for one Case. | Synthetic case/report references only. | Scan output for raw internal report details. | Yes for integration tests. | Yes if DB-backed. | Incorrect report semantics and duplicated formal report interpretation. | Future only; no tests now. |
| finalAppointmentId cannot be decided by customer-facing chain. | Task105-109, Task416, Task423, Task424 | Projection service tests; route/controller contract tests. | Chain can display only authorized summary and never resolves/overwrites finalAppointmentId. | Synthetic resolved summary only. | Scan for internal resolution details. | Yes for runtime chain tests. | No for synthetic tests; yes if DB-backed. | Manual override or re-inference through customer route. | Future only; no tests now. |
| Issue/follow-up acknowledgement is not full case access. | Task414, Task416, Task419, Task423, Task424 | Route family tests; response envelope tests. | Acknowledgement does not reveal case/report existence or internal support routing. | Synthetic acknowledgement cases. | Scan for hidden resource and internal support fields. | Yes for route tests. | No unless DB-backed. | Existence leakage and support workflow exposure. | Future only; no tests now. |
| Survey/feedback acknowledgement is not service report access. | Task110-150, Task416, Task419, Task423, Task424 | Route family tests; response envelope tests. | Feedback acknowledgement cannot return service report data. | Synthetic feedback acknowledgement only. | Scan for report fields in survey/feedback response. | Yes for route tests. | No unless DB-backed. | Report access escalation. | Future only; no tests now. |
| Appointment summary is not full service report access. | Task416, Task419, Task423, Task424 | Route family tests; projection service tests. | Appointment summary cannot include raw report or settlement/audit data. | Synthetic appointment summary. | Scan for service report internal fields. | Yes for route tests; no for pure projection tests if approved. | No unless DB-backed. | Scope expansion leakage. | Future only; no tests now. |
| Support fallback cannot automatically create Case, complaint, or follow-up. | Task414, Task419, Task424 | Support fallback contract tests after authorization. | Fallback produces generic acknowledgement/proposal only, no mutation. | Synthetic support request only. | Scan for raw complaint/case details. | Yes. | Yes if persistence is used. | Unauthorized workflow creation. | Future only; no tests now. |
| AI cannot decide authorization, projection, safe-deny, reissue, complaint close, or settlement. | AI guardrails, Task413, Task414, Task424 | AI boundary contract tests; static policy tests after approval. | AI/RAG/provider is not called in customer-facing access chain. | Synthetic no-AI invocation markers. | Scan for AI raw prompt/model response with PII. | Yes if runtime instrumentation is needed. | No unless DB-backed. | Unauthorized automated decision-making. | Future only; no tests now. |
| Provider sending remains prohibited unless separately authorized. | Task407, Task413, Task419, Task424 | Provider boundary tests after authorization. | No LINE/SMS/Email/App/survey send is triggered by view/acknowledgement routes. | Synthetic provider stubs only. | Scan for provider payload and identifiers. | Yes. | No unless DB-backed. | Accidental outbound notification. | Future only; no tests now. |

## Future Test Layer Candidates

These are proposals only:

- pure utility unit tests,
- projection DTO tests,
- projection service tests,
- customerAccessContext tests,
- resolver contract tests,
- route/controller contract tests,
- response envelope equivalence tests,
- localization/message key equivalence tests,
- fixture sensitive scan tests,
- permission matrix tests,
- audit/security event candidate tests,
- local-only integration tests after explicit authorization.

Authorization notes:

| Future test layer | Implementation now? | Runtime authorization required? | DB authorization required? | Synthetic fixtures required? |
| --- | --- | --- | --- | --- |
| Pure utility unit tests | No. | Explicit test authorization required. | No. | Yes. |
| Projection DTO tests | No. | Explicit test authorization required. | No. | Yes. |
| Projection service tests | No. | Explicit test authorization required. | No unless runtime-integrated. | Yes. |
| customerAccessContext tests | No. | Explicit test authorization required. | No unless persistence-backed. | Yes. |
| Resolver contract tests | No. | Explicit runtime/test authorization required. | No for mocked synthetic; yes for persistence-backed. | Yes. |
| Route/controller contract tests | No. | Explicit local-only runtime authorization required. | No for mocked synthetic; yes for DB-backed. | Yes. |
| Response envelope equivalence tests | No. | Explicit test authorization required. | No. | Yes. |
| Localization/message key equivalence tests | No. | Explicit localization/test authorization required. | No. | Yes. |
| Fixture sensitive scan tests | No. | Explicit test/script authorization required. | No. | Yes. |
| Permission matrix tests | No. | Explicit runtime/test authorization required. | No for mocked synthetic; yes for DB-backed. | Yes. |
| Audit/security event candidate tests | No. | Explicit runtime/test authorization required. | Yes if persistence-backed. | Yes. |
| Local-only integration tests | No. | Explicit local-only runtime authorization required. | Explicit DB authorization required if DB-backed. | Yes. |

## Safe-Deny Traceability

All rows are future-only.

| Safe-deny case | Future assertion | External generic safe-deny | Equivalent response shape | No existence leakage | Internal category only future event candidate | No customer-visible resolver denial reason |
| --- | --- | --- | --- | --- | --- | --- |
| Missing token | Missing token does not reveal token/resource state. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Malformed token | Parser detail is internal only. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Expired token | Prior validity is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Revoked token | Revocation state is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Wrong purpose | Intended route family is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Wrong organization | Tenant mismatch is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Wrong resource | Resource existence is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Wrong channel identity | Binding state is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Unverified identity | Identity existence is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| No consent | Consent state details are not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Deleted resource | Lifecycle state is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Hidden resource | Hidden state is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Unauthorized resource | Unauthorized-but-existing state is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Unsupported route family | Supported route map is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Ambiguous duplicate identity | Duplicate/merge state is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Repository unavailable | Lookup/resource state is not visible. | Yes or generic try-later. | Yes. | Yes. | Yes. | Yes. |
| Missing / malformed customerAccessContext | Context internals are not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Malformed projection DTO | Projection schema is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |
| Unexpected forbidden field candidate | Forbidden field presence is not visible. | Yes. | Yes. | Yes. | Yes. | Yes. |

## Fixture and Sensitive Scan Traceability

Future tests may use only synthetic fixtures.

Future fixtures must not contain:

- raw token,
- secret,
- actual `DATABASE_URL` value,
- raw channel id,
- actual `line_user_id` value,
- complete phone number,
- complete address,
- customer document content,
- signature content,
- photo content,
- file content,
- raw AI prompt / model response with personal data,
- internal note full text,
- audit/security full text,
- billing/settlement internal full text,
- production data,
- real customer data,
- raw provider payload,
- real LINE/SMS/Email/App identifiers.

Future fixture rules:

- comply with Task417 synthetic fixture policy,
- comply with Task418 sensitive scan checklist,
- use symbolic references instead of real identifiers,
- use masked examples when a sensitive category must be represented,
- keep route family and projection scope explicit,
- fail closed on missing or malformed fixture context,
- document fixture purpose and forbidden categories.

## Route Family Traceability

All rows are future-only.

| Route family | Allowed projection scope | Forbidden expansion | Safe-deny fallback | Customer-visible data boundary | No existence leakage assertion |
| --- | --- | --- | --- | --- | --- |
| Service report view | Customer-safe service result summary. | Full case, raw report, audit, settlement, internal review. | Generic safe-deny. | Service date/result, customer-safe parts/photo/signature/charge summary only. | Denial must not reveal report existence. |
| Appointment summary view | Customer-safe appointment summary. | Full report, route optimization, dispatch ranking, engineer internal comments. | Generic safe-deny. | Confirmed/proposed time, service window, safe status, preparation notes. | Denial must not reveal appointment existence. |
| Completion status view | Customer-safe completion status or next step. | Completion mutation, finalAppointmentId resolution detail, settlement/audit data. | Generic safe-deny. | Safe completion state, report availability, support/follow-up option. | Denial must not reveal internal case/report state. |
| Issue/follow-up acknowledgement | Generic acknowledgement / safe next step. | Full case access, complaint internal category, support routing internals. | Generic acknowledgement or generic safe-deny. | Generic support wording only. | Acknowledgement must not confirm hidden resource existence. |
| Survey/feedback acknowledgement | Generic feedback acknowledgement. | Service report access, AI risk flag, complaint triage details. | Generic acknowledgement or generic safe-deny. | Generic thanks/next-step only. | Feedback state must not reveal report existence. |

## Data Access / SaaS / Entitlement Traceability

Future tests must confirm these assertions before runtime release:

- organization isolation is mandatory,
- Data Access Control / Data Permission Model is the base layer,
- permission is not entitlement,
- entitlement is not permission,
- subscription status does not replace permission,
- seat limits do not replace access decision,
- usage limits do not replace access decision,
- AI add-on does not bypass organization isolation,
- Enterprise SSO does not bypass organization isolation,
- cross-tenant access fails closed,
- customer-visible policy is enforced independently of channel,
- internal data policy is enforced independently of route family.

These are future assertions only. Task425 implements none of them.

## Uncovered Gaps

The following remain future-only and require explicit approval where
applicable:

- no runtime authorization,
- no real API route,
- no real resolver,
- no real customer verification,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security persistence,
- no rate-limit middleware,
- no localization runtime,
- no integration tests,
- no DB schema,
- no DB-backed customer-facing access model,
- no provider stubs,
- no local-only runtime spike,
- no fixture sensitive scan script,
- no CI gate.

These gaps are not blockers for Task425 because Task425 is only a traceability
matrix. They must not be interpreted as implementation permission.

## Recommended Next PM Options

Task425 does not choose the next branch automatically.

PM options:

- pause,
- docs-only branch closure summary,
- docs-only local-only runtime spike minimum scope packet,
- ask user for explicit local-only runtime authorization,
- continue docs-only with schema proposal readiness checklist.

Task425 must not be treated as runtime or test approval.

## Explicit Non-goals

Task425 does not:

- modify `src/`,
- modify `admin/src/`,
- modify utilities,
- modify projection utilities,
- modify projection DTO utilities,
- modify forbidden field constants,
- modify response envelope utilities,
- modify safe-deny utilities,
- modify customerAccessContext utilities,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- modify localization files or message catalogs,
- add route files,
- add controller files,
- add API runtime,
- add resolver files,
- add repository runtime,
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

Task425 creates a future requirement-to-test traceability map only.

Decision summary:

- Future tests should map every customer-facing access contract to explicit
  assertion layers.
- Future tests should remain synthetic unless explicitly authorized otherwise.
- Future runtime, API, DB, browser, smoke, fixture, scan, and CI work still
  requires separate approval.
- No test coverage is added by Task425.

## Verification Plan

For Task425 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual credentials, tokens, complete
  customer personal data, raw channel identifiers, raw provider payloads, and
  production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only traceability matrix.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or test boundaries that must not be exposed or touched
without authorization. It does not include credentials, database URLs, access
tokens, secrets, complete customer phone numbers, complete customer addresses,
raw channel identifiers, raw provider payloads, verification codes, or
production data details.
