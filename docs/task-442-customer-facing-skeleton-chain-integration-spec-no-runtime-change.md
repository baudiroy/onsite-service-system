# Task442 - Customer-Facing Skeleton Chain Integration Spec / No Runtime Change

Task442 defines a future implementation specification for integrating the full
customer-facing skeleton chain if, and only if, the user later explicitly
authorizes chain-level integration or separately authorizes every needed
skeleton component.

This task is documentation-only. It does not authorize runtime work, does not
start a local-only runtime spike, and does not add code, tests, fixtures, DB
changes, API changes, provider sending, or AI/RAG work.

## Purpose

The purpose is to define how the future customer-facing skeleton pieces should
connect without bypassing access, projection, safe-deny, organization, identity,
or data-minimization boundaries.

Task442 answers:

- what chain-level integration may do if separately authorized,
- how each layer must hand off to the next layer,
- how deny / unknown / error cases must remain safe,
- what evidence must appear in the future completion report,
- when Codex must stop instead of implementing.

## Non-Authorization Statement

Task442 is not runtime approval.

Task442 does not authorize:

- backend `src/` changes,
- route/controller implementation,
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
- localization file / message catalog changes,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task442 only defines future customer-facing skeleton chain integration
boundaries, order, acceptance criteria, and stop conditions.

## Relationship to Task437-Task441

Task437 defined the future route/controller skeleton implementation spec.

Task438 defined the future resolver skeleton implementation spec.

Task439 defined the future customerAccessContext skeleton implementation spec.

Task440 defined the future projection DTO / projection service skeleton
implementation spec.

Task441 defined the future response envelope / generic safe-deny skeleton
implementation spec.

Task442 integrates those future specs at the chain level. It still does not
approve runtime.

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

Chain-level rules:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- customerAccessContext must not bypass projection policy.
- Projection must not bypass customerAccessContext.
- Envelope must not bypass projection.
- Safe-deny must not leak resource existence.
- Response equivalence must be prioritized.
- No layer may query DB unless a future persistence/repository task is
  separately authorized.
- No layer may output raw internal data.
- No layer may mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- No layer may trigger provider sending.
- No layer may call AI provider / RAG / vector DB.

## Preconditions Before Chain Integration

Before any future chain integration implementation, all of the following must
be true:

- The user explicitly authorizes chain-level integration or separately
  authorizes every needed skeleton component.
- Task429-style confirmations are answered item by item.
- The task is local-only only.
- A disposable local/test environment is confirmed if execution is needed.
- Shared / prod / Zeabur are explicitly excluded.
- Production data is explicitly prohibited.
- Backend `src/` allowed path scopes are explicitly listed.
- Allowed commands are explicitly named.
- Route/controller, resolver, customerAccessContext, projection, and response
  envelope / safe-deny skeleton scopes are all authorized, or the user
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

If chain integration is separately and explicitly authorized, the future
implementation may only:

- connect skeleton handoff order,
- connect placeholder input/output contracts,
- return an envelope-compatible placeholder or generic safe-deny,
- preserve allow-list-first projection,
- preserve deny-by-default access behavior,
- preserve response equivalence,
- preserve no-existence-leakage behavior,
- keep real customer lookup, repository, DB, audit, provider, AI/RAG, and
  mutation behavior unimplemented unless separately authorized.

The chain integration should prove direction and boundary compatibility, not
runtime customer-facing behavior.

## Future Forbidden Scope

Even under explicit chain integration authorization, the future integration must
not:

- implement real customer lookup,
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

These examples are not approvals and must not be created by Task442.

Possible future path patterns, if separately authorized:

```text
src/routes/customerFacing.routes.js
src/controllers/CustomerFacingController.js
src/services/customerFacingResolver.js
src/services/customerAccessContext.js
src/services/customerFacingProjectionService.js
src/utils/customerFacingResponseEnvelope.js
src/utils/customerFacingSafeDeny.js
```

If the existing codebase uses different naming conventions, the future task
must follow existing conventions and name exact files before implementation.

## Chain Handoff Contract Rules

Every handoff must be explicit and narrow:

- Route/controller receives request and calls resolver.
- Resolver receives normalized request context and calls customerAccessContext.
- customerAccessContext returns allow-list compatible or deny-by-default access
  decision placeholder.
- Projection receives only context-approved placeholder input.
- Envelope receives only projection output or deny placeholder.

No layer should accept or forward broad raw payloads.

## Layer-by-Layer Non-Bypass Rules

Non-bypass rules:

- Route/controller may not perform customer access checks directly.
- Resolver may not replace customerAccessContext.
- customerAccessContext may not build projection DTOs.
- Projection may not override customerAccessContext deny decisions.
- Envelope may not build DTO fields or reinterpret access decisions.
- Safe-deny may not branch into provider sending, audit runtime writes, or
  support workflow creation.

## Error / Deny / Unknown Handling Rules

Unknown and deny cases must fail closed.

Rules:

- Missing context defaults to deny.
- Unknown fields default to deny.
- Forbidden fields default to deny.
- Unknown identity state defaults to generic safe-deny.
- Invalid token/link defaults to generic safe-deny.
- Unverified channel identity defaults to generic safe-deny.
- Entitlement uncertainty defaults to generic safe-deny or upstream denial.
- Internal errors must not be exposed to customer-facing responses.

## Response Equivalence and No-Existence-Leakage Rules

Customer-facing responses must not leak resource existence.

Do not leak through:

- HTTP status differences,
- message key differences,
- field presence differences,
- timing-sensitive detail,
- internal error codes,
- debug text,
- different wording for not-found vs unauthorized vs expired vs mismatched,
- different provider side effects.

Resource missing, unauthorized, cross-organization, invalid token/link,
unverified channel identity, entitlement failure, and unavailable projection
should collapse to generic safe-deny whenever the customer-facing chain cannot
resolve access safely.

## Customer-Visible Data Policy Across the Chain

The chain must never expose internal-only data.

Forbidden customer-facing output includes:

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

## Identity / Token-Link / Channel Identity Boundary Rules

The chain must preserve:

- Token/link possession is not customer identity.
- Token/link verification, if ever implemented, needs separate approval.
- `line_user_id` is not a global identity.
- Customer channel identity must be scoped by organization and channel.
- Phone numbers and addresses must not be used as silent identity recovery.
- Missing, expired, reused, mismatched, or unauthorized verification material
  must map to generic safe-deny.

## Organization Isolation / SaaS / Entitlement / Usage Boundary Notes

The chain must preserve:

- organization scope as mandatory,
- no cross-tenant lookup,
- no cross-channel lookup,
- no fallback to other organizations,
- permission and entitlement as separate concepts,
- organization-level entitlement as a possible upstream gate,
- usage tracking as future observability, not access permission,
- plan/subscription status as a future gate, not a reason to weaken data
  minimization or safe-deny behavior.

No SaaS plan, Enterprise feature, AI add-on, seat billing, or SSO assumption may
relax organization isolation or sensitive data boundaries.

## Future Skeleton Chain Integration Acceptance Criteria Matrix

| Area | Requirement | Allowed only if chain integration explicitly authorized | Forbidden in integration | Evidence expected in completion report |
| --- | --- | --- | --- | --- |
| Route/controller to resolver handoff | Controller hands off to resolver only. | Yes | Controller bypassing resolver. | Handoff summary. |
| Resolver to customerAccessContext handoff | Resolver hands off to context only. | Yes | Resolver performing access lookup. | Context handoff summary. |
| customerAccessContext to projection handoff | Context provides allow-list compatible or deny placeholder. | Yes | Context building DTOs. | Access decision shape. |
| Projection to envelope handoff | Projection output passes to envelope only. | Yes | Envelope building projection fields. | Projection handoff summary. |
| Generic safe-deny fallback | Deny cases collapse safely. | Yes | Detailed denial reasons. | Safe-deny summary. |
| No layer bypass | Each layer keeps its responsibility. | Yes | Skipping resolver/context/projection/envelope. | Non-bypass statement. |
| Response equivalence | Deny responses avoid distinguishers. | Yes | Different statuses/messages/timing details. | Equivalence evidence. |
| No existence leakage | Chain does not reveal whether resource exists. | Yes | Not-found vs unauthorized disclosure. | No-leak statement. |
| Allow-list-first | Projection output is allow-list first. | Yes | Implicit spreading / pass-through. | Allow-list summary. |
| Unknown field default deny | Unknown fields are excluded by default. | Yes | Default include behavior. | Unknown-field deny statement. |
| Forbidden field default deny | Forbidden fields are excluded by default. | Yes | Internal fields in output. | Forbidden-field deny statement. |
| Customer-visible data policy | Output follows customer-visible policy. | Yes | Internal note, audit, billing internal, AI raw payload. | Policy compliance statement. |
| No raw internal data | No internal-only data is returned. | Yes | Raw provider/internal payloads. | Sensitive data statement. |
| No mutation | No writes or side effects. | Yes | Mutating case/report/identity/link/audit state. | No mutation statement. |
| No DB/repository access | Chain does not query DB or call repositories. | Yes | DB client or repository calls. | No DB/repository statement. |
| No provider sending | No outbound LINE/SMS/Email/App/survey call. | Yes | Any provider delivery. | No provider statement. |
| No AI/RAG/vector DB | No model or retrieval calls. | Yes | AI provider/RAG/vector DB usage. | No AI/RAG statement. |
| No production data | No production data is used. | Yes | Shared/prod/Zeabur data access. | Local-only evidence. |
| Organization isolation | Organization boundary remains mandatory. | Yes | Cross-tenant lookup or fallback. | Boundary statement. |
| Customer channel identity | Channel identity remains scoped, not global. | Yes | Treating raw channel id as global identity. | Identity boundary statement. |
| `line_user_id` scoped identity | LINE id is scoped by organization and channel. | Yes | Global `line_user_id` identity. | Scoped LINE identity note. |
| Token/link non-identity | Token/link are not customer identity. | Yes | Treating link possession as identity. | Token/link boundary note. |
| Entitlement / usage impact | Permission and entitlement remain separate. | Yes | Using usage/plan as permission bypass. | SaaS impact statement. |
| Audit/logging hook boundary | Hooks may be named only for future work. | Yes | Writing audit runtime rows. | Hook boundary statement. |

## Audit / Logging Hook Boundary

The future chain may name audit/logging hooks only as placeholders.

Task442 does not authorize:

- audit runtime writes,
- security event writes,
- support ticket creation,
- complaint creation,
- follow-up task creation,
- provider notification,
- analytics/usage recording.

Any such hook execution needs separate explicit approval.

## Stop Conditions

Codex must stop before a future chain integration implementation if:

- the user has not explicitly authorized chain integration or every needed
  skeleton component,
- allowed files are not named,
- allowed commands are not named,
- implementation needs real customer lookup,
- implementation needs token/link validation runtime,
- implementation needs channel identity lookup runtime,
- implementation needs projection from raw domain rows,
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

Task442 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
- add or modify customerAccessContext / projection / response envelope /
  safe-deny runtime,
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

For Task442, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task442.

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
