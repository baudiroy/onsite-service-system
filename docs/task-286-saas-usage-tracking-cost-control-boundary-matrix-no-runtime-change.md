# Task 286 - SaaS Usage Tracking and Cost Control Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document continues the SaaS Plan / Entitlement / Usage Boundary branch after Task282 through Task285.

The purpose is to define future-only usage tracking and cost control boundaries so future implementation does not confuse usage events, usage limits, entitlement gates, permission gates, cost attribution, billable usage, audit logs, provider sending, AI Add-on usage, or formal billing.

Task286 is documentation-only.

This task is not:

- usage metering runtime,
- cost tracking runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- SaaS billing runtime,
- entitlement runtime,
- permission runtime,
- provider sending runtime,
- AI Add-on runtime,
- report / export / download runtime,
- scheduled report runtime,
- customer self-service runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- smoke / test implementation.

Task286 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, subscription runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Usage Tracking / Cost Control Boundaries Are Needed After Task285

Task285 clarified that seat/account type is not permission, role, data visibility, or customer channel identity.

The next risk is treating usage tracking as if it were formal billing, authorization, audit, or customer charging.

Future SaaS design may need to measure AI requests, provider sends, file storage, exports, API calls, customer self-service lookup, and scheduled reports. Those measurements may support cost control, quota limits, internal reporting, or future billing. They must not become shortcuts around permissions, Data Access Control, masking, provider safety, or audit.

Task286 defines these boundaries only. It does not approve any runtime implementation.

## Definitions

### Usage Tracking

Usage tracking records that a feature was used, how much was used, and which organization or future billing period it may relate to.

Usage tracking is not authorization and not formal billing by itself.

### Usage Limit

Usage limit is a quota or threshold for a feature.

It may be used in the future to warn, throttle, block, or price usage. It does not decide data visibility.

### Cost Attribution

Cost attribution estimates or allocates internal cost to an organization, feature, provider, user, task, or period.

Cost attribution is not automatically a customer charge.

### Billable Usage

Billable usage is usage that may be eligible for future customer billing under an approved billing policy.

Billable usage does not create a formal invoice by itself.

### Internal Cost Control

Internal cost control helps prevent unmanaged provider, storage, AI, export, API, or notification costs.

It may exist even when the customer is not directly charged for a usage event.

### Entitlement Gate

Entitlement gate determines whether an organization may access a feature or quota through plan, add-on, custom contract, or configuration.

Entitlement gate is tenant-level and does not replace user permission.

### Permission Gate

Permission gate determines whether a specific user or actor may perform an action.

Permission gate does not replace entitlement or usage limits.

### Audit Log

Audit log records security, responsibility, compliance, and traceability events.

Audit log is not the same as usage tracking.

### AI Add-on Usage

AI Add-on usage is future usage of AI features that may require AI entitlement, user permission, Data Access Control, masking, audit, usage limits, and cost control.

It cannot bypass human review or official-record separation.

### Provider Sending Usage

Provider sending usage is future usage from LINE, SMS, Email, APP push, webhook, or other outbound providers.

Provider usage must be provider-safe, organization-scoped, auditable, and usage-tracked if implemented.

### Storage Usage

Storage usage is future measurement of file, photo, signature, document, export, or attachment storage.

Storage usage must not expose raw file contents in usage records.

### API / Webhook Usage

API / webhook usage is future measurement of API requests, webhook deliveries, integration callbacks, or provider event processing.

Usage tracking must not store provider credentials or raw sensitive payload.

## Boundary Principles

- Usage tracking does not equal billing runtime.
- Usage limit does not equal data visibility permission.
- Billable usage does not equal formal invoice.
- Cost attribution does not equal customer charge.
- Entitlement gate does not equal permission gate.
- Permission gate does not equal entitlement gate.
- Audit log does not equal usage tracking.
- Usage event does not authorize the operation.
- Audit event does not become billable usage unless a future explicit billing policy defines it.
- Usage tracking must not record complete token, secret, complete phone, complete address, raw LINE id, raw provider payload, signature raw data, or AI raw sensitive payload.
- AI Add-on usage cannot bypass Data Access Control, masking, audit, minimum necessary context, or human review.
- Provider usage must not expose provider credentials, channel secrets, access tokens, or raw provider payload.
- Usage records should store minimal, structured, non-sensitive metadata.

## Future-only Usage Matrix

This matrix is intentionally conservative. It describes future usage / cost-control guidance only.

| Usage event type | Possible cost driver | Requires entitlement? | Requires permission? | Requires Data Access Control? | Requires provider safety? | Requires audit? | May be billable future? | May affect usage limit? | May expose sensitive data if mishandled? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI suggestion generation | AI request, model processing, token usage. | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| AI / RAG retrieval | Retrieval count, model processing, embedding/vector cost. | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| LINE push | Provider send count and channel/provider cost. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| SMS sending | Provider send count and telecom cost. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Email sending | Provider send count and delivery cost. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Survey sending | Notification provider usage and survey workflow usage. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Customer self-service lookup | Lookup count, portal/API load, channel usage. | Yes | Customer verification policy, not internal role permission. | Yes | Maybe | Yes | Yes | Yes | Yes | No |
| Report generation | Compute time, query load, report generation count. | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| CSV export | Export generation, file creation, download readiness. | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| File / document download | Download count, bandwidth, storage egress. | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| Photo upload | Storage, bandwidth, processing. | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| Signature upload | Storage, bandwidth, processing. | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | No |
| File storage | Storage volume and retention cost. | Yes | Yes | Yes | No | Maybe | Yes | Yes | Yes | No |
| API request | API call count, compute, integration volume. | Yes | Yes | Yes | Maybe | Yes | Yes | Yes | Yes | No |
| Webhook delivery | Delivery count, retry count, provider/integration load. | Yes | Purpose-specific policy. | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Scheduled report execution | Scheduled compute, export generation, delivery or download readiness. | Yes | Yes, including recipient policy. | Yes | Maybe | Yes | Yes | Yes | Yes | No |

## Usage vs Audit Separation

Usage tracking and audit log may refer to the same operation, but they answer different questions.

Usage tracking answers:

- How much of a feature was used?
- Which organization used it?
- Which feature key or cost category was involved?
- Which period may it belong to?
- Which limit or quota may it affect?

Audit log answers:

- Who or what performed the action?
- Was the action allowed or denied?
- Which resource was affected?
- What security, compliance, or accountability event occurred?
- What was the safe, masked result?

Rules:

- Usage tracking records usage and cost attribution.
- Audit log records security, responsibility, and compliance events.
- They may be linked by an event id or correlation id in future design.
- They must not be collapsed into one concept.
- Usage event must not authorize an operation.
- Audit event must not be treated as billable usage unless a future explicit billing policy defines it.
- Neither usage nor audit should store unnecessary sensitive payload.

## Provider Usage Safety

Future LINE / SMS / Email / APP sending must be provider-safe, organization-scoped, auditable, and usage-tracked.

Provider usage tracking should capture safe metadata such as:

- organization id,
- provider type,
- feature key,
- usage category,
- delivery attempt count,
- success/failure category,
- timestamp,
- billing period where applicable,
- masked correlation id where needed.

Provider usage tracking must not capture:

- provider credential,
- access token,
- channel secret,
- webhook secret,
- raw provider payload,
- raw LINE user id,
- complete phone,
- complete address,
- full message body when not necessary,
- customer signature raw data,
- unnecessary AI raw sensitive payload.

Failed sending may still need usage, cost, retry, and audit classification. Failure records must still avoid sensitive payload.

## AI Add-on Usage Boundary

Future AI Add-on usage must be controlled by:

- organization AI entitlement,
- user AI permission,
- Data Access Control,
- minimum necessary context,
- sensitive data masking / redaction,
- audit,
- usage tracking,
- cost control,
- human review for official-record writes.

AI usage tracking may record safe metadata such as:

- feature key,
- agent type,
- request count,
- retrieval count,
- token usage category,
- billing period,
- cost category.

AI usage tracking must not store:

- complete prompt with sensitive data,
- complete retrieved documents,
- unmasked customer data,
- raw LINE user id,
- provider secret,
- AI raw sensitive payload unless future security policy explicitly allows a masked and access-controlled form.

AI Add-on usage cannot bypass Data Access Control, masking, audit, or official-record separation.

## Storage Usage Boundary

Future storage usage may measure:

- file count,
- file size,
- storage duration,
- retention category,
- upload/download usage,
- feature category such as photo, signature, document, export, or report artifact.

Storage usage records should not contain file contents, customer signatures, photos, full addresses, complete phone numbers, or sensitive document bodies.

Photos, signatures, documents, and exports should use object/file storage, metadata, permissions, retention policy, and audit rather than main table blobs.

## Report / Export / Scheduled Report Usage Boundary

Future reports, exports, downloads, and scheduled reports must share the Data Access Control model.

Usage tracking may measure:

- report generation count,
- export count,
- download count,
- scheduled execution count,
- delivery count,
- file size category,
- period.

It must not:

- bypass report/export permission,
- bypass field-level masking,
- bypass recipient policy,
- store exported contents as usage payload,
- turn an audit event into billing without policy,
- expose complete customer private data by default.

Scheduled reports are automation, not permission bypass.

## SaaS-ready Considerations

Future SaaS plans may define different usage limits.

Examples:

- Basic may have small limits and limited provider / export usage.
- Professional may include customer channel and survey usage.
- Business may include larger export, API, report, and notification limits.
- Enterprise may support custom limits, private AI options, custom retention, and provider policies.

However:

- plan limits cannot decide data visibility,
- seat type cannot replace permission,
- AI Add-on cannot bypass Data Access Control,
- Enterprise cannot bypass audit,
- custom limits cannot weaken privacy,
- higher-tier plans cannot loosen ISO 27001-aligned security principles.

## Runtime Forbidden Confirmation

Task286 explicitly does not implement:

- usage metering runtime,
- cost tracking runtime,
- billing runtime,
- payment runtime,
- invoice runtime,
- entitlement runtime,
- permission runtime,
- provider sending runtime,
- AI Add-on runtime,
- report / export / download runtime,
- scheduled report runtime,
- customer self-service lookup runtime,
- API / webhook runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema,
- migration,
- index,
- Admin UI,
- smoke / test changes,
- feature flag runtime.

## Future Implementation Questions

Before any usage/cost runtime work begins, future tasks must answer:

- Which usage event types are operational only?
- Which usage event types are billable?
- Which usage events need audit pairs?
- Which usage events need provider callback reconciliation?
- Which usage events need retry classification?
- Which usage events need quota enforcement vs warning only?
- Which usage events are attached to AI Add-on?
- Which usage events are attached to report/export entitlement?
- Which usage events are attached to customer self-service entitlement?
- Which metadata is safe to store for each event type?
- Which usage records must be retained, aggregated, or deleted?
- How should failed provider sending be classified?
- How should internal smoke/test usage be excluded or tagged?

## Conclusion

Task286 adds docs-only usage tracking / cost control boundary guidance.

It does not approve or implement usage metering, billing, provider sending, AI Add-on, report/export, customer self-service, or SaaS runtime.

Future implementation must preserve:

- usage tracking is not billing runtime,
- usage limit is not data visibility,
- billable usage is not invoice,
- cost attribution is not customer charge,
- entitlement gate is not permission gate,
- audit log is not usage tracking,
- provider usage must be safe and redacted,
- AI Add-on usage must remain permission-aware and masked,
- runtime allowed now is No.
