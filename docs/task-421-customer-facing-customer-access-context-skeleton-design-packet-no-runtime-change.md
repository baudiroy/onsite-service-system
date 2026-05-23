# Task421 — Customer-Facing CustomerAccessContext Skeleton Design Packet / No Runtime Change

Task421 defines the future design boundary for a customer-facing
customerAccessContext skeleton / builder if explicit local-only runtime
authorization is granted later.

This task is documentation-only. It does not modify customerAccessContext
utilities, resolver, route/controller, projection utilities, API, DB, fixtures,
tests, provider sending, or AI runtime.

## Current Baseline

Task421 follows the Task370-420 customer-facing no-runtime baseline.

It especially follows:

- Task391: customerFacingProjectionDto safety hardening.
- Task398: forbidden field constants consolidation.
- Task404: route/controller contract proposal.
- Task405: resolver contract proposal.
- Task416: projection allow-list checklist.
- Task419: route/controller skeleton design packet.
- Task420: resolver skeleton design packet.

Current state remains:

- no customer-facing runtime,
- no customerAccessContext utility modification,
- no resolver implementation,
- no route/controller/API implementation,
- no repository / DB access,
- no migration / schema / index,
- no fixture files added,
- no test files added,
- no scan script or CI added,
- no projection utility modification,
- no forbidden field constants modification,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task421 is a customerAccessContext skeleton design packet, not implementation.

## CustomerAccessContext Purpose

customerAccessContext is the sanitized boundary between resolver and projection.

It may conceptually carry the minimum context that projection needs to shape a
customer-visible response after resolver has performed the access decision.

customerAccessContext must not:

- replace resolver,
- replace permission model,
- directly query DB,
- directly call repository,
- produce customer-facing DTO,
- wrap response envelope,
- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- decide finalAppointmentId,
- decide link reissue,
- decide customer fee approval,
- decide quote approval,
- decide settlement,
- close complaint,
- call provider sending,
- call AI provider,
- call RAG/vector DB.

customerAccessContext is a sanitized handoff object, not an authorization engine
or mutation layer.

## Mandatory Future Flow

Future customer-facing access must remain inside this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Projection must not bypass customerAccessContext to read:

- raw resolver result,
- repository row,
- raw service report object,
- raw appointment object,
- raw customer object,
- raw provider payload,
- raw token,
- raw channel identity.

Controller must not skip resolver and fabricate customerAccessContext.

## Input Skeleton Proposal

The following input categories are future proposal only. Task421 does not
implement them.

Future customerAccessContext builder may receive:

- resolver allowed / denied decision,
- organization scope reference,
- symbolic customer identity reference,
- symbolic channel identity reference,
- symbolic resource reference,
- requested route family,
- purpose / projection scope,
- verification state summary,
- consent state summary,
- sanitized request reference,
- correlation reference.

It must not receive or record:

- raw token,
- secret,
- `DATABASE_URL`,
- raw provider payload,
- raw channel id,
- actual `line_user_id` value,
- complete phone number,
- complete address,
- production customer data,
- raw DB row,
- internal note full text,
- audit/security event full text,
- AI raw payload,
- billing internal data,
- settlement internal data,
- customer document content,
- signature/photo/file content.

Inputs must be minimized. If a field is not needed by projection, it should not
enter customerAccessContext.

## Output Skeleton Proposal

The following output categories are future proposal only. Task421 does not
implement them.

If allowed, future context may contain:

- context allowed flag,
- organization scope reference,
- symbolic customer identity reference,
- symbolic channel identity reference,
- symbolic resource reference,
- route family,
- projection scope,
- verification summary,
- consent summary,
- sanitized request reference,
- correlation reference.

If denied, malformed, incomplete, or ambiguous, customerAccessContext creation
must fail closed.

External response must not directly expose:

- internal denial category,
- resolver raw result,
- customerAccessContext internals,
- token state,
- channel identity state,
- consent reason,
- verification reason,
- resource existence,
- organization mismatch reason.

## Fail-Closed Context Rules

Future customerAccessContext builder should fail closed for these cases.

| Condition | Context behavior | External behavior | No-existence-leakage assertion | Audit/security event candidate |
| --- | --- | --- | --- | --- |
| Missing resolver result | Fail closed. | Generic safe-deny. | Must not reveal whether route/resource exists. | Future only. |
| Malformed resolver result | Fail closed. | Generic safe-deny. | Must not reveal parser/internal state. | Future only. |
| Denied resolver result | Fail closed. | Generic safe-deny. | Must not expose denial category. | Future only. |
| Missing organization scope | Fail closed. | Generic safe-deny. | Must not reveal tenant state. | Future only. |
| Missing symbolic customer identity | Fail closed. | Generic safe-deny. | Must not reveal customer existence. | Future only. |
| Missing symbolic resource reference | Fail closed. | Generic safe-deny. | Must not reveal resource existence. | Future only. |
| Missing route family | Fail closed. | Generic safe-deny. | Must not reveal supported route map. | Future only. |
| Missing projection scope | Fail closed. | Generic safe-deny. | Must not reveal projection availability. | Future only. |
| Unverified identity | Fail closed. | Generic safe-deny or generic verification-required response. | Must not reveal identity state. | Future only. |
| No consent | Fail closed. | Generic safe-deny or generic verification-required response. | Must not reveal consent state detail. | Future only. |
| Mismatched organization | Fail closed. | Generic safe-deny. | Must not reveal cross-tenant mismatch. | Future only. |
| Unsupported route family | Fail closed. | Generic safe-deny. | Must not reveal supported route map. | Future only. |
| Unknown projection scope | Fail closed. | Generic safe-deny. | Must not reveal projection internals. | Future only. |
| Unexpected raw field present | Fail closed. | Generic safe-deny. | Must not leak raw field presence. | Future only. |

Internal candidates are future-only and must not be customer-visible.

## Projection Handoff Boundary

Projection may receive only:

- customerAccessContext,
- allow-listed resource summary,
- route-family projection scope,
- sanitized symbolic references needed for shaping output.

Projection must not receive:

- raw resolver denial reason,
- raw token,
- raw channel id,
- raw provider payload,
- raw DB row,
- internal note,
- audit log,
- AI raw payload,
- billing internal data,
- settlement internal data,
- engineer internal comments,
- supervisor review,
- vendor reconciliation rules.

Projection must not infer:

- binding state,
- resource existence detail,
- internal denial reason,
- rate-limit category,
- abuse category,
- permission internal reason,
- entitlement internal reason.

## Route Family / Purpose Scoping

Different customer-facing route families require different purpose/projection
scopes.

Route family scopes:

- service report view,
- appointment summary view,
- completion status view,
- issue/follow-up acknowledgement,
- survey/feedback acknowledgement.

Rules:

- Survey/feedback scope does not equal service report scope.
- Issue/follow-up acknowledgement does not equal full case access.
- Appointment summary does not equal full service report access.
- Completion status does not equal billing/settlement/audit access.
- Context scope must not be expanded by controller.
- Context scope must not be expanded by projection.
- Context scope must not be expanded by support fallback.

## Channel Identity Boundary

customerAccessContext must not use `line_user_id` as global identity.

Rules:

- LINE is a channel instance.
- SMS is a channel instance.
- Email is a channel instance.
- App is a channel instance.
- Web Link is an access surface.
- Future phone-assisted flow is a channel/support surface.
- Context may keep symbolic channel identity reference.
- Context may keep verification summary.
- Context may keep consent summary.
- Context must not expose raw channel identity to customer-facing response.
- Context must not expose binding state to customer-facing response.
- Context must not imply LINE is the only customer channel.

## Field Service Report Invariant

customerAccessContext must not alter Field Service Report invariants.

Rules:

- One Case can have only one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- customerAccessContext must not decide finalAppointmentId.
- customerAccessContext must not create formal reports.
- customerAccessContext must not treat each appointment as a formal report.
- customer-facing report access is projection access only.
- customer-facing report access is not report creation or mutation.
- customer-facing issue/follow-up does not reopen a completed report.

## Synthetic Local-Only Context Option

This is a future option only. Task421 does not authorize or implement it.

If explicit local-only runtime authorization is granted, the safest initial
context skeleton should prefer:

- no DB,
- no provider sending,
- no AI provider,
- no RAG,
- no vector DB,
- synthetic in-memory fixtures only,
- sanitized symbolic references only,
- fail-closed default,
- existing pure utilities only,
- no persistent audit/security event writes.

The future option must satisfy:

- Task415 local-only runtime authorization checklist,
- Task417 synthetic fixture policy,
- Task418 sensitive scan checklist,
- Task419 route/controller skeleton design packet,
- Task420 resolver skeleton design packet.

## Explicit Non-goals

Task421 does not:

- modify `src/`,
- modify `admin/src/`,
- modify customerAccessContext utilities,
- add resolver files,
- add route files,
- add controller files,
- add API runtime,
- add repository runtime,
- add fixture files,
- add test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- modify projection utilities,
- modify forbidden field constants,
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

Task421 records a future customerAccessContext skeleton design packet only.

Decision summary:

- customerAccessContext is a sanitized resolver-to-projection boundary.
- customerAccessContext does not replace resolver or permission model.
- customerAccessContext does not create DTOs, wrap envelopes, query DB, mutate
  records, send providers, or call AI/RAG.
- Projection must not bypass customerAccessContext to read raw resolver result
  or raw repository/service objects.
- customerAccessContext must fail closed when required scope, identity,
  projection, or symbolic references are missing or malformed.
- No customerAccessContext/runtime/API/DB/test/provider/AI work is implemented
  by Task421.

## Verification Plan

For Task421 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only design packet.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
