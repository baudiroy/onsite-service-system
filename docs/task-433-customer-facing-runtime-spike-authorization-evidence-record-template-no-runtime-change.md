# Task433 - Customer-Facing Runtime Spike Authorization Evidence Record Template / No Runtime Change

Task433 defines a future-only authorization evidence record template for any
possible customer-facing local-only runtime spike.

This task is documentation-only. It does not collect approval, does not
authorize runtime work, does not start a local-only runtime spike, and does not
add code, tests, fixtures, DB changes, API changes, provider sending, or
AI/RAG work.

## Purpose

The purpose is to give PM and Codex a consistent record format for future
runtime authorization decisions.

Task433 answers:

- what evidence must be captured before any runtime spike,
- how to record allowed and prohibited scope,
- how to map the evidence to NO-GO / CONDITIONAL-GO / GO,
- what Codex must still treat as not authorized.

## Non-Authorization Statement

Task433 is not runtime approval.

Task433 does not authorize:

- backend `src/` changes,
- route/controller implementation,
- resolver implementation,
- customerAccessContext implementation,
- projection DTO / projection service implementation,
- response envelope / generic safe-deny implementation,
- repository implementation,
- API implementation,
- tests,
- fixtures,
- smoke/browser/API tests,
- scan script / CI,
- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task433 only creates a future authorization evidence record template.

## Relationship to Task429-Task432

Task429 defined the authorization questions PM should ask before any runtime
spike.

Task430 decomposed the possible spike into future candidate tasks.

Task431 mapped candidate tasks to possible file touch categories.

Task432 created the preflight readiness gate and gate outcome definitions.

Task433 provides the evidence record template that can be filled out in a
future approval branch. It still does not approve runtime.

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
- No layer may output raw internal data.
- No layer may mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- No provider sending is allowed.
- No AI provider / RAG / vector DB is allowed.

## Authorization Evidence Record Template

Copy this template only when the user provides a future explicit authorization
statement. Blank values mean not approved.

All default status values are intentionally conservative.

Allowed status values:

- `Not authorized`
- `Explicitly authorized`
- `Prohibited`
- `Requires separate approval`
- `Not applicable`

```text
Task:
Conversation / reference:
Authorization timestamp:
Authorization source / user statement summary:

Overall decision:
- Final PM decision: Not authorized
- Allowed next single task: Not authorized
- Decision owner / reviewer:
- Decision rationale:

Scope confirmations:
- Local-only scope confirmation: Not authorized
- Disposable local/test environment confirmation: Not authorized
- Shared / prod / Zeabur exclusion confirmation: Not authorized
- No production data confirmation: Not authorized
- Allowed file paths:
- Forbidden file paths:
- Allowed commands:
- Forbidden commands:

Backend and customer-facing skeleton authorization:
- Backend src/ authorization status: Not authorized
- Route/controller skeleton authorization status: Not authorized
- Resolver skeleton authorization status: Not authorized
- customerAccessContext skeleton authorization status: Not authorized
- Projection DTO / projection service skeleton authorization status: Not authorized
- Response envelope / generic safe-deny authorization status: Not authorized
- Repository authorization status: Not authorized
- API endpoint authorization status: Not authorized

Test and fixture authorization:
- Synthetic fixtures authorization status: Not authorized
- Unit tests authorization status: Not authorized
- API tests authorization status: Not authorized
- Browser tests authorization status: Not authorized
- Smoke tests authorization status: Not authorized

Explicit prohibitions:
- DB / DDL / migration / Migration020 status: Prohibited unless separately and explicitly approved
- Provider sending status: Prohibited unless separately and explicitly approved
- LINE / SMS / Email / App / survey sending status: Prohibited unless separately and explicitly approved
- AI provider / RAG / vector DB status: Prohibited unless separately and explicitly approved
- Shared / prod / Zeabur runtime status: Prohibited unless separately and explicitly approved
- Production data status: Prohibited
- Token / secret / DATABASE_URL / raw channel id status: Prohibited
- Complete phone / complete address status: Prohibited
- Raw provider payload status: Prohibited

Boundary notes:
- Sensitive data prohibition status: Not authorized
- Organization isolation notes:
- Customer channel identity notes:
- SaaS entitlement notes:
- SaaS usage tracking notes:
- Permission vs entitlement notes:
- Safe-deny equivalence notes:
- Data minimization notes:

Still-prohibited items:
-

Stop conditions:
-

Codex completion report requirements:
- Modified files:
- Docs-only or runtime:
- Implemented summary:
- Not implemented:
- Verification results:
- Guardrails compliance:
- DB/API/permission/audit/smoke changes:
- Sensitive data / token / secret / personal data / LINE impact:
- Customer channel identity / organization isolation / SaaS impact:
- Future tasks listed only:
```

## Default Status Rules

Unless a future user authorization says otherwise, every runtime-related row
must remain `Not authorized`.

DB, DDL, migration, Migration020 dry-run/apply, provider sending, LINE/SMS/Email
/ App / survey sending, AI provider, RAG, vector DB, shared/prod/Zeabur runtime,
production data, tokens, secrets, raw channel ids, complete phone numbers,
complete addresses, and raw provider payloads must default to:

```text
Prohibited unless separately and explicitly approved
```

No single GO decision may implicitly approve broader runtime work.

## Decision Outcome Mapping: NO-GO / CONDITIONAL-GO / GO

### NO-GO

Use NO-GO when:

- any required authorization field is blank,
- the user statement is ambiguous,
- local-only scope is unclear,
- disposable local/test environment is unconfirmed,
- shared / prod / Zeabur exclusion is unconfirmed,
- no-production-data policy is unconfirmed,
- allowed paths or commands are too broad,
- DB / migration / provider / AI / RAG is mixed into the spike,
- organization isolation is unclear,
- customer channel identity boundary is unclear,
- safe-deny equivalence cannot be preserved.

NO-GO means Codex must not implement runtime work.

### CONDITIONAL-GO

Use CONDITIONAL-GO only when:

- the user explicitly authorizes one narrow next task,
- allowed files are named,
- allowed commands are named,
- local-only and no-production-data boundaries are clear,
- shared / prod / Zeabur are excluded,
- DB/provider/AI/RAG remain prohibited,
- required fixtures or tests are either not needed or explicitly authorized.

CONDITIONAL-GO authorizes only the named next single task. It does not authorize
later tasks by implication.

### GO

Use GO only when:

- every applicable evidence field is explicit,
- the next single task is named,
- allowed paths and commands are named,
- stop conditions are understood,
- prohibited items remain prohibited.

GO still means only the next single task may proceed. It does not activate the
entire runtime branch.

GO does not authorize:

- DB,
- migration,
- provider sending,
- AI/RAG/vector DB,
- smoke/browser/API tests,
- production data,
- shared/prod/Zeabur.

## Allowed Next Single Task Field

The evidence record must name exactly one allowed next task.

If the next task cannot be stated as one narrow item, the outcome is NO-GO.

Examples of acceptable future wording:

- "Implement route/controller skeleton only in named local files."
- "Implement resolver skeleton only in named local files."
- "Implement pure projection DTO only in named local files."

These are examples only. They are not current approvals.

## Still-Prohibited Items Field

Every evidence record must preserve a still-prohibited items field.

At minimum, it must list:

- DB / DDL / migration / Migration020 dry-run/apply,
- shared / prod / Zeabur runtime,
- production data,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- secrets / tokens / actual `DATABASE_URL`,
- raw channel ids,
- complete phone numbers,
- complete addresses,
- raw provider payloads,
- Inventory docs changes.

## Stop Conditions

Codex must stop before implementation if:

- authorization is missing or ambiguous,
- a broader file scope is needed,
- DB/DDL/migration becomes necessary,
- shared/prod/Zeabur access becomes necessary,
- production data becomes necessary,
- provider sending becomes necessary,
- AI provider/RAG/vector DB becomes necessary,
- fixtures/tests are needed but not authorized,
- raw token/channel/customer data appears,
- organization isolation cannot be preserved,
- customer channel identity scoping cannot be preserved,
- safe-deny equivalence cannot be preserved,
- customer-facing code would mutate Case, Appointment, Field Service Report,
  complaint, billing, settlement, identity, token, link, or audit state,
- finalAppointmentId would be decided by the customer-facing chain,
- Field Service Report invariant would be weakened.

## Security / Privacy / Sensitive Data Boundaries

Future authorization records must not include actual:

- token,
- secret,
- `DATABASE_URL`,
- raw channel id,
- raw `line_user_id`,
- complete phone number,
- complete address,
- raw provider payload,
- production customer data.

Only sanitized summaries may be recorded.

The customer-facing chain must keep deny responses generic and must not leak
whether a case, customer, channel identity, token, phone number, or link exists.

## Organization Isolation / Customer Channel Identity Boundaries

Future runtime tasks must preserve:

- organization scope on every lookup,
- customer channel identity scoped by organization and channel,
- no global `line_user_id` identity assumption,
- no cross-tenant lookup,
- no cross-channel lookup,
- no raw channel id output,
- generic safe-deny for missing, unauthorized, expired, or mismatched access.

Customer-facing projection work must not expose internal-only fields, audit log
details, billing internal data, settlement internal data, AI raw payload, or
provider payloads.

## SaaS / Entitlement / Usage Boundary Notes

Future authorization records must explicitly preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement checks where applicable,
- user permission checks where applicable,
- usage tracking as future observability, not access permission,
- no plan-based relaxation of security or data minimization.

Enterprise, AI add-on, usage billing, seat billing, and SSO considerations must
not weaken organization isolation, safe-deny behavior, or sensitive data
redaction.

## Explicit Non-goals

Task433 does not:

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

For Task433, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task433.

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
