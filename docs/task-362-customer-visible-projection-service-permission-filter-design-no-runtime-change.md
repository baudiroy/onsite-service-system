# Task 362 - Customer-visible Projection Service Permission Filter Design / No Runtime Change

## Scope Summary

Task362 is a documentation-only design for a future customer-visible projection service permission filter.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task362 extends the Task352-361 customer-visible surfaces and API contract proposal sequence. It describes future projection service filtering only. It does not implement the service.

## Projection Service Purpose

The future customer-visible projection service should convert internal records into customer-safe filtered projections.

Primary source domains may include:

- appointments,
- dispatch visits,
- Field Service Reports,
- customer-facing report availability,
- issue entrypoint availability,
- survey entrypoint availability,
- customer-safe fee / invoice availability,
- customer-safe signature status.

The projection service should:

- centralize customer visible data policy,
- centralize organization scope enforcement,
- centralize customer identity verification boundary,
- centralize permission and access filtering,
- centralize field filtering / masking,
- centralize safe-deny mapping,
- prevent API controllers from manually stitching raw internal responses,
- keep internal source records separate from customer-facing output.

The projection service must not become the internal source of truth. It should be a customer-visible projection layer only.

## Proposed Projection Inputs

These inputs are proposal-only and do not define a runtime interface.

Possible minimal inputs:

- `organizationContext`,
- `customerAccessContext`,
- `customerSafeCaseRef`,
- `customerSafeReportRef`, when requesting a report,
- `channelContext`,
- `verificationContext`,
- `consentContext`,
- `requestedSurface`,
- `requestedAction`, if an action entrypoint is requested.

Possible requested surfaces:

- customer-visible timeline,
- customer-facing service report,
- report issue entrypoint,
- survey entrypoint,
- support contact entrypoint.

Inputs should not include:

- raw provider payload,
- complete audit log,
- complete internal notes,
- cross-organization data,
- raw AI prompt or output,
- billing / settlement internals unless a customer-safe projection is explicitly required,
- full phone number unless the surface clearly requires it and access has been authorized,
- full address unless the surface clearly requires it and access has been authorized.

The projection service should resolve internal records only after access context passes the required checks. It should not accept already-expanded unfiltered data from a controller as a shortcut.

## Permission Filter Stages

Future implementation should use a fail-closed filter pipeline.

| Stage | Purpose | Customer-facing failure behavior | Internal-only note |
| --- | --- | --- | --- |
| Organization scope check | Ensure the request is resolved within one organization / tenant. | Generic safe-deny. | Cross-organization detail may be audited internally. |
| Customer-safe reference resolution | Resolve customer-safe Case/report reference without exposing raw ids. | Generic safe-deny or link unavailable. | Do not reveal whether the underlying Case/report exists. |
| Customer channel identity scope check | Ensure channel identity is scoped by organization and channel. | Generic safe-deny. | Same external id in another organization/channel must not leak. |
| Verification / consent check | Ensure the customer is verified and consent/authorization requirements are met. | Verification required or generic safe-deny depending on enumeration risk. | Missing consent reason is internal-only. |
| Case / report authorization check | Confirm the verified customer may access the requested Case/report. | Generic safe-deny. | Wrong customer or wrong Case must not be disclosed. |
| Surface entitlement / availability check | Confirm the requested customer-visible surface is available. | Action unavailable, report issue unavailable, survey unavailable, or generic safe-deny. | Availability reason remains internal. |
| Customer visible data policy filter | Apply customer-visible allow-list. | Omit unsafe fields. | Do not pass unsafe fields downstream. |
| Field-level redaction / masking | Mask personal or sensitive fields when allowed but not fully needed. | Return only masked / reduced fields. | Full values require explicit necessity and authorization. |
| Safe-deny mapping | Map access failures to non-enumerating customer messages. | Return approved generic message/key proposal. | Root cause may be recorded internally. |
| Audit / security event boundary | Future internal record of access/deny events. | No customer-facing details. | Future dependency, not implemented here. |

Rules:

- Any access failure must fail closed.
- A partial record match must not reveal Case, Customer, Organization, Appointment, report, LINE binding, survey, or issue existence.
- Denied root cause may be recorded internally in future audit/security events, but it must not be returned to the customer.
- API controllers should not bypass the projection service to return raw internal data.

## Projection Output Boundary

### Timeline Projection May Include

Future timeline projection may include:

- customer-safe Case reference,
- customer-safe display status,
- confirmed scheduled service window,
- customer-safe appointment timeline items,
- waiting confirmation state,
- reschedule requested state,
- pending parts state,
- waiting quote state,
- neutral missed-visit state,
- high-level engineer arrived state if approved,
- high-level service finished state,
- customer-facing report availability,
- support entrypoint availability,
- report issue entrypoint availability,
- survey entrypoint availability.

### Service Report Projection May Include

Future service report projection may include:

- customer-safe Case reference,
- customer-safe report reference,
- service report display title,
- service date,
- completed appointment display window,
- customer-safe issue summary,
- customer-safe repair action summary,
- customer-visible parts or service item summary,
- high-level service result,
- customer-safe signature status,
- customer-safe signature exception wording,
- confirmed customer charge / approval / invoice information if applicable,
- report issue entrypoint availability,
- support contact entrypoint availability,
- survey entrypoint availability.

## Must-filter / Must-not-output Fields

The projection service must not output:

- internal notes,
- audit log,
- raw AI payload,
- AI prompt,
- raw model output,
- engineer internal comments,
- supervisor notes,
- supervisor override reason,
- dispatch scoring,
- engineer ranking,
- route optimization,
- billing internal rules,
- settlement internal rules,
- vendor reconciliation data,
- brand reconciliation data,
- internal cost,
- margin,
- payout,
- inventory internal data,
- warehouse data,
- stock movement data,
- raw LINE ID,
- raw channel ID,
- provider ID,
- full phone number unless clearly necessary and authorized,
- full address unless clearly necessary and authorized,
- sensitive provider payload,
- internal complaint classification,
- database IDs that are not customer-safe,
- organization-internal IDs that are not customer-safe,
- raw `finalAppointmentId` as an internal field,
- internal Field Service Report raw payload,
- signature raw file,
- signature image,
- signature storage key,
- signature provider payload,
- raw contact history,
- permission details,
- entitlement details,
- internal denial reason.

Unsafe fields should be removed before customer-facing response assembly. They should not be passed to AI, localization rendering, notification delivery, or a frontend response object.

## Safe-deny Behavior

Safe-deny behavior should align with Task355, Task360, and Task361.

Proposal-only key families:

- `customerAccess.genericUnavailable`,
- `customerAccess.verificationRequired`,
- `customerAccess.linkUnavailable`,
- `customerAccess.actionUnavailable`,
- `customerAccess.reportIssueUnavailable`,
- `customerAccess.surveyUnavailable`.

Safe-deny rules:

- Safe-deny wording must not reveal root cause.
- Wrong customer, wrong organization, wrong channel, expired link, revoked link, missing consent, unavailable report, unavailable timeline, unavailable survey, unavailable issue entrypoint, and internal resolution errors should avoid enumerable differences.
- Customer-facing message keys are proposal-only. Task362 does not add localization files or runtime keys.
- Internal audit/security events may record detailed reason in the future, but customer-facing output must remain generic.

## AI Boundary

AI may assist with future customer-safe wording drafts, but AI must not be part of the permission decision.

AI may help:

- turn appointment history into customer-safe timeline wording drafts,
- turn Field Service Report draft content into customer-safe report wording drafts,
- propose shorter channel-specific wording,
- draft customer-safe support handoff wording.

AI must not:

- decide whether the customer can access a Case/report,
- override organization scope,
- override customer identity verification,
- override consent checks,
- override safe-deny mapping,
- publish projection output,
- hide complaints,
- hide negative feedback,
- hide unresolved issues,
- expose internal notes,
- expose raw AI payloads,
- expose billing or settlement internals,
- expose audit details,
- cross organization or tenant boundaries.

Any AI context must be:

- minimum necessary,
- masked / redacted,
- permission-aware,
- tenant-isolated,
- auditable,
- human-controlled before publication when the output affects customer-visible content.

AI output must not be passed directly into projection output without approved product/runtime controls.

## Non-goals

Task362 does not:

- add projection service runtime,
- add an API route,
- add a controller,
- add a service,
- add a repository,
- add a validator,
- add permission runtime,
- add customer channel verification runtime,
- add safe-deny helper runtime,
- add localization files,
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

These are future tasks only and must not be implemented as part of Task362.

### Projection Service Interface Proposal

Define a typed interface for timeline and report projection inputs, outputs, access errors, and safe-deny mapping.

### Customer Channel Identity Verification Runtime Design

Design scoped verification for LINE, Web link, Web portal, App, SMS-directed link, and Email-directed link.

### Safe-deny Response Helper Design

Design a shared helper so customer-facing APIs can return non-enumerating responses consistently.

### Customer-visible Localization File Implementation

Implement localization files only after product copy review and API contract approval.

### Timeline / Report Projection Implementation Task

Implement projection runtime only after API contracts, verification, safe-deny, and access-control tests are approved.

### Projection Access-control Smoke Tests

Add tests only after disposable local/test runtime is confirmed and runtime exists.

### Object / File Storage Access Policy For Customer-visible Files

Design access policy for signatures, report attachments, customer-visible photos, and downloadable reports.

## Risk and Limitations

This document is not runtime approval. It defines the future projection filter boundary.

Future implementation must still resolve:

- customer-safe identifier format,
- customer channel verification,
- link lifecycle policy,
- consent policy,
- projection service interface,
- field allow-list,
- file access policy,
- safe-deny helper,
- localization files,
- audit/security event mapping,
- tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task362.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future projection service implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.
