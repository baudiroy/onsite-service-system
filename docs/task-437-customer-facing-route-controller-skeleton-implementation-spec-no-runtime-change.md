# Task437 - Customer-Facing Route/Controller Skeleton Implementation Spec / No Runtime Change

Task437 defines a future implementation specification for the first
customer-facing route/controller skeleton task if, and only if, the user later
selects Option B and confirms every required scope item.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to make the future Option B task narrow, inspectable, and
fail-closed before any code is written.

Task437 answers:

- what the first route/controller skeleton may do if separately authorized,
- what it must not do,
- what evidence must appear in the future completion report,
- when Codex must stop instead of implementing.

## Non-Authorization Statement

Task437 is not runtime approval.

Task437 does not authorize:

- backend `src/` changes,
- new route/controller files,
- route registration,
- resolver implementation,
- customerAccessContext implementation,
- projection DTO / projection service implementation,
- response envelope / generic safe-deny implementation,
- repository implementation,
- DB access,
- API behavior,
- tests,
- fixtures,
- smoke/browser/API tests,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task437 only defines the future scope, boundaries, acceptance criteria, and stop
conditions for a possible Option B skeleton task.

## Relationship to Task429-Task436

Task429-Task436 prepared the authorization and decision framework:

- Task429: authorization question template,
- Task430: runtime spike task breakdown,
- Task431: future file touch plan,
- Task432: preflight readiness gate,
- Task433: authorization evidence record template,
- Task434: authorization readiness closure,
- Task435: user decision packet,
- Task436: decision gate closure.

Task437 turns Option B from Task435 into a concrete future implementation spec.
It still does not approve runtime.

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
- Envelope must not bypass projection.
- Route/controller skeleton must not query DB.
- Route/controller skeleton must not return raw internal data.
- Route/controller skeleton must not mutate Case, Appointment, Field Service
  Report, complaint, billing, settlement, identity, token, link, or audit state.
- Route/controller skeleton must not trigger provider sending.
- Route/controller skeleton must not call AI provider / RAG / vector DB.

## Preconditions Before Option B Implementation

Before any future Option B implementation, all of the following must be true:

- The user explicitly selects Option B.
- Task429-style confirmations are answered item by item.
- The task is local-only only.
- A disposable local/test environment is confirmed if execution is needed.
- Shared / prod / Zeabur are explicitly excluded.
- Production data is explicitly prohibited.
- Backend `src/` path scope is explicitly allowed.
- Allowed file paths are explicitly named.
- Allowed commands are explicitly named.
- DB / DDL / migration / Migration020 remain prohibited.
- Provider sending remains prohibited.
- AI provider / RAG / vector DB remain prohibited.
- Tests / fixtures / smoke/browser/API tests are either not needed or
  separately authorized.
- The future completion report requirements are accepted.

If any item is missing, the gate remains `NO-GO`.

## Future Allowed Scope If Separately Authorized

If Option B is separately and explicitly authorized, the future implementation
may only:

- create or update the minimum route/controller skeleton named by the
  authorization,
- register a route only if the exact route file is approved,
- define a controller entrypoint only if the exact controller file is approved,
- receive a request and hand off to a resolver interface or placeholder,
- return a response envelope placeholder or generic safe-deny placeholder,
- keep all business behavior out of the controller,
- leave resolver, customerAccessContext, projection, repository, DB, audit,
  provider, AI/RAG, and mutation behavior unimplemented unless separately
  authorized.

The skeleton should be intentionally boring: it establishes structure and
boundary direction, not business logic.

## Future Forbidden Scope

Even under Option B, the future route/controller skeleton must not:

- implement real resolver logic,
- query DB,
- call repositories,
- read or write formal Case / Appointment / Field Service Report records,
- decide customer identity,
- validate or persist tokens,
- issue or mutate links,
- create audit rows,
- send notifications,
- trigger LINE/SMS/Email/App/survey,
- call AI provider,
- call RAG or vector DB,
- expose internal-only fields,
- return full payloads,
- weaken finalAppointmentId backend ownership,
- weaken one Case = one formal Field Service Report,
- weaken organization isolation or customer channel identity scoping.

## Example Future File Path Patterns

These examples are not approvals and must not be created by Task437.

Possible future path patterns, if separately authorized:

```text
src/routes/customerFacing.routes.js
src/controllers/CustomerFacingController.js
src/controllers/customerFacingController.js
```

If the existing codebase uses a different naming convention, the future task
must follow the existing convention and name exact files before implementation.

## Route / Controller Boundary Rules

The route/controller skeleton should only coordinate request entry and response
shape.

Required boundaries:

- Authentication and customer access checks must be delegated to resolver /
  customerAccessContext layers, not embedded ad hoc in the controller.
- The controller must not infer channel identity directly.
- The controller must not inspect raw provider payloads.
- The controller must not choose customer-visible fields.
- The controller must not construct projections from raw domain rows.
- The controller must not catch errors in a way that leaks existence, identity,
  token, link, phone, address, or channel state.

## Response Envelope and Generic Safe-Deny Rules

The route/controller skeleton may reference a future response envelope or
generic safe-deny placeholder only if separately authorized.

Required rules:

- Success responses must eventually come from projected customer-visible DTOs.
- Deny responses must be generic.
- Missing, unauthorized, expired, mismatched, or invalid access should not reveal
  which condition occurred to the customer.
- The skeleton must not return internal error details.
- The skeleton must not return raw domain rows.
- The skeleton must not return provider payloads.

## Future Route/Controller Skeleton Acceptance Criteria Matrix

| Area | Requirement | Allowed only if Option B explicitly authorized | Forbidden in skeleton | Evidence expected in completion report |
| --- | --- | --- | --- | --- |
| Route registration | Minimal route is registered only in named file. | Yes | Broad route rewiring or unrelated endpoints. | Exact file path and route name. |
| Controller entrypoint | Minimal controller entrypoint exists only in named file. | Yes | Business logic in controller. | Entrypoint name and scope. |
| Resolver handoff | Controller hands off to resolver interface / placeholder. | Yes | Direct DB/repository access. | Handoff path and placeholder status. |
| customerAccessContext non-bypass | Controller does not replace customerAccessContext. | Yes | Ad hoc customer/channel checks. | Statement that context remains downstream. |
| Projection non-bypass | Controller does not build customer-visible DTO from raw rows. | Yes | Raw row shaping in controller. | Statement that projection remains downstream. |
| Response envelope | Response shape uses future envelope placeholder if approved. | Yes | Returning full internal objects. | Envelope placeholder location. |
| Generic safe-deny | Deny path remains generic. | Yes | Revealing existence or mismatch reasons. | Safe-deny behavior summary. |
| No raw internal data | No internal-only data is returned. | Yes | Internal note, audit, billing internal, AI raw payload. | Sensitive data statement. |
| No mutation | No writes or side effects. | Yes | Mutating case/report/identity/link/audit state. | No mutation statement. |
| No DB access | Controller does not query DB. | Yes | DB client or repository calls. | No DB statement. |
| No provider sending | No outbound LINE/SMS/Email/App/survey call. | Yes | Any provider delivery. | No provider statement. |
| No AI / RAG / vector DB | No model or retrieval calls. | Yes | AI provider/RAG/vector DB usage. | No AI/RAG statement. |
| No production data | No production data is used. | Yes | Shared/prod/Zeabur data access. | Local-only evidence. |
| Organization isolation | Organization boundary remains required downstream. | Yes | Cross-tenant lookup or fallback. | Boundary statement. |
| Customer channel identity | Channel identity remains scoped, not global. | Yes | Treating raw channel id as global identity. | Identity boundary statement. |
| Entitlement / usage impact | Permission and entitlement remain separate. | Yes | Using usage/plan as permission bypass. | SaaS impact statement. |

## Data / Security / Privacy Boundaries

The future skeleton must not process or output actual:

- token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- raw `line_user_id`,
- complete phone number,
- complete address,
- raw provider payload,
- production customer data.

The controller may only handle request metadata needed to pass the request to
the next authorized layer. It must not log sensitive request details.

## Organization Isolation / Customer Channel Identity Boundaries

The future skeleton must preserve:

- organization scope as mandatory downstream context,
- customer channel identity scoped by organization and channel,
- no global `line_user_id` assumption,
- no cross-tenant lookup,
- no cross-channel lookup,
- generic safe-deny for missing, unauthorized, expired, or mismatched access.

The route/controller layer may not "helpfully" recover identity from other
tenants, channels, phone numbers, or customer records.

## SaaS / Entitlement / Usage Boundary Notes

The future skeleton must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement as a possible downstream gate,
- user/customer permission as a possible downstream gate,
- usage tracking as future observability, not access permission,
- plan/subscription status as a future gate, not a reason to weaken data
  minimization or safe-deny behavior.

No SaaS plan, Enterprise feature, AI add-on, seat billing, or SSO assumption may
relax organization isolation or sensitive data boundaries.

## Stop Conditions

Codex must stop before a future Option B implementation if:

- the user has not explicitly chosen Option B,
- allowed files are not named,
- allowed commands are not named,
- implementation needs resolver/customerAccessContext/projection logic beyond a
  placeholder,
- implementation needs DB access,
- implementation needs repositories,
- implementation needs tests / fixtures / smoke not separately authorized,
- implementation needs provider sending,
- implementation needs AI provider / RAG / vector DB,
- implementation needs shared/prod/Zeabur access,
- implementation needs production data,
- implementation needs raw token/channel/customer data,
- safe-deny equivalence cannot be preserved,
- organization isolation cannot be preserved,
- customer channel identity scoping cannot be preserved,
- Field Service Report or finalAppointmentId invariants would be weakened.

## Explicit Non-goals

Task437 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
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

For Task437, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task437.

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
