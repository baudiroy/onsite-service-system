# Task438 - Customer-Facing Resolver Skeleton Implementation Spec / No Runtime Change

Task438 defines a future implementation specification for a customer-facing
resolver skeleton task if, and only if, the user later explicitly authorizes
resolver skeleton work and the route/controller preconditions are satisfied.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to make the future resolver skeleton task narrow, inspectable,
and fail-closed before any code is written.

Task438 answers:

- what a future resolver skeleton may do if separately authorized,
- how it must hand off to customerAccessContext,
- how it must avoid projection and DB responsibilities,
- what evidence must appear in the future completion report,
- when Codex must stop instead of implementing.

## Non-Authorization Statement

Task438 is not runtime approval.

Task438 does not authorize:

- backend `src/` changes,
- new resolver files,
- route/controller modifications,
- repository implementation,
- DB access,
- customer lookup,
- customerAccessContext implementation,
- projection DTO / projection service implementation,
- response envelope / generic safe-deny implementation,
- API behavior,
- tests,
- fixtures,
- smoke/browser/API tests,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task438 only defines the future scope, boundaries, acceptance criteria, and stop
conditions for a possible resolver skeleton task.

## Relationship to Task429-Task437

Task429-Task436 prepared and closed the pre-runtime authorization decision gate.

Task437 defined the future Option B route/controller skeleton implementation
spec.

Task438 defines the next future resolver skeleton implementation spec. It still
does not approve runtime.

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
- Resolver must not query DB directly.
- Resolver must not directly produce customer-facing projection.
- Resolver must not output raw internal data.
- Resolver must not mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- Resolver must not trigger provider sending.
- Resolver must not call AI provider / RAG / vector DB.

## Preconditions Before Resolver Skeleton Implementation

Before any future resolver skeleton implementation, all of the following must
be true:

- The user explicitly authorizes resolver skeleton work.
- Task429-style confirmations are answered item by item.
- The task is local-only only.
- A disposable local/test environment is confirmed if execution is needed.
- Shared / prod / Zeabur are explicitly excluded.
- Production data is explicitly prohibited.
- Backend `src/` resolver path scope is explicitly allowed.
- Allowed file paths are explicitly named.
- Allowed commands are explicitly named.
- A route/controller skeleton already exists, or the user explicitly authorizes
  an adjusted order.
- DB / DDL / migration / Migration020 remain prohibited.
- Repository access remains prohibited.
- Provider sending remains prohibited.
- AI provider / RAG / vector DB remain prohibited.
- Tests / fixtures / smoke/browser/API tests are either not needed or
  separately authorized.
- The future completion report requirements are accepted.

If any item is missing, the gate remains `NO-GO`.

## Future Allowed Scope If Separately Authorized

If resolver skeleton work is separately and explicitly authorized, the future
implementation may only:

- create or update the minimum resolver skeleton named by the authorization,
- receive normalized request context from route/controller,
- prepare a handoff to customerAccessContext placeholder,
- return a generic safe-deny placeholder or envelope-compatible result
  placeholder,
- define typed or documented placeholder result shape if consistent with the
  existing codebase,
- keep all customer lookup, projection, repository, DB, audit, provider,
  AI/RAG, and mutation behavior unimplemented unless separately authorized.

The resolver skeleton should establish flow direction and fail-closed behavior,
not business logic.

## Future Forbidden Scope

Even under explicit resolver skeleton authorization, the future resolver must
not:

- implement real customer lookup,
- query DB,
- call repositories,
- read or write formal Case / Appointment / Field Service Report records,
- infer or persist customer identity,
- validate or persist tokens,
- issue or mutate links,
- create audit rows,
- build customer-facing projection DTOs,
- return raw domain rows,
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

These examples are not approvals and must not be created by Task438.

Possible future path patterns, if separately authorized:

```text
src/services/customerFacingResolver.js
src/services/CustomerFacingResolver.js
src/resolvers/customerFacingResolver.js
```

If the existing codebase uses a different naming convention, the future task
must follow the existing convention and name exact files before implementation.

## Resolver Boundary Rules

The resolver skeleton should coordinate between controller input and
customerAccessContext handoff.

Required boundaries:

- Resolver receives normalized request context, not raw provider payloads.
- Resolver does not perform direct DB or repository access.
- Resolver does not decide customer-visible fields.
- Resolver does not create projections from raw domain rows.
- Resolver does not log sensitive request details.
- Resolver defaults to generic safe-deny if required downstream context is not
  available.

## customerAccessContext Handoff Rules

The resolver skeleton may define a future customerAccessContext handoff
placeholder only if separately authorized.

Required rules:

- customerAccessContext remains the authority for customer/channel access
  context.
- Resolver must not replace customerAccessContext with ad hoc channel checks.
- Resolver must not treat raw channel id as global identity.
- Resolver must not recover identity across organization, tenant, or channel
  boundaries.
- Resolver must keep access decisions fail-closed.

## Projection Non-Bypass Rules

Projection remains downstream of customerAccessContext.

The resolver skeleton must not:

- select customer-visible fields directly,
- redact internal fields manually as a substitute for projection,
- return internal DTOs to the controller,
- expose audit log, billing internal data, settlement internal data, AI raw
  payload, or provider payloads.

## Response Envelope and Generic Safe-Deny Compatibility

The resolver skeleton may return only envelope-compatible placeholders.

Required rules:

- A success placeholder must be compatible with a future projected DTO.
- A denial placeholder must be generic.
- Missing, unauthorized, expired, mismatched, or invalid access should not reveal
  which condition occurred to the customer.
- Internal exceptions must not be exposed to customer-facing responses.

## Future Resolver Skeleton Acceptance Criteria Matrix

| Area | Requirement | Allowed only if resolver skeleton explicitly authorized | Forbidden in skeleton | Evidence expected in completion report |
| --- | --- | --- | --- | --- |
| Resolver entrypoint | Minimal resolver entrypoint exists only in named file. | Yes | Business logic in resolver. | Entrypoint name and file path. |
| Route/controller handoff | Resolver receives normalized context from route/controller. | Yes | Raw provider payload handling. | Handoff shape summary. |
| customerAccessContext handoff | Resolver calls or references context placeholder only. | Yes | Replacing context with ad hoc checks. | Handoff placeholder status. |
| customerAccessContext non-bypass | Resolver does not decide access independently. | Yes | Direct customer/channel identity decisions. | Non-bypass statement. |
| Projection non-bypass | Resolver does not build customer-visible DTOs. | Yes | Returning raw rows or internal DTOs. | Projection boundary statement. |
| Response envelope compatibility | Return shape is compatible with future envelope. | Yes | Full internal objects. | Placeholder result shape. |
| Generic safe-deny | Deny path remains generic. | Yes | Revealing existence or mismatch reasons. | Safe-deny behavior summary. |
| No raw internal data | No internal-only data is returned. | Yes | Internal note, audit, billing internal, AI raw payload. | Sensitive data statement. |
| No mutation | No writes or side effects. | Yes | Mutating case/report/identity/link/audit state. | No mutation statement. |
| No DB access | Resolver does not query DB. | Yes | DB client calls. | No DB statement. |
| No repository access | Resolver does not call repositories. | Yes | Repository calls. | No repository statement. |
| No provider sending | No outbound LINE/SMS/Email/App/survey call. | Yes | Any provider delivery. | No provider statement. |
| No AI / RAG / vector DB | No model or retrieval calls. | Yes | AI provider/RAG/vector DB usage. | No AI/RAG statement. |
| No production data | No production data is used. | Yes | Shared/prod/Zeabur data access. | Local-only evidence. |
| Organization isolation | Organization boundary remains mandatory. | Yes | Cross-tenant lookup or fallback. | Boundary statement. |
| Customer channel identity | Channel identity remains scoped, not global. | Yes | Treating raw channel id as global identity. | Identity boundary statement. |
| Entitlement / usage impact | Permission and entitlement remain separate. | Yes | Using usage/plan as permission bypass. | SaaS impact statement. |

## Data / Security / Privacy Boundaries

The future resolver skeleton must not process or output actual:

- token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- raw `line_user_id`,
- complete phone number,
- complete address,
- raw provider payload,
- production customer data.

The resolver may only handle the minimum normalized context needed to hand off
to the next authorized layer. It must not log sensitive request details.

## Organization Isolation / Customer Channel Identity Boundaries

The future resolver skeleton must preserve:

- organization scope as mandatory downstream context,
- customer channel identity scoped by organization and channel,
- no global `line_user_id` assumption,
- no cross-tenant lookup,
- no cross-channel lookup,
- generic safe-deny for missing, unauthorized, expired, or mismatched access.

The resolver layer may not "helpfully" recover identity from other tenants,
channels, phone numbers, or customer records.

## SaaS / Entitlement / Usage Boundary Notes

The future resolver skeleton must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement as a possible downstream gate,
- user/customer permission as a possible downstream gate,
- usage tracking as future observability, not access permission,
- plan/subscription status as a future gate, not a reason to weaken data
  minimization or safe-deny behavior.

No SaaS plan, Enterprise feature, AI add-on, seat billing, or SSO assumption may
relax organization isolation or sensitive data boundaries.

## Stop Conditions

Codex must stop before a future resolver skeleton implementation if:

- the user has not explicitly authorized resolver skeleton work,
- allowed files are not named,
- allowed commands are not named,
- route/controller skeleton is required but absent and order is not explicitly
  adjusted,
- implementation needs real customer lookup,
- implementation needs customerAccessContext logic beyond a placeholder,
- implementation needs projection logic,
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

Task438 does not:

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

For Task438, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task438.

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
