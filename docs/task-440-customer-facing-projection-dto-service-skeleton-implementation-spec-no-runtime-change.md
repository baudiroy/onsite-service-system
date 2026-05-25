# Task440 - Customer-Facing Projection DTO / Projection Service Skeleton Implementation Spec / No Runtime Change

Task440 defines a future implementation specification for a customer-facing
projection DTO / projection service skeleton task if, and only if, the user
later explicitly authorizes projection skeleton work and the route/controller,
resolver, and customerAccessContext preconditions are satisfied.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to make the future projection skeleton task allow-list first,
customer-visible-data-safe, and fail-closed before any code is written.

Task440 answers:

- what a future projection DTO / projection service skeleton may do if
  separately authorized,
- how customer-visible fields must be controlled,
- how unknown and forbidden fields must default to deny,
- what evidence must appear in the future completion report,
- when Codex must stop instead of implementing.

## Non-Authorization Statement

Task440 is not runtime approval.

Task440 does not authorize:

- backend `src/` changes,
- new projection DTO / projection service runtime files,
- route/controller modifications,
- resolver modifications,
- customerAccessContext modifications,
- repository implementation,
- DB access,
- case/report lookup,
- response envelope / generic safe-deny implementation,
- API behavior,
- tests,
- fixtures,
- smoke/browser/API tests,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task440 only defines the future scope, boundaries, acceptance criteria, and stop
conditions for a possible projection skeleton task.

## Relationship to Task429-Task439

Task429-Task436 prepared and closed the pre-runtime authorization decision gate.

Task437 defined the future route/controller skeleton implementation spec.

Task438 defined the future resolver skeleton implementation spec.

Task439 defined the future customerAccessContext skeleton implementation spec.

Task440 defines the next future projection DTO / projection service skeleton
implementation spec. It still does not approve runtime.

## Mandatory Future Customer-Facing Flow

Any future authorized task must preserve:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Rules:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Projection must not query DB directly.
- Projection must not output raw internal data.
- Projection must be allow-list first.
- Unknown fields must default to deny.
- Forbidden fields must default to deny.
- Projection must not mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- Projection must not trigger provider sending.
- Projection must not call AI provider / RAG / vector DB.

## Preconditions Before Projection Skeleton Implementation

Before any future projection skeleton implementation, all of the following must
be true:

- The user explicitly authorizes projection DTO / projection service skeleton
  work.
- Task429-style confirmations are answered item by item.
- The task is local-only only.
- A disposable local/test environment is confirmed if execution is needed.
- Shared / prod / Zeabur are explicitly excluded.
- Production data is explicitly prohibited.
- Backend `src/` projection path scope is explicitly allowed.
- Allowed file paths are explicitly named.
- Allowed commands are explicitly named.
- Route/controller, resolver, and customerAccessContext skeletons already
  exist, or the user explicitly authorizes an adjusted order.
- DB / DDL / migration / Migration020 remain prohibited.
- Repository access remains prohibited.
- Provider sending remains prohibited.
- AI provider / RAG / vector DB remain prohibited.
- Tests / fixtures / smoke/browser/API tests are either not needed or
  separately authorized.
- The future completion report requirements are accepted.

If any item is missing, the gate remains `NO-GO`.

## Future Allowed Scope If Separately Authorized

If projection skeleton work is separately and explicitly authorized, the future
implementation may only:

- create or update the minimum projection DTO / projection service skeleton
  named by the authorization,
- receive allow-list compatible placeholder input after customerAccessContext,
- output a customer-facing DTO placeholder,
- define allow-list-first field shape,
- define unknown field default deny behavior,
- define forbidden field default deny behavior,
- keep case/report lookup, repository, DB, audit, provider, AI/RAG, response
  envelope, and mutation behavior unimplemented unless separately authorized.

The skeleton should establish safe projection shape and data boundaries, not
runtime data access.

## Future Forbidden Scope

Even under explicit projection skeleton authorization, the future projection
must not:

- implement real case/report lookup,
- query DB,
- call repositories,
- read or write formal Case / Appointment / Field Service Report records,
- infer or persist customer identity,
- validate or persist tokens,
- issue or mutate links,
- create audit rows,
- send notifications,
- trigger LINE/SMS/Email/App/survey,
- call AI provider,
- call RAG or vector DB,
- expose internal-only fields,
- return full payloads,
- include unknown fields by default,
- include forbidden fields by default,
- expose internal billing / settlement / audit / AI / provider data,
- weaken finalAppointmentId backend ownership,
- weaken one Case = one formal Field Service Report,
- weaken organization isolation or customer channel identity scoping.

## Example Future File Path Patterns

These examples are not approvals and must not be created by Task440.

Possible future path patterns, if separately authorized:

```text
src/services/customerFacingProjectionService.js
src/services/CustomerFacingProjectionService.js
src/mappers/customerFacingProjectionMapper.js
src/dtos/customerFacingReportDto.js
```

If the existing codebase uses a different naming convention, the future task
must follow the existing convention and name exact files before implementation.

## Projection DTO / Projection Service Boundary Rules

The projection skeleton should define safe customer-visible shape only.

Required boundaries:

- Projection receives only post-customerAccessContext allow-list compatible
  input.
- Projection does not perform direct DB or repository access.
- Projection does not recover customer identity.
- Projection does not inspect raw provider payloads.
- Projection does not log sensitive request details.
- Projection does not mutate records.
- Projection does not decide access; access is already represented by
  customerAccessContext.
- Projection keeps unknown fields and forbidden fields denied by default.

## customerAccessContext Non-Bypass Rules

Projection remains downstream of customerAccessContext.

The projection skeleton must not:

- accept raw controller or resolver input directly,
- accept unauthenticated channel identity,
- accept token/link possession as identity,
- manually patch missing access context,
- relax deny decisions,
- produce DTOs when customerAccessContext indicates deny.

## Customer-Visible Data Policy

Customer-facing projection must never expose internal-only data.

The future projection skeleton must explicitly forbid output of:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing / settlement internal data,
- engineer internal comment,
- supervisor review,
- vendor reconciliation rule,
- raw token / secret,
- full phone number,
- full address,
- raw channel identifier,
- cross-organization data,
- non-customer-visible complaint / escalation internal handling notes.

If customer fee information is ever included in a future projection, it may only
represent confirmed customer-relevant charge / approval / invoice information.
It must not expose internal settlement rules, vendor reconciliation logic,
internal costs, or internal billing notes.

## Allow-List / Unknown Field / Forbidden Field Rules

Projection must be allow-list first.

Rules:

- Only fields explicitly listed as customer-visible may be emitted.
- Unknown fields default to deny.
- Forbidden fields default to deny.
- Adding a new field requires explicit customer-visible classification.
- Derived fields must be checked against the same customer-visible policy.
- Masked fields must be intentionally designed, not leaked from raw values.
- Test or debug output must not include forbidden fields.

## Response Envelope and Generic Safe-Deny Compatibility

The projection skeleton may return only envelope-compatible placeholders.

Required rules:

- Success placeholder must be a customer-facing DTO placeholder.
- Deny placeholder must remain generic and safe.
- Missing, unauthorized, expired, mismatched, or invalid access should not reveal
  which condition occurred to the customer.
- Internal exceptions must not be exposed to customer-facing responses.

## Future Projection Skeleton Acceptance Criteria Matrix

| Area | Requirement | Allowed only if projection skeleton explicitly authorized | Forbidden in skeleton | Evidence expected in completion report |
| --- | --- | --- | --- | --- |
| Projection DTO entrypoint | Minimal DTO shape exists only in named file. | Yes | Raw domain DTO exposure. | DTO name and file path. |
| Projection service entrypoint | Minimal projection service exists only in named file. | Yes | Business data lookup. | Service name and file path. |
| customerAccessContext handoff | Projection receives context-approved placeholder input. | Yes | Raw controller/resolver input. | Handoff shape summary. |
| customerAccessContext non-bypass | Projection does not override access decisions. | Yes | Producing DTOs after deny. | Non-bypass statement. |
| Allow-list-first projection | Output fields are explicitly allowed. | Yes | Implicit spreading / pass-through. | Allow-list summary. |
| Unknown field default deny | Unknown fields are excluded by default. | Yes | Default include behavior. | Unknown-field deny statement. |
| Forbidden field default deny | Forbidden fields are excluded by default. | Yes | Internal fields in output. | Forbidden-field deny statement. |
| Customer-visible data policy | Output follows customer-visible policy. | Yes | Internal note, audit, billing internal, AI raw payload. | Policy compliance statement. |
| Response envelope compatibility | Return shape is compatible with future envelope. | Yes | Full internal objects. | Envelope compatibility note. |
| Generic safe-deny compatibility | Deny path remains generic. | Yes | Revealing existence or mismatch reasons. | Safe-deny behavior summary. |
| No raw internal data | No internal-only data is returned. | Yes | Raw provider/internal payloads. | Sensitive data statement. |
| No mutation | No writes or side effects. | Yes | Mutating case/report/identity/link/audit state. | No mutation statement. |
| No DB access | Projection does not query DB. | Yes | DB client calls. | No DB statement. |
| No repository access | Projection does not call repositories. | Yes | Repository calls. | No repository statement. |
| No provider sending | No outbound LINE/SMS/Email/App/survey call. | Yes | Any provider delivery. | No provider statement. |
| No AI / RAG / vector DB | No model or retrieval calls. | Yes | AI provider/RAG/vector DB usage. | No AI/RAG statement. |
| No production data | No production data is used. | Yes | Shared/prod/Zeabur data access. | Local-only evidence. |
| Organization isolation | Organization boundary remains mandatory. | Yes | Cross-tenant projection. | Boundary statement. |
| Customer channel identity | Channel identity remains scoped, not global. | Yes | Treating raw channel id as global identity. | Identity boundary statement. |
| Entitlement / usage impact | Permission and entitlement remain separate. | Yes | Using usage/plan as permission bypass. | SaaS impact statement. |

## Data / Security / Privacy Boundaries

The future projection skeleton must not process or output actual:

- token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- raw `line_user_id`,
- complete phone number,
- complete address,
- raw provider payload,
- production customer data.

The skeleton may only handle the minimum placeholder input needed to represent
future customer-visible DTO shape. It must not log sensitive request details.

## Organization Isolation / Customer Channel Identity Boundaries

The future projection skeleton must preserve:

- organization scope as already established by upstream context,
- customer channel identity scoped by organization and channel,
- no global `line_user_id` assumption,
- no cross-tenant output,
- no cross-channel output,
- generic safe-deny compatibility for missing, unauthorized, expired, or
  mismatched access.

Projection may not "helpfully" fill missing customer-visible data from other
tenants, channels, phone numbers, addresses, tokens, or customer records.

## SaaS / Entitlement / Usage Boundary Notes

The future projection skeleton must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement as a possible upstream gate,
- user/customer permission as a possible upstream gate,
- usage tracking as future observability, not access permission,
- plan/subscription status as a future gate, not a reason to weaken data
  minimization or safe-deny behavior.

No SaaS plan, Enterprise feature, AI add-on, seat billing, or SSO assumption may
relax organization isolation or sensitive data boundaries.

## Stop Conditions

Codex must stop before a future projection skeleton implementation if:

- the user has not explicitly authorized projection skeleton work,
- allowed files are not named,
- allowed commands are not named,
- route/controller, resolver, or customerAccessContext skeleton is required but
  absent and order is not explicitly adjusted,
- implementation needs real case/report lookup,
- implementation needs projection from raw domain rows,
- implementation needs DB access,
- implementation needs repositories,
- implementation needs tests / fixtures / smoke not separately authorized,
- implementation needs provider sending,
- implementation needs AI provider / RAG / vector DB,
- implementation needs shared/prod/Zeabur access,
- implementation needs production data,
- implementation needs raw token/channel/customer data,
- customer-visible field classification is unclear,
- forbidden fields cannot be denied by default,
- safe-deny compatibility cannot be preserved,
- organization isolation cannot be preserved,
- customer channel identity scoping cannot be preserved,
- Field Service Report or finalAppointmentId invariants would be weakened.

## Explicit Non-goals

Task440 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
- add or modify projection DTO / projection service runtime,
- add or modify tests / fixtures / smoke / browser tests,
- add scan script / CI,
- modify `package.json`,
- modify localization files / message catalogs,
- add or modify DB schema / migration / index,
- execute DB / DDL / psql / `npm run db:migrate` / Migration020 dry-run/apply,
- trigger provider sending / LINE / SMS / Email / App / survey,
- call AI provider / RAG / vector DB,
- access shared / prod / Zeabur runtime,
- process or output token / secret / actual `DATABASE_URL` / raw channel id /
  complete phone / complete address / production data,
- modify Inventory docs,
- approve runtime.

## Verification Plan

For Task440, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task440.

## Completion Report Checklist

Codex completion report must include:

- modified files,
- whether the task was docs-only,
- implementation summary,
- not implemented items,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether any table / API / permission / audit log / smoke test changed,
- whether sensitive data / token / secret / personal data / LINE logic was
  touched,
- whether customer channel identity / organization isolation / SaaS-ready /
  entitlement / seat billing / usage billing / AI add-on / Enterprise SSO was
  affected,
- future tasks listed only, without expanding implementation scope.
