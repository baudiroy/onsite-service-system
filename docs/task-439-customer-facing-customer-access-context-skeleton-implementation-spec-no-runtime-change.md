# Task439 - Customer-Facing customerAccessContext Skeleton Implementation Spec / No Runtime Change

Task439 defines a future implementation specification for a customer-facing
customerAccessContext skeleton task if, and only if, the user later explicitly
authorizes customerAccessContext skeleton work and the route/controller and
resolver preconditions are satisfied.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to make the future customerAccessContext skeleton task narrow,
deny-by-default, identity-safe, and fail-closed before any code is written.

Task439 answers:

- what a future customerAccessContext skeleton may do if separately authorized,
- how it must represent access decisions without real lookup,
- how it must avoid identity shortcuts,
- what evidence must appear in the future completion report,
- when Codex must stop instead of implementing.

## Non-Authorization Statement

Task439 is not runtime approval.

Task439 does not authorize:

- backend `src/` changes,
- new customerAccessContext runtime files,
- route/controller modifications,
- resolver modifications,
- repository implementation,
- DB access,
- customer lookup,
- token/link validation runtime,
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

Task439 only defines the future scope, boundaries, acceptance criteria, and stop
conditions for a possible customerAccessContext skeleton task.

## Relationship to Task429-Task438

Task429-Task436 prepared and closed the pre-runtime authorization decision gate.

Task437 defined the future route/controller skeleton implementation spec.

Task438 defined the future resolver skeleton implementation spec.

Task439 defines the next future customerAccessContext skeleton implementation
spec. It still does not approve runtime.

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
- customerAccessContext must not query DB directly.
- customerAccessContext must not directly produce customer-facing projection.
- customerAccessContext must not output raw internal data.
- customerAccessContext must not mutate Case, Appointment, Field Service Report,
  complaint, billing, settlement, identity, token, link, or audit state.
- customerAccessContext must not trigger provider sending.
- customerAccessContext must not call AI provider / RAG / vector DB.

## Preconditions Before customerAccessContext Skeleton Implementation

Before any future customerAccessContext skeleton implementation, all of the
following must be true:

- The user explicitly authorizes customerAccessContext skeleton work.
- Task429-style confirmations are answered item by item.
- The task is local-only only.
- A disposable local/test environment is confirmed if execution is needed.
- Shared / prod / Zeabur are explicitly excluded.
- Production data is explicitly prohibited.
- Backend `src/` customerAccessContext path scope is explicitly allowed.
- Allowed file paths are explicitly named.
- Allowed commands are explicitly named.
- Route/controller skeleton and resolver skeleton already exist, or the user
  explicitly authorizes an adjusted order.
- DB / DDL / migration / Migration020 remain prohibited.
- Repository access remains prohibited.
- Provider sending remains prohibited.
- AI provider / RAG / vector DB remain prohibited.
- Tests / fixtures / smoke/browser/API tests are either not needed or
  separately authorized.
- The future completion report requirements are accepted.

If any item is missing, the gate remains `NO-GO`.

## Future Allowed Scope If Separately Authorized

If customerAccessContext skeleton work is separately and explicitly authorized,
the future implementation may only:

- create or update the minimum customerAccessContext skeleton named by the
  authorization,
- receive normalized request context from resolver,
- define an access decision placeholder,
- return an allow-list compatible placeholder or deny-by-default placeholder,
- document future identity inputs without implementing real lookup,
- keep all customer lookup, token/link validation, repository, DB, audit,
  provider, AI/RAG, projection, and mutation behavior unimplemented unless
  separately authorized.

The skeleton should establish access-boundary shape and fail-closed behavior,
not runtime identity verification.

## Future Forbidden Scope

Even under explicit customerAccessContext skeleton authorization, the future
customerAccessContext must not:

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
- treat token/link as customer identity,
- treat `line_user_id` as global identity,
- expose internal-only fields,
- return full payloads,
- weaken finalAppointmentId backend ownership,
- weaken one Case = one formal Field Service Report,
- weaken organization isolation or customer channel identity scoping.

## Example Future File Path Patterns

These examples are not approvals and must not be created by Task439.

Possible future path patterns, if separately authorized:

```text
src/services/customerAccessContext.js
src/services/CustomerAccessContext.js
src/customer-facing/customerAccessContext.js
```

If the existing codebase uses a different naming convention, the future task
must follow the existing convention and name exact files before implementation.

## customerAccessContext Boundary Rules

The customerAccessContext skeleton should represent an access decision boundary,
not execute real lookup.

Required boundaries:

- It receives normalized request context from resolver.
- It defaults to deny.
- It exposes only an allow-list compatible placeholder shape.
- It does not read raw provider payloads.
- It does not perform direct DB or repository access.
- It does not decide customer-visible fields.
- It does not create projections from raw domain rows.
- It does not log sensitive request details.

## Identity / Verification / Token-Link Boundary Rules

The skeleton must preserve these identity rules:

- A token or link is not a customer identity.
- A token or link can only be future verification material after explicit
  runtime authorization.
- `line_user_id` is not a global identity.
- Customer channel identity must be scoped by organization and channel.
- Phone numbers and addresses must not be used as silent identity recovery.
- Missing, expired, reused, mismatched, or unauthorized verification material
  must all map to generic safe-deny.

Task439 does not implement token validation, link validation, channel identity
lookup, or customer identity binding.

## Organization Isolation Rules

The skeleton must preserve:

- organization scope as mandatory input or downstream context,
- no cross-tenant lookup,
- no cross-channel lookup,
- no fallback to other organizations,
- no provider payload based lookup,
- deny-by-default when organization context is absent or ambiguous.

## Projection Non-Bypass Rules

Projection remains downstream of customerAccessContext.

The customerAccessContext skeleton must not:

- select customer-visible fields directly,
- redact internal fields manually as a substitute for projection,
- return internal DTOs to the resolver or controller,
- expose audit log, billing internal data, settlement internal data, AI raw
  payload, or provider payloads.

## Response Envelope and Generic Safe-Deny Compatibility

The customerAccessContext skeleton may return only envelope-compatible access
decision placeholders.

Required rules:

- Allow placeholder must be allow-list compatible and contain no raw internal
  data.
- Deny placeholder must be generic and safe.
- Missing, unauthorized, expired, mismatched, or invalid access should not reveal
  which condition occurred to the customer.
- Internal exceptions must not be exposed to customer-facing responses.

## Future customerAccessContext Skeleton Acceptance Criteria Matrix

| Area | Requirement | Allowed only if customerAccessContext skeleton explicitly authorized | Forbidden in skeleton | Evidence expected in completion report |
| --- | --- | --- | --- | --- |
| customerAccessContext entrypoint | Minimal context entrypoint exists only in named file. | Yes | Runtime identity logic. | Entrypoint name and file path. |
| Resolver handoff | Context receives normalized resolver input. | Yes | Raw provider payload handling. | Handoff shape summary. |
| Access decision placeholder | Returns allow-list compatible or deny placeholder. | Yes | Real customer lookup. | Placeholder result shape. |
| Deny-by-default behavior | Default state is denied / not resolved. | Yes | Default allow behavior. | Deny default statement. |
| customerAccessContext non-bypass | Context remains the access boundary. | Yes | Moving access decisions to controller/resolver. | Non-bypass statement. |
| Projection non-bypass | Context does not build customer-visible DTOs. | Yes | Returning raw rows or internal DTOs. | Projection boundary statement. |
| Response envelope compatibility | Return shape is compatible with future envelope. | Yes | Full internal objects. | Envelope compatibility note. |
| Generic safe-deny | Deny path remains generic. | Yes | Revealing existence or mismatch reasons. | Safe-deny behavior summary. |
| No raw internal data | No internal-only data is returned. | Yes | Internal note, audit, billing internal, AI raw payload. | Sensitive data statement. |
| No mutation | No writes or side effects. | Yes | Mutating case/report/identity/link/audit state. | No mutation statement. |
| No DB access | Context does not query DB. | Yes | DB client calls. | No DB statement. |
| No repository access | Context does not call repositories. | Yes | Repository calls. | No repository statement. |
| No provider sending | No outbound LINE/SMS/Email/App/survey call. | Yes | Any provider delivery. | No provider statement. |
| No AI / RAG / vector DB | No model or retrieval calls. | Yes | AI provider/RAG/vector DB usage. | No AI/RAG statement. |
| No production data | No production data is used. | Yes | Shared/prod/Zeabur data access. | Local-only evidence. |
| Organization isolation | Organization boundary remains mandatory. | Yes | Cross-tenant lookup or fallback. | Boundary statement. |
| Customer channel identity | Channel identity remains scoped, not global. | Yes | Treating raw channel id as global identity. | Identity boundary statement. |
| `line_user_id` scoped identity | LINE id is scoped by organization and channel. | Yes | Global `line_user_id` identity. | Scoped LINE identity note. |
| Token/link non-identity | Token/link are not customer identity. | Yes | Treating link possession as identity. | Token/link boundary note. |
| Entitlement / usage impact | Permission and entitlement remain separate. | Yes | Using usage/plan as permission bypass. | SaaS impact statement. |

## Data / Security / Privacy Boundaries

The future customerAccessContext skeleton must not process or output actual:

- token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- raw `line_user_id`,
- complete phone number,
- complete address,
- raw provider payload,
- production customer data.

The skeleton may only handle the minimum normalized context needed to represent
future access decision shape. It must not log sensitive request details.

## Customer Channel Identity Boundaries

The future customerAccessContext skeleton must preserve:

- organization-scoped customer channel identity,
- channel-scoped customer channel identity,
- no global `line_user_id` assumption,
- no cross-tenant lookup,
- no cross-channel lookup,
- no fallback to phone/address identity recovery,
- generic safe-deny for missing, unauthorized, expired, or mismatched access.

The context layer may not "helpfully" recover identity from other tenants,
channels, phone numbers, addresses, tokens, or customer records.

## SaaS / Entitlement / Usage Boundary Notes

The future customerAccessContext skeleton must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement as a possible downstream gate,
- user/customer permission as a possible downstream gate,
- usage tracking as future observability, not access permission,
- plan/subscription status as a future gate, not a reason to weaken data
  minimization or safe-deny behavior.

No SaaS plan, Enterprise feature, AI add-on, seat billing, or SSO assumption may
relax organization isolation or sensitive data boundaries.

## Stop Conditions

Codex must stop before a future customerAccessContext skeleton implementation
if:

- the user has not explicitly authorized customerAccessContext skeleton work,
- allowed files are not named,
- allowed commands are not named,
- route/controller or resolver skeleton is required but absent and order is not
  explicitly adjusted,
- implementation needs real customer lookup,
- implementation needs token/link validation runtime,
- implementation needs channel identity lookup runtime,
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

Task439 does not:

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

For Task439, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task439.

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
