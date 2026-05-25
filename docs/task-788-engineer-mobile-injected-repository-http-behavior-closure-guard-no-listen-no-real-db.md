# Task788 - Engineer Mobile Injected Repository HTTP Behavior Closure Guard / No Listen No Real DB

Status: completed

Scope: Engineer Mobile injected repository HTTP behavior closure / static guard / no listen / no real DB / no API shape change

## Purpose

Task788 closes the Task787 HTTP-style unit slice for the Engineer Mobile injected repository provider path.

The accepted boundary is app-like unit coverage only: Task787 uses the existing `createApp` handler with fake `dbClient` or fake `transaction`, but it does not call `listen`, start a server, connect a real DB, change route behavior, or add write behavior.

## Changed Files

- `tests/engineerMobile/engineerMobileInjectedRepositoryHttpBehaviorClosure.static.test.js`
- `docs/task-788-engineer-mobile-injected-repository-http-behavior-closure-guard-no-listen-no-real-db.md`
- `docs/design/engineer-mobile-workbench.md`

## Accepted Boundary

Task787 covers:

- HTTP-style task list request through the existing app-like handler
- HTTP-style task detail request through the existing app-like handler
- fake dbClient injected repository path
- fake `dbClient` injected repository path
- fake transaction injected repository path
- fake `transaction` injected repository path
- wrong-scope rows fail closed
- empty DB result fails closed
- thrown fake DB query fails closed
- malformed rows fail closed
- existing response shapes only

Task787 does not:

- call `app.listen`
- start a server
- connect a real DB
- import a global DB repository
- change API response shape
- no completion writes
- add completion writes
- no finalAppointmentId write path
- expose or mutate `finalAppointmentId`
- run migration / psql / db:migrate / DDL / dry-run / apply
- send provider / LINE / SMS / App push / webhook messages
- add AI/RAG runtime
- add entitlement/billing runtime
- add admin UI or package changes
- add smoke/integration coverage

## API Shape Decision

Task list responses remain:

- `status`
- `tasks`

Task detail responses remain:

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

## Core Invariants

Task788 preserves:

- one Case = one formal completion report
- multiple appointments / dispatch visits are allowed for one Case
- Engineer Mobile reads do not create completion reports
- Engineer Mobile reads do not decide `finalAppointmentId`
- `finalAppointmentId` remains backend/system-owned

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileInjectedRepositoryHttpBehaviorClosure.static.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobileInjectedRepositoryHttpBehaviorClosure.static.test.js docs/task-788-engineer-mobile-injected-repository-http-behavior-closure-guard-no-listen-no-real-db.md docs/design/engineer-mobile-workbench.md
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
