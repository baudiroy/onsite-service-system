# Task429 - Customer-Facing Runtime Spike Authorization Question Template / No Runtime Change

Task429 defines a PM question template for obtaining explicit user
authorization before any future customer-facing local-only runtime spike.

This task is documentation-only. It does not authorize runtime work, does not
start a runtime spike, and does not add code, tests, fixtures, DB changes, API
changes, or provider/AI work.

## Purpose

The purpose of this document is to make future authorization explicit before
customer-facing runtime work begins.

It answers:

- what the PM must ask the user,
- what counts as insufficient authorization,
- what remains prohibited unless separately approved,
- what guardrails the future runtime spike must preserve.

Task429 is a template and checklist only.

## Non-Authorization Statement

Task429 is not runtime approval.

Task429 does not authorize:

- route/controller implementation,
- resolver implementation,
- API implementation,
- repository implementation,
- fixture creation,
- test creation,
- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

General wording such as "continue", "start", "go ahead", "next task",
"keep developing", or "可以做" does not count as runtime authorization.

## Why Task428 Is Not Runtime Approval

Task428 is a PM continuation handoff summary after customer-facing runtime
readiness branch closure.

Task428 confirms:

- Task403-427 are complete,
- the customer-facing runtime readiness / no-runtime branch is closed,
- no runtime is authorized,
- the next PM must preserve hard boundaries.

Task428 does not grant permission to create code, routes, controllers,
resolvers, fixtures, tests, DB schema, API endpoints, provider sending, or
AI/RAG runtime.

## Required Explicit Authorization Questions

Before a future customer-facing local-only runtime spike begins, PM must ask
the user to explicitly answer each item.

Required questions:

1. Do you explicitly authorize a customer-facing local-only runtime spike?
2. Do you confirm there is a disposable local/test environment available?
3. Do you confirm shared / production / Zeabur are not targets?
4. Do you confirm production data must not be used?
5. Do you authorize modifying backend `src/` for the approved spike only?
6. Do you authorize adding a route/controller skeleton?
7. Do you authorize adding a resolver skeleton?
8. Do you authorize using or adding customerAccessContext / projection /
   response envelope skeleton code within the approved scope?
9. Do you authorize adding synthetic fixtures?
10. Do you authorize adding unit / contract tests?
11. Do you authorize API / browser / smoke tests?
12. Do you understand that DB / DDL / migration / Migration020 dry-run/apply
    remains prohibited unless separately and explicitly authorized?

If any answer is unclear, missing, conditional, or broad without scope, the
safe default is no runtime authorization.

## Authorization Template for PM to Ask User

PM may paste the following template to the user.

```text
Before Codex starts any customer-facing local-only runtime spike, please answer
each item explicitly.

1. Do you authorize a customer-facing local-only runtime spike? yes/no
2. Is there a disposable local/test environment available? yes/no
3. Confirm shared / production / Zeabur are not targets. yes/no
4. Confirm production data must not be used. yes/no
5. May Codex modify backend src/ only within this spike? yes/no
6. May Codex add a route/controller skeleton? yes/no
7. May Codex add a resolver skeleton? yes/no
8. May Codex use or add customerAccessContext / projection / response envelope
   skeleton code within this spike? yes/no
9. May Codex add synthetic fixtures? yes/no
10. May Codex add unit / contract tests? yes/no
11. May Codex run API / browser / smoke tests? yes/no
12. Do you separately authorize any DB / DDL / migration / Migration020
    dry-run/apply? yes/no

If DB / DDL / migration is yes, please specify the exact local disposable DB
target and confirm it is not shared/prod/Zeabur. Do not provide credentials in
chat.
```

This template itself does not grant permission. It only asks for permission.

## What Counts as Insufficient Authorization

The following are insufficient:

- "continue",
- "start",
- "go ahead",
- "next task",
- "keep developing",
- "可以做",
- "照 PM 規劃做",
- "照之前的做",
- approval for docs-only work,
- approval for PM planning,
- approval for Task428 handoff,
- approval for Task429 template,
- broad approval without confirming local-only scope,
- broad approval without confirming no shared/prod/Zeabur target,
- broad approval without confirming no production data,
- approval that does not list allowed file categories,
- approval that does not separate DB/DDL/migration permission.

When authorization is insufficient, continue docs-only or pause and ask a
clearer question.

## Still-Prohibited Items Unless Separately Approved

The following remain prohibited unless separately approved:

- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- schema/table/index creation,
- repository implementation,
- customer channel identity persistence,
- token/link persistence,
- audit/security event persistence,
- rate-limit middleware,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access,
- production data,
- real customer data,
- real channel identifiers,
- support workflow runtime,
- case / complaint / follow-up creation,
- link reissue runtime,
- complaint close / case close runtime,
- billing / settlement / inventory runtime.

## Customer-Facing Flow Guardrails

Any future authorized spike must preserve:

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
- No provider sending is allowed unless separately authorized.
- No AI provider / RAG / vector DB is allowed unless separately authorized.

## Data / Security / Privacy Boundaries

Future authorization must preserve:

- organization isolation,
- customer visible data policy,
- internal data policy,
- generic safe-deny,
- no existence leakage,
- response equivalence,
- allow-list first,
- unknown field default deny,
- forbidden field default deny,
- channel-agnostic identity,
- `line_user_id` is not global identity,
- token/link is not customer identity,
- token/link does not replace resolver,
- one Case equals one formal Field Service Report,
- finalAppointmentId is not decided by the customer-facing chain.

Future spike outputs must not contain:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing / settlement internal data,
- vendor reconciliation rules,
- engineer internal comments,
- supervisor review,
- raw token,
- raw channel id,
- `line_user_id`,
- complete phone number,
- complete address,
- permission / entitlement internal reason,
- rate-limit / abuse reason,
- resolver denial reason.

## Verification Plan

For Task429 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- sensitive scan on this document for actual credentials, tokens, complete
  customer personal data, raw channel identifiers, raw provider payloads, and
  production data.

Do not run:

- DB commands,
- API tests,
- browser tests,
- smoke tests,
- migration commands,
- `psql`,
- `npm run db:migrate`.

## Completion Report Checklist

Completion report must include:

- modified files,
- whether the task was docs-only,
- summary of implemented documentation,
- what was not implemented,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether data tables were added or modified,
- whether API was added or modified,
- whether permission logic was added or modified,
- whether audit log was added or modified,
- whether smoke tests were added or modified,
- whether sensitive data, token, secret, personal data, or LINE-related logic
  was touched,
- whether customer channel identity, organization isolation, SaaS-ready,
  entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO were
  affected,
- future tasks, listed only and not implemented.

## Explicit Non-goals

Task429 does not:

- modify `src/`,
- modify `admin/src/`,
- modify utilities,
- modify projection utilities,
- modify projection DTO utilities,
- modify forbidden field constants,
- modify response envelope utilities,
- modify safe-deny utilities,
- modify customerAccessContext utilities,
- add route files,
- add controller files,
- add API runtime,
- add resolver files,
- add repository runtime,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- modify localization files or message catalogs,
- modify `package.json`,
- add permission runtime,
- add audit/security event query runtime,
- add audit/security event tables,
- add support workflow runtime,
- add case runtime,
- add complaint runtime,
- add follow-up runtime,
- add link reissue runtime,
- add middleware,
- add rate-limit runtime,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger provider sending,
- trigger LINE/SMS/Email/App/survey sending,
- call AI provider,
- call RAG,
- call vector DB,
- modify Inventory docs,
- process real token, secret, `DATABASE_URL`, raw channel id, complete customer
  phone number, complete customer address, raw provider payload, or production
  data,
- claim runtime has been authorized.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
