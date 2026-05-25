# Task409 — Customer-Facing Audit / Security Event Permission Matrix Proposal / No Runtime Change

Task409 proposes the future permission matrix for customer-facing audit/security
event visibility. It is documentation-only and does not authorize permission
runtime, audit query runtime, DB, migration, repository, resolver, API,
provider, AI, or smoke work.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

Task409 follows the Task370-408 customer-facing no-runtime baseline.

Already accepted:

- Pure customer-facing utilities.
- Pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.
- Token/link lifecycle proposal.
- Audit/security event model proposal.

Current state remains:

- no permission runtime,
- no audit/security event query runtime,
- no audit/security event persistence,
- no customer-facing runtime,
- no resolver runtime,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task409 does not authorize runtime, DB, or permission implementation.

## Permission Matrix Principles

Future audit/security event queries must follow the Data Access Control / Data
Permission Model.

Principles:

- Default deny.
- Tenant-scoped.
- Minimum necessary.
- Role + permission + organization scope + purpose-bound access.
- Entitlement does not replace permission.
- Permission does not replace organization isolation.
- Admin privileges must not mask cross-organization access problems.
- AI insight must not cross tenants.
- AI insight must not read raw event full text.
- Export/reporting must use the same permission model.

## Role Visibility Proposal

This is a future proposal only and is not implemented in Task409.

| Role | May see | Must not see | Decision category | Symbolic refs | Token/link event candidate | Export | Elevated permission / break-glass |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SaaS platform admin | Aggregated operational/security metadata across tenants only when a future platform support policy allows it. | Raw token, raw channel id, complete contact data, tenant-private full event text, provider payloads. | Masked platform-level categories only. | Cross-tenant symbolic refs only if future policy allows. | Aggregated or masked only. | Future separate permission required. | Future break-glass design required; not implemented. |
| Tenant admin | Tenant-scoped sanitized event metadata for their organization. | Cross-organization data, raw token, raw channel id, complete contact data, raw provider payloads. | Internal categories only if permitted. | Tenant-scoped symbolic refs. | Masked token/link refs only if permitted. | Future permission required. | Future break-glass design required; not implemented. |
| Tenant support / customer service | Sanitized support context needed to help a customer. | Raw token, raw channel id, security denial internals beyond support purpose, complete sensitive fields unless separately authorized. | Limited support-safe categories. | Symbolic customer/resource refs if needed. | Masked token/link refs only if needed. | Usually no export by default. | Future elevated support permission required. |
| Dispatcher | Usually no audit/security event access; may see minimal appointment-related operational hints in future workflows. | Raw token, channel identity, security denial reason, unrelated customer/case events. | No by default. | No by default. | No by default. | No. | Not recommended except future explicit policy. |
| Engineer | Minimal service context for assigned appointments only, not audit/security internals. | Raw token, channel identity, security denial reason, customer binding status, unrelated case events. | No. | No, except future appointment-safe context. | No. | No. | Not recommended. |
| Finance / settlement staff | Billing/settlement-related sanitized audit metadata only if needed for an authorized finance workflow. | Token/channel identity/security denial internals, unrelated customer access events, raw provider payloads. | Limited finance-relevant categories only. | Resource refs only if tied to settlement workflow. | No by default. | Future finance export permission required. | Future separate design required. |
| Security reviewer | Tenant-scoped or platform-scoped sanitized security metadata based on future policy. | Raw token, raw channel id, complete contact data, provider payloads, unrelated tenant data. | Yes, internal security categories if permitted. | Symbolic refs for investigation. | Masked token/link refs if permitted. | Future controlled export only. | Future break-glass design required. |
| AI insight / AI assistant | Masked, minimized, permission-filtered metadata for pattern summary only. | Raw event full text, raw token, raw provider payload, complete contact data, internal notes. | Aggregated or masked categories only. | Aggregated/symbolic only. | Masked only. | No direct export. | No autonomous elevated access. |
| Customer | Customer-facing safe response/report/issue status only through projection policy. | Any internal audit/security event metadata. | No. | No. | No. | No. | No. |

This matrix is a proposal only. It does not create roles, permissions, queries,
exports, screens, APIs, or audit tables.

## Always-forbidden Visibility

By default, no role should directly see these values through audit/security
event visibility:

- raw token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- complete phone number,
- complete address,
- raw provider payload,
- AI raw payload,
- internal note full text,
- audit log full text,
- billing/settlement internal data full text,
- cross-organization event data,
- unfiltered production customer data.

Any future exception would require a separate explicit policy, break-glass
design, permission model, audit trail, retention policy, and redaction review.

## Customer-visible Boundary

Customers must not see internal audit/security events.

Customer-facing responses must not expose:

- resolver denial reason,
- token status,
- channel binding status,
- identity mismatch details,
- resource existence details,
- security categories,
- internal audit summaries.

Customers may only see customer-facing safe responses, projected reports,
appointment summaries, completion status, or issue/follow-up status, and only
through the future projection policy.

Generic safe-deny must still not reveal whether a token, customer, case,
appointment, report, or channel identity exists.

## Engineer Visibility Boundary

Engineers must not see:

- raw token,
- raw channel identity,
- security denial reason,
- customer binding status,
- unrelated customer-facing access attempts,
- audit/security event internals.

Engineers may only see future authorized service context for their assigned
appointment/dispatch workflows. That context must remain minimum necessary and
must not change the invariant that one Case has one formal Field Service
Report.

## Support / Tenant Admin Boundary

Tenant support may need sanitized support context, but must not see raw tokens,
raw channel ids, raw provider payloads, or complete sensitive fields by default.

Tenant admins must not cross organization scope. Tenant admin permission does
not imply SaaS platform visibility or cross-tenant access.

Future high-risk actions require separate permission and audit design:

- reissue token/link,
- revoke token/link,
- unlink channel identity,
- merge identities,
- disable identity,
- break-glass support access.

Break-glass is a future proposal only and is not implemented in Task409.

## AI Insight Boundary

AI may assist with future suspicious-pattern summaries only under strict
limits:

- masked metadata only,
- minimized data only,
- permission-filtered data only,
- tenant-scoped data only,
- human-controlled output only.

AI must not:

- read raw token,
- read raw provider payload,
- read complete phone number,
- read complete address,
- read internal note full text,
- read audit/security event full text,
- decide block or unblock,
- revoke or reissue tokens,
- merge or unlink identities,
- close complaints,
- close cases,
- create cross-tenant insights.

AI insight must not become a shortcut around Data Access Control.

## Export / Reporting Boundary

Audit/security event export is high risk and should be disabled by default.

Future export/reporting must require:

- explicit feature entitlement if applicable,
- role permission,
- organization scope,
- purpose-bound access,
- field-level masking,
- audit trail,
- retention/download expiry,
- SaaS usage tracking where applicable.

Reports, dashboards, AI insights, scheduled reports, and exports must all use
the same Data Access Control model.

Sanitized event fields must not be recombined to reconstruct complete personal
data or raw channel identity.

## Future Task Candidates

These are future candidates only and are not implemented by Task409:

- audit/security event permission key design proposal,
- break-glass policy proposal,
- support-safe audit view proposal,
- security reviewer workflow proposal,
- audit/security event export policy proposal,
- AI insight event metadata policy proposal.

Any future runtime task must be separately authorized and must remain one
bounded task at a time.

## Explicit Non-goals

Task409 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add permission runtime,
- add audit/security event query runtime,
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

Task409 records a future audit/security event permission matrix proposal only.

Decision summary:

- Audit/security event visibility must be default-deny, tenant-scoped,
  minimum necessary, permission-aware, and purpose-bound.
- Customers, engineers, AI assistants, and general staff must not see raw
  audit/security internals.
- Support, tenant admin, security reviewer, and SaaS platform roles require
  separate future permission and break-glass designs before elevated access.
- Export/reporting of audit/security events is high-risk and must be separately
  designed.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task409 completion:

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
