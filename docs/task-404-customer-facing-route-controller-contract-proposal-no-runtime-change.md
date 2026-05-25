# Task404 — Customer-Facing Route / Controller Contract Proposal / No Runtime Change

Task404 proposes the future customer-facing route/controller contract. It is
documentation-only and does not authorize runtime.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

Task404 follows the Task370-403 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing design documents.
- Pure utilities.
- Pure unit tests.
- Pure utility consistency and closure reviews.
- Shared forbidden field-name constants.
- Runtime entry gate decision packet.

Current state remains:

- no customer-facing runtime,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task404 does not authorize runtime.

## Proposed Future Route Families

These route families are future-only proposals. They are not implemented in
Task404.

| Future route family | Purpose | Current status |
| --- | --- | --- |
| Customer-facing service report view | Let a verified customer view a customer-safe service report summary. | Future only; no implementation now. |
| Customer-facing appointment summary view | Let a verified customer view a customer-safe appointment or visit summary. | Future only; no implementation now. |
| Customer-facing completion status view | Let a verified customer view completion status and customer-safe next steps. | Future only; no implementation now. |
| Customer-facing issue / follow-up entry point | Let a verified customer submit a problem-not-resolved or follow-up request. | Future only; no implementation now. |

Each future route must use the same access and projection flow. A route family
must not become a shortcut around resolver, customer access context, projection,
or response envelope utilities.

## Controller Contract Boundary

A future customer-facing controller may only orchestrate:

1. Receive the request.
2. Validate request shape without revealing exact resource state.
3. Call the resolver.
4. Receive or build a `customerAccessContext`.
5. Call the projection DTO / projection service layer.
6. Wrap the projection with a response envelope or generic safe-deny response.

A future customer-facing controller must not directly:

- query repositories,
- query DB,
- decide final formal authorization by itself,
- build customer-visible DTOs from raw records,
- expose internal notes,
- expose audit logs,
- expose AI raw payloads,
- expose billing or settlement internal data,
- expose engineer internal comments,
- expose supervisor review data,
- expose vendor reconciliation rules,
- expose raw provider payloads,
- change Case status,
- change Appointment status,
- change Field Service Report status,
- send LINE, SMS, Email, App, or survey notifications,
- call AI providers, RAG, vector DB, or model runtime.

Controllers must remain orchestration-only.

## Mandatory Future Execution Flow

Future runtime must not bypass this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Boundary responsibilities:

- Route/controller: request entry and orchestration only.
- Resolver: organization scope, channel identity, token/access state, and
  allowed projection scope.
- Customer access context: internal sanitized access result, not customer DTO.
- Projection: allow-listed customer-safe data shape.
- Envelope/safe-deny: customer-safe response structure and generic failures.

## Safe-deny and No-leakage Rules

Future runtime must collapse sensitive failure cases to generic safe-deny where
appropriate:

- invalid token,
- expired token,
- revoked token,
- already-used token,
- wrong organization,
- wrong channel identity,
- missing customer access context,
- malformed request,
- deleted resource,
- unavailable resource,
- hidden resource,
- unauthorized resource,
- disabled organization,
- missing case,
- missing appointment,
- missing service report.

Customer-facing output must not reveal existence or exact internal reason
through:

- HTTP status code selection,
- message key,
- response field shape,
- timing difference,
- next action labels,
- request reference content,
- debug metadata,
- logs surfaced to the client.

Exact failure details may be recorded in future internal audit/security events
only if separately designed and authorized, and never as customer-visible raw
details.

## Customer-visible Data Policy

Customer-facing service report and related route families must not expose:

- internal note,
- audit log,
- AI raw payload,
- AI risk flag,
- billing internal data,
- settlement internal data,
- engineer internal comments,
- supervisor review information,
- vendor reconciliation rules,
- internal cost,
- raw provider payload,
- raw channel identity,
- unfiltered source records.

If customer fees are involved, future customer-facing output may only show
confirmed customer-relevant charge, approval, invoice, receipt, or payment
status information. It must not show internal settlement price, vendor billing
rules, engineer cost, internal discount reasons, or reconciliation internals.

Field Service Report remains one formal report per Case. Future route/controller
design must not change the `field_service_reports.case_id` uniqueness principle
or turn appointments into multiple formal reports.

## Channel-agnostic Identity

Future customer access runtime must remain channel-agnostic.

Requirements:

- Do not make LINE the only channel model.
- Do not treat `line_user_id` as a global identity.
- Support generic customer channel identity concepts.
- Keep future App, Web, SMS, Email, and additional provider identities
  compatible.

Minimum future identity scope should consider:

- `organization_id`,
- channel type,
- channel instance / channel id,
- channel user identity,
- verification state,
- consent state,
- customer identity binding,
- expiry / revocation / one-time-use state where applicable.

Raw channel identity must not be returned in customer-facing responses.

## Audit / Rate Limit / Abuse Boundary

Task404 only proposes route/controller boundaries. It does not add audit,
rate-limit, or abuse runtime.

Future runtime will need separate tasks for:

- audit/security event model,
- masked audit summaries,
- access-denied events,
- rate-limit policy,
- abuse-suspected policy,
- retry guidance,
- operational alerting,
- log redaction.

Internal audit or abuse signals must not become exact customer-visible reasons.

## Future Task Candidates

These are future candidates only and are not implemented by Task404:

- customer-facing resolver contract proposal,
- customer channel identity persistence proposal,
- audit/security event model proposal,
- customer-facing route/controller test matrix proposal,
- customer-facing localization/message key proposal,
- local-only disposable runtime spike after explicit authorization.

Any future code task must remain one bounded task and must not use this document
as runtime approval.

## Explicit Non-goals

Task404 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add helper/service/repository/interface code,
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

Task404 records a future route/controller contract proposal only.

Decision summary:

- Customer-facing route/controller runtime remains unauthorized.
- Future controllers must be orchestration-only.
- Future runtime must preserve resolver -> customerAccessContext -> projection
  -> envelope/safe-deny.
- Future route families are listed as proposal only.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task404 completion:

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
