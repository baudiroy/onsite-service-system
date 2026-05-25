# Task 325 - Customer-facing Service Report Versioning / Access / Download Boundary / No Runtime Change

## Scope And Non-goals

This document follows Task324 and the `docs/PROJECT_GUARDRAILS.md` Customer-facing Completion Flow Future Design.

Task325 defines docs-only boundaries for future customer-facing service report:

- versioning,
- access links,
- access link expiration,
- access link revocation,
- report open events,
- report download events,
- read / click status,
- access logs,
- contact history,
- customer-visible report snapshots,
- previous version references,
- safe deny / non-enumeration behavior.

Task325 is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- customer-facing report versioning runtime,
- access link runtime,
- report open / download runtime,
- contact history runtime,
- access log runtime,
- audit runtime,
- notification / provider sending runtime,
- survey runtime,
- follow-up / escalation runtime,
- customer fee consent runtime,
- quote runtime,
- billing / settlement runtime,
- permission / entitlement / usage runtime,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change,
- inventory documentation change.

No runtime implementation is approved by this document.

## Why This Follows Task324

Task324 clarified that customer-facing service report is not the internal Field Service Report and that customer-facing completion content must be safe, minimal, versioned, and audit-ready.

Task325 narrows the next boundary: once a future customer-facing report exists, the platform must not treat report delivery, opening, or downloading as approval, fee consent, acceptance, or long-term identity proof.

This prevents future implementation from accidentally:

- silently overwriting customer-facing report content,
- treating an opened report as customer consent,
- treating a downloaded report as customer acceptance,
- using permanent public links,
- leaking internal report details through access logs or download logs,
- returning different external errors that reveal whether a case, customer, organization, or link exists,
- bypassing Data Access Control when serving a report link.

## Definitions

### Customer-facing Service Report Version

A specific customer-visible snapshot of the service result summary at a point in time.

The version should represent what the customer could see when the report was published, opened, downloaded, or resent.

### Report Versioning

The future ability to track customer-facing report changes with version, `updated_at`, `updated_by`, `change_reason`, previous version reference, and audit reference.

Versioning is required because photos, serial numbers, customer-visible charge summaries, warranty notes, issue handling notes, or report wording may change after initial publication.

### Access Link

A future customer-facing link used to open a specific customer-visible report or report page.

An access link is not a long-term login credential, not a customer identity, and not proof of consent.

### Access Link Expiration

A future policy where access links stop working after a defined time, policy change, security event, report replacement, or customer channel update.

### Access Link Revocation

A future policy where an access link can be invalidated before its normal expiration due to corrected report content, suspected leakage, wrong recipient, customer request, permission change, or security review.

### Report Opened Event

A future event recording that a customer-facing report was opened through an allowed channel or access path.

It should not imply customer approval, customer acceptance, or fee consent.

### Report Downloaded Event

A future event recording that a customer-facing report was downloaded or exported for the customer.

It should not imply customer approval, customer acceptance, or fee consent.

### Read / Click Status

Future channel metadata showing that a notification, message, link, or report page was read or clicked when the channel supports this data.

Read / click status is operational evidence only. It is not consent.

### Access Log

A future minimal log of customer-facing report access attempts, opens, downloads, denials, expiration, and revocation checks.

It should store metadata and masked references, not raw report content.

### Contact History

A future history of customer contact and notification attempts such as report sent, resent, opened, downloaded, issue reported, survey sent, or support contact requested.

### Customer-visible Report Snapshot

The safe, data-minimized report content shown to the customer for a specific report version.

It must follow customer visible data policy.

### Previous Version Reference

A reference from a newer customer-facing report version to the prior version it superseded.

It supports dispute handling and traceability without exposing old internal data to unauthorized viewers.

## Boundary Principles

- Customer-facing report must not be silently overwritten.
- Version updates should future-track version, `updated_at`, `updated_by`, `change_reason`, previous version reference, and audit reference.
- Report open does not equal customer approval.
- Report open does not equal customer fee consent.
- Report download does not equal customer acceptance.
- Read / click status does not equal customer acceptance.
- Access link does not equal a long-term login credential.
- Access link does not equal customer identity.
- Access link must future-support expiration, revocation, and safe denial.
- Customer-facing report access must not bypass Data Access Control or customer visible data policy.
- Access logs and download logs must not store raw report content or complete sensitive values.
- Links, logs, errors, frontend responses, AI context, and notification payloads must use data minimization.
- Customer-facing report versions are future artifacts only. Task325 does not create schemas, APIs, links, downloads, logs, or runtime behavior.

## Future-only Version / Access Matrix

| Event / object | Event / object type | Customer-visible? | May expose internal-only data? | Requires Data Access Control? | Requires safe deny / non-enumeration? | Requires audit readiness? | Requires contact / access log? | Requires usage tracking? | May update report version? | May imply customer consent / approval? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Initial customer-facing report generated | Report snapshot candidate | No until published / sent | No | Yes | Yes | Yes | Yes if generated / previewed | Optional | Future-only yes | No | No |
| Report reviewed / approved candidate | Review state | No until published / sent | No | Yes | Yes | Yes | Yes | Optional | Future-only yes | No | No |
| Report version published candidate | Report version | Yes after delivery or access | No | Yes | Yes | Yes | Yes | Optional | Future-only yes | No | No |
| Report version updated | Report version change | Maybe after re-send / access | No | Yes | Yes | Yes | Yes | Optional | Future-only yes | No | No |
| Report version superseded | Version status | No by default | No | Yes | Yes | Yes | Yes | Optional | Future-only yes | No | No |
| Report access link created | Access object | No, unless delivered | No | Yes | Yes | Yes | Yes | Yes if metered | No | No | No |
| Access link opened | Access event | Yes | No | Yes | Yes | Yes | Yes | Yes if metered | No | No | No |
| Access link expired | Access state | Customer may see generic unavailable message | No | Yes | Yes | Yes | Yes | Optional | No | No | No |
| Access link revoked | Access state | Customer may see generic unavailable message | No | Yes | Yes | Yes | Yes | Optional | No | No | No |
| Report opened | Access event | Yes | No | Yes | Yes | Yes | Yes | Yes if metered | No | No | No |
| Report downloaded | Download event | Yes | No | Yes | Yes | Yes | Yes | Yes if metered | No | No | No |
| Report download denied | Denial event | Customer sees generic guidance | No | Yes | Yes | Yes | Yes | Optional | No | No | No |
| Report re-sent candidate | Notification candidate | Yes only when sent | No | Yes | Yes | Yes | Yes | Yes if metered | No, unless content changed | No | No |
| Issue reported from report page | Customer action candidate | Yes | No | Yes | Yes | Yes | Yes | Yes if metered | No | No | No |

All rows are future-only. `Runtime allowed now?` must remain `No` until a later task explicitly authorizes runtime scope, schema, API, security model, logging model, tests, and rollout controls.

## Data Protection Rules

Customer-facing report, access log, download log, notification payload, frontend response, and AI context must not include:

- internal note,
- full audit log details,
- AI raw payload,
- AI risk flag,
- billing internal data,
- settlement internal data,
- engineer internal comment,
- supervisor review record,
- vendor reconciliation rule,
- internal cost,
- unauthorized data.

Logs, errors, frontend responses, AI context, customer messages, and download metadata must not expose:

- complete phone values,
- complete email values,
- complete addresses beyond what is necessary and authorized,
- provider tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- verification codes,
- raw signature data,
- unmasked photos,
- unrestricted customer private data.

Future access logs may record:

- masked reference,
- timestamp,
- channel category,
- event category,
- correlation id,
- report version reference,
- result category,
- actor type,
- organization-scoped resource reference.

Future access logs must not record:

- raw report content,
- raw customer private data,
- raw provider payload,
- raw access token,
- raw signature image or signature data,
- unmasked attachment content,
- customer-visible report full body unless a future policy explicitly authorizes a safe snapshot store.

## Safe Deny / Non-enumeration Rules

External responses should not reveal the precise internal reason when customer-facing report access is denied.

When any of the following occurs, the external customer-facing response should use generic unavailable / retry / contact support guidance:

- link expired,
- link revoked,
- report missing,
- report not yet published,
- customer mismatch,
- case mismatch,
- organization mismatch,
- channel identity mismatch,
- permission denied,
- feature not entitled,
- subscription inactive,
- usage exceeded,
- report version superseded,
- access policy changed,
- suspicious access pattern detected.

Internal systems may record a masked diagnostic reason for authorized operators, but customer-facing errors should not reveal whether a case, customer, organization, report, or link exists.

## Versioning / Access / Notification Readiness

Future customer-facing report versions should track:

- report version,
- `updated_at`,
- `updated_by`,
- `change_reason`,
- previous version reference,
- audit reference,
- publication state,
- superseded state,
- customer-visible snapshot reference, if future policy allows.

Future report access and notification should track:

- report sent,
- report resent,
- read / clicked status if available,
- report opened,
- report downloaded,
- download denied,
- issue reported,
- access link created,
- access link expired,
- access link revoked,
- survey sent,
- survey completed,
- support contact requested.

Channel positioning:

- LINE / App can be primary interaction and notification channels.
- SMS is reminder and channel guidance.
- Web link is view / confirm / form entry, not the primary proactive notification channel.
- Email and human resend are optional future fallback paths.

Future access and download behavior must be data-minimized, permission-scoped, organization-scoped, and audit-ready.

## Interaction With Existing Branches

### Customer-facing Completion Flow

Task325 extends the customer-facing completion branch by isolating report versions, access links, download events, and access-denial behavior from internal completion.

### Customer-visible Service Result Summary

Customer-facing service report versions are expanded customer-visible service result summaries. They must preserve the same customer visible data policy.

### Field Service Report Completion Readiness

Customer-facing report versioning depends on stable internal Field Service Report completion. It must not weaken one Case = one formal Field Service Report.

### finalAppointmentId Backend-owned Inference

Customer-facing report context should use the completed report's stable `finalAppointmentId`. Report access must not re-infer final appointment.

### Customer Channel Identity / Notification

Report access and notification may depend on LINE / App / SMS / Web / Email identity and notification policy. Raw channel identifiers must not be exposed.

### Audit Log / Evidence Traceability

Report publication, version update, access, download, denial, resend, and revocation should be audit-ready.

### Data Access Control

Report generation, link serving, open tracking, download, denial, and issue reporting must use the shared Data Access Control model.

### Customer Fee Consent

Report open or download must not be treated as fee consent. Customer fee consent requires future explicit charge / approval / invoice records and policy.

### Operations / Quality Follow-up / Escalation

Issue reporting from a report page may create a future follow-up / escalation candidate, but Task325 does not implement that workflow.

### SaaS Usage Tracking

Future report views, downloads, resends, access links, and customer self-service access may be usage-metered, but no usage runtime is approved here.

## Explicit Runtime Forbidden Confirmation

Task325 does not allow:

- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- view change,
- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run or apply,
- customer-facing report runtime,
- customer-facing report versioning runtime,
- access link runtime,
- report open runtime,
- report download runtime,
- contact history runtime,
- access log runtime,
- notification / provider sending runtime,
- survey runtime,
- follow-up runtime,
- escalation runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- audit runtime,
- AI / RAG runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task325 must not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API behavior,
- add or modify migrations / schema / indexes / views,
- connect to DB,
- execute DDL,
- run psql,
- run `npm run db:migrate`,
- execute Migration020 dry-run or apply,
- add customer-facing report runtime,
- add report versioning / access link / download runtime,
- add completion / Field Service Report runtime,
- add signature / file / photo runtime,
- add invoice / payment / billing / settlement runtime,
- add survey / follow-up / escalation runtime,
- add notification / provider sending runtime,
- add customer channel identity runtime,
- add permission / entitlement / usage / audit runtime,
- add AI / RAG runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gates

Before any runtime work can begin, a future task must explicitly approve:

- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index / view changes, if any,
- DB / DDL permission, if any,
- customer-facing report schema,
- report versioning schema,
- customer-visible snapshot policy,
- access link schema and lifetime policy,
- revocation and expiration policy,
- access-denial copy policy,
- access log and download log policy,
- report open / download event semantics,
- customer identity and channel binding requirements,
- Data Access Control checks,
- audit log requirements,
- SaaS usage tracking requirements,
- notification / provider sending boundary, if any,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task325 is docs-only customer-facing service report versioning / access / download boundary guidance.

It does not approve customer-facing report runtime, versioning runtime, access link runtime, report open / download runtime, notification runtime, audit runtime, usage runtime, permission runtime, DB / DDL, API changes, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.
