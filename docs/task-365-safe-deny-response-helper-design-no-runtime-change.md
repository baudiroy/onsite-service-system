# Task 365 - Safe-deny Response Helper Design / No Runtime Change

## Scope Summary

Task365 is a documentation-only design for a future safe-deny response helper.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task365 extends Task355 safe-deny message key design, Task360 / Task361 API contract proposals, Task362 projection permission filter design, Task363 verification design, and Task364 customerAccessContext proposal.

## Helper Purpose

The future safe-deny helper should convert access denial, unavailable, and verification-required states into consistent customer-safe responses.

It should:

- prevent controllers, projection services, notification delivery, or AI from generating customer messages from raw denial reasons,
- centralize non-enumerating response behavior,
- centralize localization key family selection,
- isolate internal denial reason from customer-facing wording,
- support timeline, service report, report issue, survey, completion report link, and related customer-visible surfaces,
- preserve customer channel identity and organization isolation boundaries,
- fail closed when mapping is missing or uncertain.

The helper must not become an authorization decision maker. Verification and access layers decide access; the helper only turns the resulting safe context into a customer-facing response.

## Proposed Inputs

These inputs are proposal-only and do not define a runtime interface.

Potential helper inputs:

- `customerAccessContext`,
- `requestedSurface`,
- `requestedAction`,
- `channelContext`,
- `preferredLocale`,
- `fallbackLocale`,
- `safeDenyPolicy`,
- `supportContactPolicy`.

Inputs must not include:

- raw LINE ID,
- raw provider payload,
- full phone,
- full address,
- full email,
- raw database identifiers,
- raw link value,
- full audit log,
- internal notes,
- raw AI prompt,
- raw AI output,
- detailed root denial reason intended only for internal audit.

The helper may receive a safe symbolic category such as `access_denied`, `verification_required`, `link_unavailable`, or `surface_unavailable`, but it should not receive customer-displayable raw root cause details.

## Proposed Output Shape

This output is proposal-only and does not define a runtime schema.

```json
{
  "ok": false,
  "messageKey": "customerAccess.genericUnavailable",
  "message": "目前無法顯示此內容，請確認連結或聯絡客服。",
  "action": {
    "type": "contactSupport",
    "labelKey": "customerCommon.contactSupport"
  },
  "retryAllowed": false
}
```

Output rules:

- `message` may be a future localization-resolved result, but Task365 does not add localization files.
- The response must not output root cause.
- The response must not output internal ids.
- The response must not output link validity detail.
- The response must not output LINE binding status.
- The response must not output organization existence.
- The response must not output raw link value, verification code, token, provider payload, or raw channel identifier.
- Optional support actions must be customer-safe.

If localization lookup fails in a future implementation, the helper should fail closed to a generic safe wording, not an internal error string.

## Message Key Mapping

These message keys are proposal-only and do not add localization files.

| Denial / unavailable category | Recommended key | Allowed surfaces | Customer-safe wording direction | Internal root causes that must collapse into this key | Enumeration risk note |
| --- | --- | --- | --- | --- | --- |
| Ambiguous access denial | `customerAccess.genericUnavailable` | Timeline, report, issue, survey, link pages, Web, LINE, App, SMS-directed pages, Email-directed pages. | Content cannot be shown; confirm the link or contact support. | Wrong customer, wrong organization, unknown Case, hidden Case, unknown report, cross-scope access, unavailable resource. | Do not reveal whether the resource exists or who owns it. |
| Verification needed | `customerAccess.verificationRequired` | Web, App, link pages, customer portal, channel handoff. | Ask customer to complete verification. | Unverified session, incomplete factor, missing safe session. | Use only when verification prompt itself does not confirm resource existence. |
| Link cannot be used | `customerAccess.linkUnavailable` | Completion report link, timeline link, service report link, SMS/Email-directed links. | Link currently cannot be used; obtain a new link or contact support. | Expired link, revoked link, malformed link, unsupported link state. | Do not reveal whether the link was once valid. |
| Action cannot proceed | `customerAccess.actionUnavailable` | Timeline action, report action, support action, generic entrypoint action. | Action cannot currently be processed. | Workflow state unavailable, action disabled, internal eligibility missing. | Do not reveal internal workflow state. |
| Issue entrypoint unavailable | `customerAccess.reportIssueUnavailable` | Report issue / unresolved issue entrypoint. | Issue report cannot currently be created. | Issue feature unavailable, access denied, complaint workflow unavailable. | Do not reveal complaint eligibility or internal classification. |
| Survey unavailable | `customerAccess.surveyUnavailable` | Satisfaction survey entrypoint. | Survey cannot currently be opened. | Survey not eligible, expired, suppressed, report unavailable, wrong customer. | Do not reveal survey eligibility or suppression reason. |
| Temporary failure | `customerAccess.tryAgainOrContactSupport` | Web, App, LINE, SMS-directed page, Email-directed page. | Try again later or contact support. | Internal projection error, provider status, temporary lookup failure. | Do not show stack traces or implementation details. |

## Scenario Behavior Matrix

| Scenario | Helper input category | Customer response key | Customer-visible behavior | Internal log / audit hint | Must not reveal |
| --- | --- | --- | --- | --- | --- |
| Wrong customer | `access_denied` | `customerAccess.genericUnavailable` | Generic unavailable / contact support. | `access_denied` with masked actor/channel summary. | Correct customer, Case existence, ownership. |
| Wrong organization | `access_denied` | `customerAccess.genericUnavailable` | Generic unavailable / contact support. | `cross_scope_access_denied` if future audit exists. | Tenant existence, organization name, resource existence. |
| Same external LINE ID in different channel/org | `access_denied` | `customerAccess.genericUnavailable` | Generic unavailable. | Scoped channel identity mismatch. | Whether the external id exists elsewhere. |
| Expired link | `link_unavailable` | `customerAccess.linkUnavailable` or generic unavailable if high risk. | Link cannot currently be used. | Link expired category only; no raw link value. | Whether the link was valid or tied to a real Case. |
| Revoked link | `link_unavailable` | `customerAccess.linkUnavailable` or generic unavailable if high risk. | Link cannot currently be used. | Link revoked category only; no revocation detail. | Revocation reason or related Case. |
| Missing consent | `verification_required` or `access_denied` | `customerAccess.verificationRequired` or `customerAccess.genericUnavailable` | Ask for verification/consent only when safe. | Missing consent category. | Case/customer ownership or consent root cause. |
| Unverified identity | `verification_required` | `customerAccess.verificationRequired` | Ask for verification without confirming resource ownership. | Verification required category. | Whether the requested resource exists. |
| Timeline unavailable | `surface_unavailable` | `customerAccess.actionUnavailable` or `customerAccess.genericUnavailable` | Timeline cannot currently be shown. | Projection unavailable category. | Internal lifecycle state or readiness reason. |
| Service report not ready | `surface_unavailable` | `customerAccess.actionUnavailable` or generic unavailable before verification. | Report cannot currently be shown. | Report projection unavailable category. | Internal Field Service Report status or existence. |
| Report issue unavailable | `surface_unavailable` | `customerAccess.reportIssueUnavailable` | Issue report cannot currently be created. | Issue workflow unavailable category. | Complaint eligibility or internal classification. |
| Survey unavailable / not eligible | `surface_unavailable` | `customerAccess.surveyUnavailable` | Survey cannot currently be opened. | Survey unavailable category. | Suppression reason, report status, customer match. |
| Internal projection error | `temporary_failure` | `customerAccess.tryAgainOrContactSupport` | Try again later or contact support. | Internal error category with redacted details. | Stack trace, SQL, provider details, internal ids. |
| AI draft exists but not approved | `surface_unavailable` | `customerAccess.actionUnavailable` or omit AI-related state. | Do not mention AI draft. | Draft not approved category if needed. | AI workflow existence or draft content. |
| Customer tries another customer's case/report/action link | `access_denied` | `customerAccess.genericUnavailable` | Generic unavailable / contact support. | Suspected enumeration or wrong-customer access. | Whether the other Case/report exists. |

## Interaction Boundaries

### Verification Layer

The verification layer determines access context. It should not ask the safe-deny helper to decide whether access is allowed.

### Projection Service

The projection service should ask the helper for a deny response only when access is denied, unavailable, or verification is required.

It should not pass raw internal data or raw root denial reasons into the helper.

### API Controller

The API controller should return the helper response without adding raw details, stack traces, internal ids, or provider error details.

### Localization Layer

The localization layer may resolve `messageKey` in the future.

Task365 does not add localization files.

Localization missing behavior should fail closed to generic safe wording.

### Audit / Security Event Boundary

Internal audit/security events may record a minimum necessary category separately from customer-facing response.

Detailed root causes should not be included in customer-facing output.

### AI Boundary

AI must not generate customer-facing deny responses from raw denial reasons.

AI must not modify safe-deny mapping, publish localization, or see complete raw denial context unless it passes minimum necessary, masked/redacted, permission-aware, tenant-isolated, auditable gates.

### Notification Delivery

Future notification delivery should not bypass safe-deny behavior. If a link/action is unavailable, notification surfaces must use customer-safe wording and avoid root cause details.

## Safe-deny Collapse Rules

Future implementation should follow these collapse rules:

- Wrong customer, wrong organization, unknown Case, unknown report, hidden Case, unavailable report, and ambiguous access failures usually collapse to `customerAccess.genericUnavailable`.
- Unverified identity may use `customerAccess.verificationRequired` only when showing a verification prompt does not create enumeration risk.
- Expired, revoked, malformed, or unsupported links may collapse to `customerAccess.linkUnavailable`, but must not reveal link state details.
- Unavailable issue or survey actions may use action-specific unavailable keys.
- Internal errors must not expose stack traces, database details, provider details, implementation details, or internal ids.
- Missing localization must fail closed to a generic safe wording.
- AI draft availability must not be surfaced as a customer-facing state.

## AI Boundary

AI may help draft customer-safe wording variants for product review.

AI must not:

- generate deny messages from raw denial reasons,
- modify message key mapping,
- publish localization,
- decide access,
- alter `customerAccessContext`,
- bypass verification, consent, organization scope, or safe-deny,
- receive complete raw denial context unless minimum necessary and redacted.

AI output must remain a draft until product/localization review approves it.

## Non-goals

Task365 does not:

- add helper code,
- add localization files,
- add runtime response helper,
- add an API route,
- add a controller,
- add a service,
- add a repository,
- add a validator,
- add projection service runtime,
- add verification runtime,
- add notification sending,
- add smoke tests,
- modify schema, migration, or indexes,
- touch provider integrations,
- touch LINE / SMS / Email / App runtime,
- touch AI / RAG runtime,
- touch billing / settlement runtime,
- touch quote / payment / invoice runtime,
- touch inventory / WMS runtime,
- touch customer-facing report runtime,
- touch survey runtime,
- touch complaint / callback runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case workflow.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task365.

### Safe-deny Helper Interface Proposal / Implementation

Define and implement a helper only after API, verification, projection, localization, and audit/security boundaries are approved.

### Customer-visible Localization File Implementation

Create actual localization files after product copy review and key naming approval.

### Safe-deny API Response Contract Tests

Test response shape and no-leak behavior after runtime exists.

### Access-control Smoke / Integration Tests

Add tests only after disposable local/test runtime is confirmed and runtime exists.

### Audit / Security Event Boundary Design

Define safe internal categories and redaction behavior for access denial events.

### Notification Delivery Policy Alignment

Ensure delivery channels use safe-deny behavior and do not leak denial details.

### Product Copy Review

Review customer-facing deny wording for tone, clarity, and privacy.

## Risk and Limitations

This document is not runtime approval. It defines the future helper behavior only.

Future implementation must still resolve:

- helper interface,
- message key file structure,
- localization fallback behavior,
- API response status codes,
- audit/security event mapping,
- support action policy,
- notification delivery alignment,
- tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file or helper code is added by Task365.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

Future safe-deny helper implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.
