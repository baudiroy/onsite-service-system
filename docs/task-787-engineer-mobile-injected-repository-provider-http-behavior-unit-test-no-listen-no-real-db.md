# Task787 - Engineer Mobile Injected Repository Provider HTTP Behavior Unit Test / No Listen No Real DB

Status: completed

Scope: Engineer Mobile HTTP-style app-like unit coverage / injected fake DB only / no listen / no real DB / no API shape change

## Purpose

Task787 adds HTTP-style unit coverage proving the existing Engineer Mobile list/detail routes can use the Task785 injected repository provider path with fake DB only.

The test drives the existing app-like handler directly and does not call `app.listen`, start a server, connect a real database, or change route behavior.

## Changed Files

- `tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js`
- `docs/task-787-engineer-mobile-injected-repository-provider-http-behavior-unit-test-no-listen-no-real-db.md`

## Behavior Covered

The new unit test covers:

- task list request through `createApp({ engineerMobile: { useRequestAwareProvider: true, dbClient } })`
- task detail request through `createApp({ engineerMobile: { useRequestAwareProvider: true, transaction } })`
- wrong-scope rows fail closed
- empty DB result fails closed
- thrown fake DB query fails closed
- malformed rows fail closed
- multiple appointments for one Case remain allowed without exposing formal report ownership fields

## API Shape Decision

No public API shape changes were made.

List route still returns:

- `status`
- `tasks`

Detail route still returns:

- `status`
- `detail`

## Sensitive Output Boundary

The HTTP-style injected path must not expose:

- DB URL
- token
- secret
- raw LINE id
- LINE access token
- LINE channel secret
- full phone
- full address
- provider payload
- AI payload
- full customer payload
- credential
- customer case data
- internal note
- audit raw payload
- AI raw payload
- billing/settlement internals
- full payload
- Field Service Report id
- formal report id
- `finalAppointmentId`
- stack
- SQL

## Non-goals

Task787 does not:

- start a server
- call `listen`
- connect to a real DB
- import or configure a global DB repository
- run psql / db:migrate / DDL / dry-run / apply
- modify migrations
- modify route or response shape
- add completion submission
- create or update Field Service Reports
- expose or mutate `finalAppointmentId`
- send provider / LINE / SMS / App push / webhook messages
- add AI/RAG runtime
- add entitlement/billing runtime
- modify admin frontend
- add smoke/integration coverage

## Core Invariants

Task787 preserves:

- one Case = one formal completion report
- one Case may have multiple appointments / dispatch visits
- Engineer Mobile reads do not create completion reports
- Engineer Mobile reads do not decide `finalAppointmentId`
- `finalAppointmentId` remains backend/system-owned

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js docs/task-787-engineer-mobile-injected-repository-provider-http-behavior-unit-test-no-listen-no-real-db.md src/engineerMobile
```

## Future Tasks

Future candidates require separate explicit approval:

- Add real DB executor configuration after Migration 022 dry-run/apply approval.
- Add assignment/permission runtime around real repository usage.
- Add task-read audit evidence if a later ISO controls task requires it.
- Add mobile completion submission runtime.
- Add provider/notification sending.
- Add AI/RAG helper layer.
- Add smoke/integration coverage.
