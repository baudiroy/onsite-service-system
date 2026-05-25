# Task 377 - Customer-facing Safe-deny and Projection Test Scenario Matrix / No Runtime Change

## Scope Summary

Task377 is a documentation-only test scenario matrix for future customer-facing safe-deny and projection runtime.

This task does not modify `src/`, `admin/src/`, `scripts/smoke`, test files, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, token runtime, rate-limit runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, browser smoke, API smoke, DB smoke, or destructive cleanup is part of this task.

Task377 defines future test scenarios only. It does not add test code and does not execute runtime tests.

## Current Baseline

| Area | Current status |
| --- | --- |
| Customer-facing runtime | Not started |
| Resolver / projection / safe-deny / controller runtime | Not implemented |
| Customer-facing test code | Not implemented |
| API / DB / browser smoke for customer-facing access | Not started |
| Migration020 / survey runtime | Paused |
| DB / DDL / migration approval | Not granted |
| Provider sending | Paused |
| Disposable local/test runtime for API/DB smoke | Not confirmed |

The current branch is design-ready, not runtime-ready.

## Test Matrix Purpose

This document defines future test scenarios for:

- resolver behavior,
- projection service behavior,
- safe-deny helper behavior,
- response envelope behavior,
- controller boundary behavior,
- forbidden field assertions,
- enumeration protection,
- AI boundary.

It does not create tests. Future test implementation requires explicit runtime/test-code task approval and, for API/DB/browser smoke, disposable local/test runtime confirmation.

## Safe-deny Scenario Matrix

| Scenario | Expected customer-facing response class | MessageKey family | Same-shape requirement | Forbidden customer-visible detail | Allowed next action | Internal audit/security event class |
| --- | --- | --- | --- | --- | --- | --- |
| Missing input | Generic unavailable | `customerAccess.genericUnavailable` | Same shape as ambiguous unavailable. | Which input was missing if it leaks resource state. | Contact support. | `customer_access.denied_generic` concept. |
| Malformed link | Link unavailable or generic unavailable | `customerAccess.linkUnavailable` or generic | Same shape as expired/revoked when high risk. | Whether link was ever valid. | Request new link / contact support. | `customer_access.link_unavailable` concept. |
| Unavailable link | Link unavailable | `customerAccess.linkUnavailable` | Same shape as malformed/expired/revoked. | Internal link state. | Request new link / contact support. | `customer_access.link_unavailable` concept. |
| Expired link internal state | Link unavailable | `customerAccess.linkUnavailable` | Must not differ from revoked/already-used. | Expired timestamp or prior validity. | Request new link / contact support. | `customer_access.link_unavailable` concept. |
| Revoked link internal state | Link unavailable | `customerAccess.linkUnavailable` | Must not differ from expired/already-used. | Revocation reason. | Contact support. | `customer_access.link_unavailable` concept. |
| Already-used link internal state | Link unavailable | `customerAccess.linkUnavailable` | Must not confirm reuse. | Whether link was used and by whom. | Request new link / contact support. | `customer_access.link_unavailable` concept. |
| Verification required | Verification required | `customerAccess.verificationRequired` | Must not prove resource exists. | Matching factors, binding status. | Complete verification / contact support. | `customer_access.verification_required` concept. |
| Verification failed | Verification failed or generic unavailable | `customerAccess.verificationFailed` or generic | Same detail level across failed factors. | Which factor failed or whether identity exists. | Retry if policy allows / contact support. | `customer_access.denied_generic` concept. |
| Wrong channel identity | Generic unavailable | `customerAccess.genericUnavailable` | Same shape as wrong customer/org. | Channel identity existence or matching identity elsewhere. | Contact support. | `customer_access.channel_scope_mismatch` concept. |
| Unsupported channel | Generic unavailable or action unavailable | `customerAccess.genericUnavailable` | Same shape as unsupported link/action. | Provider capability or channel binding internals. | Contact support. | `customer_access.action_unavailable` concept. |
| Rate limited | Rate limited | `customerAccess.rateLimited` | Same shape regardless internal bucket. | Threshold, bucket, rule id, score. | Try later / contact support. | `customer_access.suspicious_probe` concept. |
| Abuse suspected | Generic unavailable or rate limited | `customerAccess.genericUnavailable` or rate limited | Must not reveal abuse classifier. | Probe detection, risk score. | Contact support. | `customer_access.suspicious_probe` concept. |
| Organization not accessible | Generic unavailable | `customerAccess.genericUnavailable` | Same shape as customer/case/report inaccessible. | Organization existence or disabled state. | Contact support. | `customer_access.cross_org_denied` concept. |
| Customer not accessible | Generic unavailable | `customerAccess.genericUnavailable` | Same shape as wrong customer. | Customer existence or binding state. | Contact support. | `customer_access.denied_generic` concept. |
| Case not accessible | Generic unavailable | `customerAccess.genericUnavailable` | Same shape as not found/unauthorized. | Case existence or owner. | Contact support. | `customer_access.denied_generic` concept. |
| Appointment not accessible | Generic unavailable | `customerAccess.genericUnavailable` | Must not reveal appointment existence. | Appointment existence/status. | Contact support. | `customer_access.denied_generic` concept. |
| Report not accessible | Generic unavailable | `customerAccess.genericUnavailable` | Must not reveal report existence/completion. | Report existence, completion state, visibility state. | Contact support. | `customer_access.denied_generic` concept. |

## Projection Success Scenario Matrix

| Scenario | Required access context | Allowed DTO fields | Forbidden fields | Masking / redaction expectations | Response envelope expectation |
| --- | --- | --- | --- | --- | --- |
| Verified access to timeline | Verified organization/channel/surface scope. | `surface`, customer-safe `caseRef`, display status, timeline items, next actions. | Raw appointment rows, dispatch ranking, route clustering, internal notes. | No full personal data; safe display labels only. | Task372 success envelope. |
| Verified access to customer-facing service report | Verified organization/channel/report surface scope. | Customer-safe `caseRef`, `reportRef`, service date, issue/work summaries, allowed parts/charges/signature summaries. | Internal Field Service Report payload, billing/settlement internals, AI raw payload. | Selected fields only; no raw ids. | Task372 success envelope. |
| Proposed appointment display | Resolver allows proposed appointment surface. | Proposed appointment window and confirm/change next action. | Internal dispatch draft, route plan, staff notes. | Show customer-safe time window only. | Task372 success envelope. |
| Confirmed appointment display | Resolver allows confirmed appointment surface. | Confirmed service window, display status, support action. | Internal schedule conflicts, engineer workload. | Timezone explicit; no route details. | Task372 success envelope. |
| Completed visit customer-safe summary | Verified completed service context. | Service completed status, customer-safe result summary. | Raw `finalAppointmentId`, internal visit enum details, engineer internal comments. | Customer-safe wording only. | Task372 success envelope. |
| Service report with confirmed customer-relevant charge | Verified report + confirmed charge/approval policy. | Customer charge summary, approval/invoice status if customer-safe. | Internal settlement amount, cost, margin, vendor payout, reconciliation rule. | Show confirmed customer-relevant fields only. | Task372 success envelope. |
| Service report without charge | Verified report without customer charge. | `chargesSummary.available=false` or omitted safe state. | Internal no-charge reason if sensitive. | Do not expose internal finance classification. | Task372 success envelope. |
| Follow-up/support hint | Verified surface/action availability. | Support/contact hint and issue/report action availability. | Complaint risk classification, internal escalation reason. | Generic customer-safe next action. | Task372 success envelope. |

## Forbidden Field Assertion Matrix

Future tests must assert customer-facing responses do not contain:

| Forbidden data | Assertion direction |
| --- | --- |
| Internal notes | Must not appear in success, safe-deny, error, displayHints, metadata, or nextActions. |
| Audit log / audit reason | Must not appear in customer response. |
| AI raw payload | Must not appear in DTO, prompt-derived copy, error, or metadata. |
| Raw provider payload | Must never appear. |
| Raw LINE id | Must never appear. |
| Raw token / token hash | Must never appear. |
| Internal organization id | Must not appear. |
| Internal customer id | Must not appear. |
| Internal Case id | Must not appear. |
| Internal appointment id | Must not appear. |
| Internal report id | Must not appear. |
| Full phone | Must not appear. |
| Full address | Must not appear. |
| Billing / settlement internal rules | Must not appear. |
| Inventory internals | Must not appear. |
| Engineer internal comments | Must not appear. |
| Supervisor notes | Must not appear. |
| Dispatch suggestion confidence | Must not appear. |
| Route clustering | Must not appear. |
| Engineer scoring | Must not appear. |
| Stack trace / SQL / provider error | Must not appear. |

Future assertions should check response body, response envelope, nested `data`, `nextActions`, `displayHints`, `requestReference`, error objects, logs intended for test output, and AI-generated copy if AI is ever involved.

## Enumeration Protection Assertions

Future tests should verify:

- unknown, inaccessible, wrong-customer, wrong-organization, expired, revoked, already-used, malformed, and unsupported link states return same-shape customer-facing responses when safe-deny policy requires collapse,
- `messageKey` does not encode not-found, wrong-customer, exact token state, organization disabled, or channel mismatch details,
- `status` does not distinguish internal root causes that should collapse,
- `customerMessage` does not imply resource existence,
- `nextActions` do not differ in a way that reveals ownership or existence,
- `requestReference` pattern does not reveal internal ids or token state,
- no HTTP-detail concept or response metadata reveals resource existence,
- root cause remains internal audit/security classification only.

## Controller Bypass Test Concepts

Future tests should confirm:

- controllers do not return raw domain records,
- controllers do not query and assemble customer-facing DTOs directly,
- controllers do not make controller-local access decisions,
- controllers route through resolver before projection,
- controllers route denied/ambiguous states through safe-deny helper,
- controllers do not build resource-specific DTOs in safe-deny paths,
- projection service does not expand resolver allowed projection scope,
- response envelope is used consistently for success and unavailable states.

## AI Boundary Test Concepts

Future tests should confirm:

- AI is not part of resolver state decisions,
- AI is not part of verification pass/fail decisions,
- AI is not part of field visibility decisions,
- AI is not part of safe-deny reason selection,
- AI is not part of customer-visible status decisions,
- AI draft wording does not include internal denial reason,
- AI draft wording does not include audit reason,
- AI draft wording does not include billing rules,
- AI draft wording does not include engineer internal comments,
- AI draft wording does not include raw customer/provider data,
- AI output cannot bypass projection or response envelope.

## Future Implementation Checklist

Before adding test code, confirm:

- runtime code is explicitly authorized,
- Task371 data classification is adopted,
- Task372 response envelope is adopted,
- Task373 DTO field map is adopted,
- Task374 projection service contract is adopted,
- Task375 resolver contract is adopted,
- Task376 controller boundary contract is adopted,
- fixtures use fake / synthetic data,
- fixtures do not use real tokens, raw LINE ids, phone numbers, addresses, provider payloads, or production data,
- API/DB/browser smoke runs only after explicit disposable local/test runtime confirmation,
- shared / production / Zeabur runtime is not touched.

## Non-goals

Task377 does not:

- add test code,
- add smoke tests,
- run API tests,
- run DB tests,
- run browser tests,
- add runtime,
- add controller code,
- add route/API code,
- add helper code,
- add service code,
- add repository code,
- add interface code,
- add localization files,
- add migrations,
- add schema,
- add indexes,
- modify validators,
- modify Admin frontend,
- modify provider integrations,
- send LINE / SMS / Email / App notifications,
- implement customer portal,
- implement AI / RAG runtime,
- implement billing / settlement / invoice runtime,
- implement inventory / WMS runtime,
- implement file upload/download,
- implement photo/signature/document storage,
- implement survey, complaint, callback, or issue runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow.

## Risk and Limitations

This document is a future test scenario matrix, not test implementation.

The highest future testing risk is only testing successful projections and missing no-leak assertions for unavailable, ambiguous, and denied states. Future test implementation should prioritize safe-deny and forbidden-field assertions before broad customer-facing feature coverage.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No data model change.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document contains policy terms such as token, provider payload, raw LINE id, phone, address, secret, and `DATABASE_URL` only as examples of data that must not be exposed.

It does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.
