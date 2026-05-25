# Task789 - Engineer Mobile Injected Repository Branch Closure Checkpoint / No Real DB No API Change

Status: completed

Scope: Engineer Mobile injected repository runtime-adjacent branch closure / static guard / no real DB / no API shape change

## Purpose

Task789 closes the Engineer Mobile injected repository runtime-adjacent branch after Task783 through Task788.

The accepted boundary is injected-only and fake-DB unit coverage only. The branch has an injected read-model repository, explicit app-factory provider composition, and app-like HTTP behavior coverage, but it still does not connect a real DB, start a server, change API shape, run Migration 022, or add write behavior.

## Changed Files

- `tests/engineerMobile/engineerMobileInjectedRepositoryBranchClosure.static.test.js`
- `docs/task-789-engineer-mobile-injected-repository-branch-closure-checkpoint-no-real-db-no-api-change.md`
- `docs/design/engineer-mobile-workbench.md`

## Branch Evidence

Task789 summarizes these accepted slices:

- Task783: injected read-model repository with fake `dbClient` / fake `transaction` unit coverage.
- Task784: repository closure guard proving injected-only, no real DB, no API wiring, no completion writes, and no `finalAppointmentId` exposure or mutation.
- Task785: app-factory provider composition path for explicit `useRequestAwareProvider` plus injected `dbClient` / `transaction`.
- Task786: provider composition closure guard proving explicit opt-in only, no real DB, no API shape change, no completion writes, and no `finalAppointmentId` mutation.
- Task787: HTTP-style app-like unit behavior through existing list/detail paths with fake injected DB only.
- Task788: HTTP behavior closure guard proving no listen, no real DB, no API shape change, no completion writes, and no `finalAppointmentId` mutation.

## Accepted Boundary

The current branch remains:

- injected-only
- fake-DB tested only
- no listen
- no server start
- no real DB
- no psql
- no db:migrate
- no DDL
- no dry-run
- no apply
- no Migration 022 execution
- no API shape change
- no completion writes
- no Field Service Report creation or update
- no finalAppointmentId write path
- no `finalAppointmentId` exposure, inference, or mutation
- no provider sending
- no LINE runtime
- no SMS runtime
- no App push runtime
- no webhook runtime
- no AI/RAG runtime
- no entitlement/billing runtime
- no admin UI
- no package change
- no smoke or integration expansion

## API Shape Decision

Task list responses remain:

- `status`
- `tasks`

Task detail responses remain:

- `status`
- `detail`

Task789 does not add, remove, or rename public response fields.

## Repository and Provider Decision

The repository remains usable only through injected boundaries:

- injected `dbClient`
- injected `transaction`

The app-factory provider composition path remains explicit opt-in only:

- `engineerMobile.useRequestAwareProvider=true`
- plus injected `dbClient` or injected `transaction`

Explicit read sources and executor sources still keep priority over injected repository creation.

## Sensitive Output Boundary

The injected repository branch must not expose:

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

Task789 preserves:

- one Case = one formal completion report
- multiple appointments / dispatch visits are allowed for one Case
- Engineer Mobile read paths do not create completion reports
- Engineer Mobile read paths do not decide `finalAppointmentId`
- `finalAppointmentId` remains backend/system-owned

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileInjectedRepositoryBranchClosure.static.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobileInjectedRepositoryBranchClosure.static.test.js docs/task-789-engineer-mobile-injected-repository-branch-closure-checkpoint-no-real-db-no-api-change.md docs/design/engineer-mobile-workbench.md
```

## Future Tasks

Future runtime candidates require separate explicit approval:

- real DB executor configuration after Migration 022 dry-run/apply approval
- assignment/permission runtime around real repository usage
- task-read audit evidence if an ISO controls task requires it
- mobile completion submission runtime
- Field Service Report write flow
- `finalAppointmentId` handling in the backend-owned completion path
- provider/notification sending
- AI/RAG helper layer
- smoke/integration coverage

This checkpoint does not approve any of those tasks.
