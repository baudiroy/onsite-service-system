# Task417 — Customer-Facing Synthetic Fixture Policy Proposal / No Runtime Change

Task417 defines a future synthetic fixture policy for customer-facing tests,
local-only runtime spikes, demo fixtures, projection fixtures, safe-deny tests,
token/link tests, and customer channel identity tests.

This task is documentation-only. It does not add fixture files, tests, runtime,
API, DB, provider sending, or AI runtime.

## Current Baseline

Task417 follows the Task370-416 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing pure utilities.
- Forbidden field constants.
- Projection DTO / projection service skeleton.
- Pure utility unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity proposal.
- Token/link lifecycle proposal.
- Audit/security event proposal.
- Audit/security event permission matrix.
- Generic safe-deny localization/message key proposal.
- Safe-deny test matrix proposal.
- Runtime readiness cutline.
- Rate-limit / abuse protection proposal.
- Support fallback workflow proposal.
- Local-only runtime authorization checklist.
- Projection allow-list checklist.

Current state remains:

- no customer-facing runtime,
- no fixture files added,
- no test files added,
- no projection utility modification,
- no forbidden field constants modification,
- no route/controller/API implementation,
- no resolver runtime,
- no repository / DB access,
- no migration / schema / index,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task417 is a docs-only fixture policy. It is not fixture, test, or runtime
implementation.

## Synthetic Fixture Principles

Future customer-facing fixtures must be completely synthetic.

Principles:

- Fixtures must not use production data.
- Fixtures must not use customer data.
- Fixtures must not use provider payloads.
- Fixtures must not use real LINE identifiers.
- Fixtures must not use real SMS identifiers.
- Fixtures must not use real Email identifiers.
- Fixtures must not use real App identifiers.
- Fixtures must not use real names.
- Fixtures must not use real phone numbers.
- Fixtures must not use real addresses.
- Fixtures must not use raw tokens.
- Fixtures must not use raw channel ids.
- Fixtures must not use provider ids.
- Fixtures must not be derived from real data by simple masking.
- Fixtures must not look like real contactable personal data.
- Fixtures must be tenant-scoped.
- Fixtures must be purpose-scoped.
- Fixtures must be minimum necessary.

Masked production data is not allowed by default. If a future data
anonymization policy is approved, it must be explicit and separate. Until then,
fixture data must be invented synthetic data only.

## Allowed Symbolic Fixture Patterns

The patterns below are examples of future symbolic references only. They are
not real ids, not formal schema, and not created by Task417.

Allowed symbolic pattern types:

- `org_test_alpha`
- `org_test_beta`
- `cust_ref_alpha`
- `cust_ref_beta`
- `case_ref_alpha`
- `case_ref_beta`
- `appointment_ref_alpha`
- `appointment_ref_beta`
- `report_ref_alpha`
- `report_ref_beta`
- `channel_ref_line_alpha`
- `channel_ref_sms_alpha`
- `channel_ref_web_alpha`
- `channel_ref_app_alpha`
- `channel_ref_email_alpha`
- `channel_ref_phone_alpha`
- `token_ref_valid_alpha`
- `token_ref_expired_alpha`
- `token_ref_revoked_alpha`
- `token_ref_wrong_purpose_alpha`
- `token_ref_wrong_org_alpha`
- `token_ref_wrong_resource_alpha`
- `reqref_test_alpha`
- `audit_event_ref_alpha`

These examples are symbolic names for future fixtures. They must not contain:

- raw token,
- raw channel id,
- complete phone number,
- complete address,
- real provider payload,
- real customer data,
- production data.

## Forbidden Fixture Contents

Future customer-facing fixtures must not include:

- real customer name,
- complete phone number,
- complete address,
- raw token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- `line_user_id` value,
- provider webhook payload,
- LINE raw provider identifier,
- SMS raw provider identifier,
- Email raw provider identifier,
- App raw provider identifier,
- AI raw payload,
- internal note full text,
- audit log full text,
- billing internal data,
- settlement internal data,
- production-like exported rows,
- copied screenshots,
- customer documents,
- signature content,
- photo content,
- file content,
- document content.

Fixtures should not include realistic personal data even if fake. Use symbolic
references instead.

## Tenant and Organization Fixture Rules

Future isolation tests should include at least two symbolic organizations when
testing tenant boundaries.

Rules:

- Use separate symbolic organizations, such as `org_test_alpha` and
  `org_test_beta`.
- Cross-organization mismatch cases must use symbolic references only.
- Fixtures must never allow lookup across organization boundaries.
- SaaS-ready assumptions must be explicit.
- Permission, entitlement, seat, usage, and subscription must not be collapsed
  into one fixture field.
- Organization scope must be present in test design when access decisions are
  involved.
- Cross-organization denial must externally collapse to generic safe-deny.

Fixture design must not imply that a customer, channel identity, token, report,
or appointment can be globally unique outside organization scope.

## Channel Identity Fixture Rules

LINE must not be the only fixture channel.

Future channel fixtures should support symbolic versions of:

- LINE,
- SMS,
- Web Link,
- App,
- Email,
- future phone-assisted flow.

Channel fixture should distinguish:

- channel type,
- channel instance reference,
- symbolic channel user reference,
- verification state,
- consent state,
- organization scope,
- customer reference.

Rules:

- `line_user_id` must not be treated as global identity.
- Fixture must not contain real phone number.
- Fixture must not contain real email address.
- Fixture must not contain raw channel id.
- Fixture must not contain provider payload.
- Channel identity must be resolved through future resolver/access context, not
  by projection or controller shortcuts.

## Token / Link Fixture Rules

Future token fixtures must use sanitized token references only.

Do not place raw token values in fixtures.

Token fixture states should be able to represent:

- valid,
- missing,
- malformed,
- expired,
- revoked,
- wrong purpose,
- wrong organization,
- wrong resource,
- wrong channel identity.

Rules:

- External response tests must not reveal token state.
- Token fixture differences must not produce existence leakage.
- Token references must not be log-visible secrets.
- Token references must not be treated as customer identity.
- Token references must not bypass resolver authorization.

## Projection Fixture Rules

Projection fixtures should contain both allowed-field candidates and
forbidden-field candidates.

Rules:

- Forbidden-field candidates must be synthetic placeholders only.
- Forbidden-field candidates must not contain real sensitive content.
- Tests should assert forbidden fields are removed or rejected.
- Customer-facing output fixture must not contain internal note.
- Customer-facing output fixture must not contain audit log.
- Customer-facing output fixture must not contain AI raw payload.
- Customer-facing output fixture must not contain billing/settlement internal
  data.
- Customer-facing output fixture must not contain raw provider payload.
- Customer-facing output fixture must not contain raw token.
- Customer-facing output fixture must not contain raw channel id.
- Customer-facing output fixture must not contain complete phone number.
- Customer-facing output fixture must not contain complete address.

Field Service Report invariant:

- Fixture design must preserve one Case equals one formal Field Service Report.
- Multiple appointments / visits may exist under one Case.
- Fixtures must not imply one appointment creates one formal report.
- finalAppointmentId should be symbolic and backend/system-resolved in future
  test design.

## Issue / Follow-up / Complaint Fixture Rules

Issue/follow-up fixture acknowledgement must not confirm whether a Case, Field
Service Report, or Appointment exists.

Rules:

- Low score fixture must not be automatically closed.
- Negative feedback fixture must not be hidden.
- Complaint fixture must not be automatically closed.
- Follow-up fixture must not modify official Case/Appointment/Report state.
- Fixture may express a future escalation candidate.
- Fixture escalation candidate is not runtime implementation.
- Do not use real complaint text.
- Do not use real support conversation text.
- Do not use copied customer chat content.

AI may be represented only as symbolic suggestion state, never as a raw prompt
or raw model response.

## AI and Observability Fixture Boundary

AI-related fixtures must be masked, minimized, and synthetic.

Forbidden:

- raw prompt payload,
- raw model response,
- customer personal data,
- internal note full text,
- audit/security event full text,
- raw provider payload,
- complete phone number,
- complete address,
- raw channel id.

Observability fixtures must use sanitized references only.

Synthetic fixtures must not be designed so they can be connected back to a real
customer, real organization, real provider, real channel identity, or production
event.

## Future Fixture Readiness Checklist

The checklist below is future-only. Task417 does not create fixture files.

- Define synthetic naming convention.
- Define tenant isolation fixture set.
- Define channel identity fixture set.
- Define token/link lifecycle fixture set.
- Define projection allow/deny fixture set.
- Define safe-deny equivalence fixture set.
- Define issue/follow-up acknowledgement fixture set.
- Define audit/security candidate fixture set.
- Define fixture sensitive scan rule.
- Define no raw provider payload rule.
- Define no production-like exported rows rule.
- Define no copied screenshot/document/file content rule.

Each item requires separate future approval before fixture or test files are
created.

## Explicit Non-goals

Task417 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- modify projection utilities,
- modify forbidden field constants,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement repository runtime,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement support workflow runtime,
- implement case runtime,
- implement complaint runtime,
- implement follow-up runtime,
- implement link reissue runtime,
- implement rate-limit middleware,
- implement abuse detection runtime,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- add audit write / log runtime / worker,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task417 records a future customer-facing synthetic fixture policy only.

Decision summary:

- Future customer-facing fixtures must be fully synthetic.
- Production data and production-like exports are forbidden by default.
- Raw tokens, raw channel ids, `line_user_id` values, complete phone numbers,
  complete addresses, provider payloads, screenshots, customer documents,
  signatures, photos, and files are forbidden.
- Tenant isolation, channel identity, token/link, projection, safe-deny,
  issue/follow-up, audit/security, AI, and observability fixtures must use
  symbolic references.
- No fixture/test/runtime/API/DB/provider/AI work is implemented by Task417.

## Verification Plan

For Task417 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only policy.

## Redaction Note

This document contains symbolic examples and policy terms such as token,
secret, raw channel id, phone, address, provider payload, `DATABASE_URL`,
`line_user_id`, and Zeabur only as examples of data or runtime boundaries that
must not be exposed or touched without authorization. It does not include
credentials, database URLs, access tokens, secrets, complete customer phone
numbers, complete customer addresses, raw channel identifiers, raw provider
payloads, verification codes, production data details, copied screenshots,
customer documents, signatures, photos, or file contents.
