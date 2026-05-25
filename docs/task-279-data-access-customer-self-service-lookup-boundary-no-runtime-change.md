# Task 279 - Data Access Customer Self-Service Lookup Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Data Access Control / Data Permission Model branch from Task274 through Task278.

The purpose is to define future-only boundaries for customer self-service lookup through LINE, SMS, Email, Web portal, App, or other customer channels.

Task279 is documentation-only.

This task is not:

- customer self-service lookup runtime,
- reverse binding runtime,
- notification sending runtime,
- provider sending runtime,
- permission runtime,
- entitlement runtime,
- subscription runtime,
- usage tracking runtime,
- report / export / download runtime,
- scheduled report runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation.

Task279 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Customer Self-service Lookup Boundaries Are Needed After Task278

Task278 clarified that report, export, download, and scheduled report cannot bypass normal data permissions or visibility policy.

Customer self-service lookup is another high-risk data surface because it exposes data outside internal Admin workflows.

Future customer lookup must support useful customer-facing flows:

- case status lookup,
- appointment schedule confirmation,
- quote / fee consent status,
- completed service summary,
- survey link / survey status,
- complaint / callback visible status,
- customer-visible documents.

But it must not expose:

- internal notes,
- audit logs,
- billing / settlement internal data,
- supervisor notes,
- engineer internal comments,
- AI raw payload,
- raw LINE user id,
- raw provider payload,
- internal risk flags.

Task279 defines the customer self-service boundary only. It does not approve runtime implementation.

## Definitions

### Customer Self-service Lookup

Customer self-service lookup means a verified customer-facing identity can query safe, customer-visible information about a Case, appointment, quote/fee consent, service completion, survey, or follow-up status.

It is not internal Admin access and not report/export permission.

### Customer Channel Identity

Customer channel identity is a customer-facing identity tied to a channel.

Examples:

- LINE identity,
- SMS / phone verification context,
- email verification context,
- Web portal identity,
- App identity.

Customer channel identity is not an internal user seat.

### LINE Channel Identity

LINE channel identity is scoped by:

```text
organization_id + line_channel_id + line_user_id
```

Raw `line_user_id` must not be treated as a global identity.

### SMS Identity

SMS identity is a future customer contact verification context based on phone / OTP / message flow.

It must not expose whether a phone number exists or is attached to a Case when verification fails.

### Email Identity

Email identity is a future customer contact verification context based on email / magic link / verification challenge.

It must not expose whether an email exists or is attached to a Case when verification fails.

### Web Portal Identity

Web portal identity is a future customer-facing web session identity.

It must use customer-visible data policy and cannot inherit internal Admin permissions.

### App Identity

App identity is a future customer App identity linked to a customer or customer channel identity.

It must be organization-scoped and must not bypass visibility policy.

### Reverse Binding

Reverse binding means an existing Case / Customer can invite a customer to bind a channel identity later.

Reverse binding is future design only in Task279.

### Verification Challenge

Verification challenge is a future mechanism that may use token, case number, contact data, OTP, magic link, or other approved challenge.

Failure must be safe and non-enumerating.

### Safe Deny

Safe deny refuses access without revealing whether the Case, Customer, contact method, token, or channel identity exists.

### Non-enumeration

Non-enumeration means the response does not help an attacker test whether a resource exists or which field matched.

### Customer-visible Data Policy

Customer-visible data policy defines data that may be shown to the customer.

### Internal-only Data Policy

Internal-only data policy defines data that must not be shown to the customer.

## Boundary Principles

- Customer channel identity is not an internal user seat.
- Customer self-service permission is not internal user permission.
- LINE is the current channel, not the only identity model.
- `line_user_id` must be scoped by `organization_id + line_channel_id + line_user_id`.
- Customer lookup must not cross organization, tenant, LINE channel, or channel identity scope.
- Customer self-service lookup can return customer-visible data only.
- Internal notes, audit logs, billing / settlement internal data, supervisor notes, AI raw payload, raw provider payload, and raw channel identifiers must not be returned to customers.
- Verification failed, Case missing, phone mismatch, email mismatch, channel mismatch, token expired, and token reused must all safe deny.
- Safe deny must not reveal the true failure reason in customer-facing responses.
- Internal audit may record safe failure classification with sensitive values masked.

## Future-only Lookup Matrix

The matrix below is conceptual only. It is not a schema, API response contract, route, UI, or implementation checklist.

| Customer self-service scenario | Required verification | Customer-visible allowed? | Internal-only allowed? | Requires organization scope? | Requires channel identity scope? | Requires field masking? | Requires audit? | Safe deny required? | May reveal resource existence on failure? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case status lookup | Verified customer/Case relationship | Yes, safe status only | No | Yes | Yes | Yes | Conditional | Yes | No | No |
| Appointment schedule lookup | Verified customer/Case relationship | Yes, safe schedule/status | No | Yes | Yes | Yes | Conditional | Yes | No | No |
| Appointment result lookup | Verified customer/Case relationship | Yes, safe customer-facing result | No | Yes | Yes | Yes | Conditional | Yes | No | No |
| Field Service Report customer-visible summary lookup | Verified customer/Case relationship and completion policy | Yes, approved summary | No | Yes | Yes | Yes | Conditional | Yes | No | No |
| Quote / customer fee consent visible status lookup | Verified customer/Case/quote relationship | Yes, approved customer-facing status | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Survey link / survey status lookup | Verified customer/Case/survey eligibility | Yes, safe survey status/link | No | Yes | Yes | Yes | Conditional | Yes | No | No |
| Complaint / callback visible status lookup | Verified customer/Case relationship | Conditional, safe customer-facing status only | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Uploaded customer-visible document lookup | Verified customer/document relationship | Yes, customer-visible documents only | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Internal note access attempt | Any customer channel identity | No | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Billing / settlement internal data access attempt | Any customer channel identity | No | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Audit log access attempt | Any customer channel identity | No | No | Yes | Yes | Yes | Yes | Yes | No | No |
| AI suggestion / raw payload access attempt | Any customer channel identity | No | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Reverse binding token lookup | Token / challenge verification | Conditional only after success | No | Yes | Yes where channel-specific | Yes | Yes | Yes | No | No |

## Reverse Binding Boundary

Future reverse binding must protect existing Cases and Customers from enumeration.

Reverse binding token rules:

- Token must expire.
- Token must be single-use.
- Token should be hash-stored.
- Token validation failure must not reveal whether the token, Case, Customer, phone, email, LINE/channel identity, or organization exists.
- Success, failure, expiration, and repeated use should create future audit events.
- Logs, errors, and responses must not expose full token, secret, full phone, raw LINE id, channel secret, access token, or provider raw payload.

Future reverse binding should support:

- existing Case invited to bind a channel identity,
- existing Customer linked to a new channel identity,
- LINE as one supported channel,
- future SMS / Email / Web portal / App identity models,
- organization-scoped channel binding,
- safe deny on all external failures.

Task279 does not implement reverse binding runtime.

## Safe Deny / Non-enumeration Rules

External customer-facing responses should use generic failure wording.

They must not allow a customer or attacker to infer:

- whether a Case exists,
- whether a Customer exists,
- whether a phone number is correct,
- whether an email is correct,
- whether a LINE/channel identity is bound,
- whether a token exists,
- whether a token expired,
- whether a token was already used,
- whether a file or document exists,
- whether a survey exists,
- whether a complaint/callback record exists.

Internal audit may record categories such as:

- verification failed,
- scope denied,
- token expired,
- token reused,
- channel mismatch,
- organization mismatch,
- resource not customer-visible.

But internal audit must mask sensitive details and must not store full token, secret, full phone, full address, raw LINE id, raw provider payload, raw signature data, or AI raw sensitive payload.

## Interaction With Future Access Contexts

| Access context | Customer self-service boundary | Runtime allowed now? |
| --- | --- | --- |
| Normal internal read | Internal users use role/permission; customer self-service does not inherit this. | No |
| Customer self-service lookup | Uses customer channel identity, verification, customer-visible policy, masking, and safe deny. | No |
| Report / export / download | Customer self-service does not imply report/export/download permission. | No |
| Scheduled report | Customer-facing scheduled delivery must re-check recipient and customer-visible policy. | No |
| AI retrieval / RAG retrieval | Customer-facing AI/RAG must use customer-visible sources only. | No |
| Notification sending | Notification delivery must not expose internal-only data and must respect channel identity scope. | No |

## SaaS-ready / Security Considerations

Future customer self-service lookup must remain compatible with:

- organization isolation,
- channel identity scope,
- role / permission separation,
- customer-visible vs internal-only policy,
- field-level masking readiness,
- audit readiness,
- usage tracking readiness,
- future entitlement for customer self-service,
- LINE / SMS / Email / Web portal / App channel-agnostic design,
- reverse LINE binding,
- generic customer channel identities,
- Enterprise customer security requirements.

Customer self-service may be a future entitlement, but entitlement does not remove identity verification, organization scope, visibility policy, masking, safe deny, or audit requirements.

## Future Test Ideas

These are future test ideas only. Task279 does not add tests.

Future coverage should include:

- customer lookup cannot cross organization,
- customer lookup cannot cross LINE channel,
- raw `line_user_id` is not global identity,
- failed verification safe denies without enumerating Case existence,
- phone mismatch safe denies without revealing whether phone or Case exists,
- expired token safe denies without revealing token state,
- reused token safe denies without revealing token state,
- customer cannot access internal notes,
- customer cannot access billing / settlement internal data,
- customer cannot access audit logs,
- customer-facing AI/RAG excludes internal-only data,
- customer-visible file lookup denies non-customer-visible file.

## Non-goals

Task279 does not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API routes,
- add or modify migrations / schema / indexes,
- connect to DB,
- execute DDL,
- execute `psql`,
- execute `npm run db:migrate`,
- run Migration020 dry-run or apply,
- add permission runtime,
- add entitlement runtime,
- add subscription runtime,
- add usage runtime,
- add customer self-service lookup runtime,
- add reverse binding runtime,
- add report / analytics runtime,
- add export / download runtime,
- add scheduled report runtime,
- add notification sending runtime,
- add LINE / SMS / Email / APP provider sending,
- add AI retrieval / RAG runtime,
- add retrieval service,
- add vector DB,
- add embedding,
- add indexer,
- modify tests / smoke / fixtures,
- modify `package.json`,
- modify inventory docs,
- expose sensitive data.

## Verification Plan

For Task279, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, customer self-service runtime, reverse binding runtime, AI runtime, RAG runtime, report runtime, export runtime, scheduled report runtime, provider sending, or inventory verification is required.

## Conclusion

Task279 defines future-only customer self-service lookup boundaries.

The key rule is:

```text
Customer channel identity is not an internal user seat.
Customer self-service lookup may return customer-visible data only.
All failed external lookup and binding flows must safe deny without enumeration.
```

Task279 is docs-only customer self-service lookup boundary guidance and does not approve customer lookup, reverse binding, notification, API, provider sending, report/export/download, AI retrieval, or RAG runtime.
