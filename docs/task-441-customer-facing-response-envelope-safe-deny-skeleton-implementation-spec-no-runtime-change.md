# Task441 - Customer-Facing Response Envelope / Generic Safe-Deny Skeleton Implementation Spec / No Runtime Change

Task441 defines a future implementation specification for a customer-facing
response envelope / generic safe-deny skeleton task if, and only if, the user
later explicitly authorizes envelope / safe-deny skeleton work and the
route/controller, resolver, customerAccessContext, and projection preconditions
are satisfied.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to make the future response envelope / generic safe-deny skeleton
response-equivalent, no-existence-leakage-safe, and fail-closed before any code
is written.

Task441 answers:

- what a future envelope / safe-deny skeleton may do if separately authorized,
- how denied access must collapse to generic customer-facing responses,
- how response equivalence must avoid resource-existence leakage,
- what evidence must appear in the future completion report,
- when Codex must stop instead of implementing.

## Non-Authorization Statement

Task441 is not runtime approval.

Task441 does not authorize:

- backend `src/` changes,
- new response envelope / safe-deny runtime files,
- route/controller modifications,
- resolver modifications,
- customerAccessContext modifications,
- projection DTO / projection service modifications,
- repository implementation,
- DB access,
- resource lookup,
- API behavior,
- tests,
- fixtures,
- smoke/browser/API tests,
- localization file / message catalog changes,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task441 only defines the future scope, boundaries, acceptance criteria, and stop
conditions for a possible response envelope / safe-deny skeleton task.

## Relationship to Task429-Task440

Task429-Task436 prepared and closed the pre-runtime authorization decision gate.

Task437 defined the future route/controller skeleton implementation spec.

Task438 defined the future resolver skeleton implementation spec.

Task439 defined the future customerAccessContext skeleton implementation spec.

Task440 defined the future projection DTO / projection service skeleton
implementation spec.

Task441 defines the next future response envelope / generic safe-deny skeleton
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
- Envelope must not bypass projection.
- Safe-deny must not leak resource existence.
- Response equivalence must be prioritized.
- Response envelope must not output raw internal data.
- Response envelope / safe-deny must not mutate Case, Appointment, Field
  Service Report, complaint, billing, settlement, identity, token, link, or
  audit state.
- Response envelope / safe-deny must not trigger provider sending.
- Response envelope / safe-deny must not call AI provider / RAG / vector DB.

## Preconditions Before Envelope / Safe-Deny Skeleton Implementation

Before any future response envelope / safe-deny skeleton implementation, all of
the following must be true:

- The user explicitly authorizes response envelope / generic safe-deny skeleton
  work.
- Task429-style confirmations are answered item by item.
- The task is local-only only.
- A disposable local/test environment is confirmed if execution is needed.
- Shared / prod / Zeabur are explicitly excluded.
- Production data is explicitly prohibited.
- Backend `src/` envelope / safe-deny path scope is explicitly allowed.
- Allowed file paths are explicitly named.
- Allowed commands are explicitly named.
- Route/controller, resolver, customerAccessContext, and projection skeletons
  already exist, or the user explicitly authorizes an adjusted order.
- DB / DDL / migration / Migration020 remain prohibited.
- Repository access remains prohibited.
- Provider sending remains prohibited.
- AI provider / RAG / vector DB remain prohibited.
- Tests / fixtures / smoke/browser/API tests are either not needed or
  separately authorized.
- Localization file / message catalog changes are either not needed or
  separately authorized.
- The future completion report requirements are accepted.

If any item is missing, the gate remains `NO-GO`.

## Future Allowed Scope If Separately Authorized

If envelope / safe-deny skeleton work is separately and explicitly authorized,
the future implementation may only:

- create or update the minimum response envelope / safe-deny skeleton named by
  the authorization,
- receive a customer-facing DTO placeholder from projection or a deny decision
  placeholder,
- output an envelope-compatible response placeholder,
- define a generic safe-deny placeholder,
- define response equivalence skeleton rules,
- define future message key shape without editing localization files,
- keep resource lookup, repository, DB, audit, provider, AI/RAG, and mutation
  behavior unimplemented unless separately authorized.

The skeleton should establish response boundaries and generic deny behavior, not
runtime lookup or messaging.

## Future Forbidden Scope

Even under explicit envelope / safe-deny skeleton authorization, the future
implementation must not:

- implement real resource lookup,
- query DB,
- call repositories,
- read or write formal Case / Appointment / Field Service Report records,
- infer or persist customer identity,
- validate or persist tokens,
- issue or mutate links,
- create audit rows,
- create support tickets,
- create complaints,
- create follow-up tasks,
- send notifications,
- trigger LINE/SMS/Email/App/survey,
- call AI provider,
- call RAG or vector DB,
- expose internal-only fields,
- return full payloads,
- expose different messages that reveal existence or mismatch reasons,
- expose internal error codes or debug details,
- weaken finalAppointmentId backend ownership,
- weaken one Case = one formal Field Service Report,
- weaken organization isolation or customer channel identity scoping.

## Example Future File Path Patterns

These examples are not approvals and must not be created by Task441.

Possible future path patterns, if separately authorized:

```text
src/utils/customerFacingResponseEnvelope.js
src/utils/customerFacingSafeDeny.js
src/services/customerFacingResponseEnvelope.js
```

If the existing codebase uses a different naming convention, the future task
must follow the existing convention and name exact files before implementation.

## Response Envelope Boundary Rules

The response envelope skeleton should only shape customer-facing success or
deny placeholders.

Required boundaries:

- Envelope receives only projection output or a deny decision placeholder.
- Envelope does not perform DB or repository access.
- Envelope does not recover customer identity.
- Envelope does not inspect raw provider payloads.
- Envelope does not decide access.
- Envelope does not select customer-visible fields.
- Envelope does not log sensitive request details.
- Envelope does not mutate records.

## Generic Safe-Deny Rules

Generic safe-deny must collapse customer-facing denial cases into an equivalent
response.

The following conditions should collapse to generic safe-deny:

- resource does not exist,
- user/customer is unauthorized,
- cross-organization access is attempted,
- token/link is invalid,
- token/link is expired,
- token/link is reused where reuse is not allowed,
- channel identity is not verified,
- entitlement is insufficient,
- access context is missing or ambiguous,
- projection is not available.

Safe-deny must not automatically:

- create a support ticket,
- create a complaint,
- create a follow-up task,
- create an audit runtime record,
- send provider notification,
- trigger LINE/SMS/Email/App/survey.

It may define future hooks only. Hook execution requires separate explicit
authorization.

## No-Existence-Leakage and Response Equivalence Rules

Customer-facing responses must not leak resource existence.

Do not leak through:

- HTTP status differences,
- message key differences,
- field presence differences,
- timing-sensitive detail,
- internal error codes,
- debug text,
- stack traces,
- different wording for not-found vs unauthorized vs expired vs mismatched,
- different provider side effects.

Response equivalence should be preferred when a customer-facing request cannot
be safely resolved.

## Message Key / Localization Boundary Rules

The future skeleton may define a message key shape only as a placeholder.

Rules:

- Do not modify localization files or message catalogs without separate
  approval.
- Message keys must not encode existence details.
- Separate keys for not-found, unauthorized, expired, mismatched, or entitlement
  failures require separate review and still must not leak existence.
- User-facing copy must remain generic and safe.

## Future Response Envelope / Safe-Deny Skeleton Acceptance Criteria Matrix

| Area | Requirement | Allowed only if envelope / safe-deny skeleton explicitly authorized | Forbidden in skeleton | Evidence expected in completion report |
| --- | --- | --- | --- | --- |
| Envelope entrypoint | Minimal envelope entrypoint exists only in named file. | Yes | API-wide response rewrites. | Entrypoint name and file path. |
| Projection handoff | Envelope receives projection placeholder or deny placeholder. | Yes | Raw domain rows. | Handoff shape summary. |
| Envelope does not bypass projection | Envelope does not create DTO fields. | Yes | Selecting customer-visible fields. | Projection non-bypass statement. |
| Generic safe-deny | Deny response is generic and safe. | Yes | Detailed denial reasons. | Safe-deny summary. |
| No existence leakage | Response avoids resource existence leaks. | Yes | Not-found vs unauthorized disclosure. | Equivalence statement. |
| Response equivalence | Deny cases collapse to equivalent response. | Yes | Different status/message/timing details. | Equivalence evidence. |
| Message key boundary | Message key shape is placeholder only. | Yes | Localization file/catalog changes. | Message boundary statement. |
| No raw internal data | No internal-only data is returned. | Yes | Internal note, audit, billing internal, AI raw payload. | Sensitive data statement. |
| No mutation | No writes or side effects. | Yes | Mutating case/report/identity/link/audit state. | No mutation statement. |
| No DB access | Envelope/safe-deny does not query DB. | Yes | DB client calls. | No DB statement. |
| No repository access | Envelope/safe-deny does not call repositories. | Yes | Repository calls. | No repository statement. |
| No provider sending | No outbound LINE/SMS/Email/App/survey call. | Yes | Any provider delivery. | No provider statement. |
| No AI / RAG / vector DB | No model or retrieval calls. | Yes | AI provider/RAG/vector DB usage. | No AI/RAG statement. |
| No production data | No production data is used. | Yes | Shared/prod/Zeabur data access. | Local-only evidence. |
| Organization isolation | Deny equivalence protects organization boundary. | Yes | Cross-tenant detail leakage. | Boundary statement. |
| Customer channel identity | Channel identity remains scoped, not exposed. | Yes | Raw channel id disclosure. | Identity boundary statement. |
| Entitlement / usage impact | Permission and entitlement remain separate. | Yes | Using usage/plan as permission bypass. | SaaS impact statement. |
| Audit/logging hook boundary | Hooks may be named only for future work. | Yes | Writing audit runtime rows. | Hook boundary statement. |

## Data / Security / Privacy Boundaries

The future envelope / safe-deny skeleton must not process or output actual:

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
future response shape. It must not log sensitive request details.

## Organization Isolation / Customer Channel Identity Boundaries

The future envelope / safe-deny skeleton must preserve:

- organization scope as already established by upstream context,
- customer channel identity scoped by organization and channel,
- no global `line_user_id` assumption,
- no cross-tenant output,
- no cross-channel output,
- generic safe-deny compatibility for missing, unauthorized, expired, or
  mismatched access.

Envelope and safe-deny output may not "helpfully" reveal whether another
tenant, channel, phone number, address, token, or customer record exists.

## SaaS / Entitlement / Usage Boundary Notes

The future envelope / safe-deny skeleton must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement as a possible upstream gate,
- user/customer permission as a possible upstream gate,
- usage tracking as future observability, not access permission,
- plan/subscription status as a future gate, not a reason to weaken data
  minimization or safe-deny behavior.

Entitlement failure should not produce customer-facing existence leakage.

## Stop Conditions

Codex must stop before a future envelope / safe-deny skeleton implementation if:

- the user has not explicitly authorized envelope / safe-deny skeleton work,
- allowed files are not named,
- allowed commands are not named,
- route/controller, resolver, customerAccessContext, or projection skeleton is
  required but absent and order is not explicitly adjusted,
- implementation needs real resource lookup,
- implementation needs DB access,
- implementation needs repositories,
- implementation needs localization file / message catalog changes not
  separately authorized,
- implementation needs tests / fixtures / smoke not separately authorized,
- implementation needs provider sending,
- implementation needs AI provider / RAG / vector DB,
- implementation needs shared/prod/Zeabur access,
- implementation needs production data,
- implementation needs raw token/channel/customer data,
- response equivalence cannot be preserved,
- no-existence-leakage cannot be preserved,
- organization isolation cannot be preserved,
- customer channel identity scoping cannot be preserved,
- Field Service Report or finalAppointmentId invariants would be weakened.

## Explicit Non-goals

Task441 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
- add or modify response envelope / safe-deny runtime,
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

For Task441, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task441.

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
