# Task408 — Customer-Facing Audit / Security Event Model Proposal / No Runtime Change

Task408 proposes the future customer-facing audit/security event model
boundary. It is documentation-only and does not authorize audit persistence,
security event persistence, log runtime, workers, DB, migration, repository,
resolver, API, provider, or runtime work.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

Task408 follows the Task370-407 customer-facing no-runtime baseline.

Already accepted:

- Pure customer-facing utilities.
- Pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.
- Token/link lifecycle proposal.

Current state remains:

- no customer-facing runtime,
- no audit/security event persistence,
- no token/link generation runtime,
- no customer channel identity persistence,
- no resolver runtime,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task408 does not authorize DB, migration, audit persistence, security event
persistence, log runtime, workers, or provider sending.

## Audit vs Security Event Distinction

Audit event:

- Supports traceability for system, user, workflow, and operational decisions.
- Helps answer who/what/when/why for authorized processes.
- Must be tenant-scoped, minimum necessary, permission-aware, and redacted.

Security event:

- Supports detection of abuse, suspicious access, enumeration risk,
  token/link risk, identity ambiguity, and abnormal access behavior.
- Helps support operational security review and future alerting.
- Must be tenant-scoped, minimum necessary, permission-aware, and redacted.

Both event types must not be customer-visible and must not contain:

- raw token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- complete customer phone number,
- complete customer address,
- raw provider payload,
- AI raw payload,
- internal note full text,
- audit log full text,
- billing/settlement internal data.

## Future Event Candidate Families

These are future candidates only and are not implemented in Task408.

| Event candidate family | Event type | Purpose | Current status |
| --- | --- | --- | --- |
| Customer-facing route access attempted | Audit/security candidate | Trace access attempt and detect unusual patterns. | Future only; no persistence now. |
| Resolver allowed / denied decision candidate | Audit/security candidate | Record internal access decision category without exposing it externally. | Future only; no persistence now. |
| Token/link verify attempted | Audit/security candidate | Trace token/link verification attempt. | Future only; no persistence now. |
| Token/link expired / revoked / malformed candidate | Security candidate | Detect invalid or risky token/link activity. | Future only; no persistence now. |
| Channel identity mismatch / unverified / no consent candidate | Security candidate | Detect identity or consent mismatch risks. | Future only; no persistence now. |
| Generic safe-deny emitted | Audit/security candidate | Trace customer-safe denial without leaking exact reason. | Future only; no persistence now. |
| Suspicious repeated access pattern candidate | Security candidate | Detect abuse, scraping, or enumeration risk. | Future only; no persistence now. |
| Duplicate / ambiguous identity candidate | Security candidate | Flag ambiguous customer/channel identity situations. | Future only; no persistence now. |
| Issue/follow-up entry submitted candidate | Audit candidate | Trace customer-submitted issue/follow-up entry. | Future only; no persistence now. |
| Customer-facing report viewed candidate | Audit candidate | Trace customer-facing report access where policy permits. | Future only; no persistence now. |

No event candidate in this list creates a table, repository, worker, log
runtime, alert, or provider action in Task408.

## Sanitized Event Fields Proposal

This is a future proposal only and is not implemented in Task408.

Future audit/security event candidates may use sanitized fields such as:

- organization scope reference,
- symbolic route family,
- sanitized request reference,
- symbolic customer identity reference,
- symbolic channel identity reference,
- symbolic resource reference,
- sanitized token reference,
- event category,
- severity candidate,
- decision category for internal use only,
- timestamp placeholder,
- actor/system source placeholder,
- correlation reference.

Future event candidates must not include:

- raw token,
- raw provider payload,
- raw channel id,
- complete phone number,
- complete address,
- internal note full text,
- audit log full text,
- AI raw payload,
- billing/settlement internal data,
- unfiltered source records,
- production customer data.

## No Existence Leakage Boundary

Audit/security events may preserve internal categories for authorized internal
review, but external customer-facing responses must not reveal:

- whether a token exists,
- whether a token was previously valid,
- whether a token expired,
- whether a token was revoked,
- whether a customer exists,
- whether a channel identity is bound,
- whether a Case exists,
- whether an Appointment exists,
- whether a Field Service Report exists.

External response behavior must continue to use generic safe-deny and must not
leak reason through:

- status code,
- message key,
- response shape,
- field count,
- redirect path,
- timing,
- next action wording,
- route-specific wording,
- resolver denial reason.

## Permission and Access Control

Future audit/security event query access must follow the Data Access Control /
Data Permission Model.

Principles:

- Audit/security events must not be queryable across organizations.
- Audit/security events must be scoped by tenant and permission.
- Tenant admin, SaaS admin, support, engineer, finance, AI insight, and
  operations roles require separate future visibility design.
- Customer-facing users must not see audit/security event internals.
- AI must not directly read raw audit/security event full text.
- Export/download/scheduled reports involving audit/security events require
  separate permission, masking, retention, and usage-tracking design.

## Resolver / Token / Identity Integration Boundary

Future components may produce event candidates, but Task408 does not implement
them.

Future candidate sources:

- route/controller access attempt,
- resolver decision,
- token/link verification,
- customer channel identity lookup,
- generic safe-deny emission,
- issue/follow-up submission.

Boundaries:

- Controller must not expose internal denial reason to customer output.
- Projection must not include audit/security event data.
- Token/link lifecycle must not log raw tokens.
- Customer channel identity lookup must not expose raw channel identifiers.
- Provider workers must not bypass resolver or event redaction policy.

## Retention / Redaction / Observability Proposal

Future audit/security event model should support:

- retention policy,
- redaction policy,
- tenant-scoped observability,
- sanitized references,
- permission-aware access,
- operational correlation references,
- safe internal summaries.

Future observability must not:

- log raw token,
- log secret,
- log raw channel id,
- log complete customer phone number,
- log complete customer address,
- send sensitive event payload to analytics,
- send sensitive event payload to error tracking,
- show sensitive event payload in customer-facing reports,
- send sensitive event payload to AI providers.

## AI Boundary

AI may assist future security/operations review only under strict boundaries:

- AI may summarize suspicious patterns from masked/minimized metadata.
- AI may help group repeated safe-deny patterns.
- AI may help draft internal risk summaries for authorized staff.

AI must not:

- decide formal blocking,
- decide unblocking,
- revoke tokens,
- reissue tokens,
- close cases,
- close complaints,
- read raw tokens,
- read raw provider payloads,
- read full audit logs,
- read internal note full text,
- read complete customer phone numbers,
- read complete customer addresses,
- cross tenant boundaries.

AI insight must remain permission-aware, tenant-scoped, and human-controlled.

## Future Task Candidates

These are future candidates only and are not implemented by Task408:

- audit/security event schema design proposal,
- audit/security event retention policy proposal,
- audit/security event permission matrix proposal,
- resolver/token/channel identity event test matrix proposal,
- observability redaction policy proposal,
- local-only disposable audit/security event spike after explicit
  authorization.

Any future DB/migration/schema task must be separately authorized and must not
target shared/prod/Zeabur without explicit approval.

## Explicit Non-goals

Task408 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add helper/service/repository/interface code,
- add audit/security event tables,
- add audit writes,
- add log runtime,
- add workers,
- add token/link generation runtime,
- add customer channel identity tables,
- add resolver runtime,
- add controller/route/API runtime,
- add repository access,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task408 records a future audit/security event model proposal only.

Decision summary:

- Audit and security events are distinct but both must be tenant-scoped,
  minimum necessary, permission-aware, and redacted.
- Event candidates must not be customer-visible.
- Internal categories must not create existence leakage.
- Raw tokens, raw channel identities, complete contact data, raw provider
  payloads, and AI raw payloads must not be stored in event details.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task408 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only proposal.

## Redaction Note

This document contains policy terms such as token, secret, raw channel identity,
phone, mobile, address, provider payload, and `DATABASE_URL` only as examples of
data that must not be exposed. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
