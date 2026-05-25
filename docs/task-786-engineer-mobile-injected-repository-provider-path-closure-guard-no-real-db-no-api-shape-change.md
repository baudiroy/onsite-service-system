# Task786 - Engineer Mobile Injected Repository Provider Path Closure Guard / No Real DB No API Shape Change

Status: completed

Scope: Engineer Mobile app-factory injected repository provider path closure / static guard / no real DB / no API shape change

## Purpose

Task786 closes the Task785 app-factory injected repository provider path.

The accepted boundary is explicit opt-in only: the app factory may compose the injected read-model repository only when Engineer Mobile options set `useRequestAwareProvider: true` and provide an injected `dbClient` or `transaction` query boundary. Default app behavior must not create a repository, query a DB, require DB config, or change the public API response shape.

## Changed Files

- `tests/engineerMobile/engineerMobileInjectedRepositoryProviderClosure.static.test.js`
- `docs/task-786-engineer-mobile-injected-repository-provider-path-closure-guard-no-real-db-no-api-shape-change.md`
- `docs/design/engineer-mobile-workbench.md`

## Accepted Boundary

Task785 introduced an optional app-factory provider composition path:

- `createApp({ engineerMobile: { useRequestAwareProvider: true, dbClient } })`
- `createApp({ engineerMobile: { useRequestAwareProvider: true, transaction } })`

Task786 locks that path with static guard coverage. The path remains:

- explicit opt-in
- fake/injected DB only
- read-model only
- mapper-approved output only
- no real DB connection
- no global DB pool import
- no API shape change
- no completion writes
- no finalAppointmentId write path
- no `finalAppointmentId` exposure, mutation, or inference
- no provider / LINE / SMS / App push / webhook sending
- no AI/RAG runtime
- no entitlement/billing runtime
- no migration or DB execution

## Source Priority Decision

Explicit read sources keep priority over injected repository creation:

- `repository`
- `readModel`
- `readModelAsync`
- `taskProvider`
- `taskProviderAsync`

Executor sources also keep the existing Task727-style read repository path:

- `executor`
- `queryExecutor`
- `listExecutor`
- `detailExecutor`

The injected read-model repository path exists only when there is no explicit read source, no executor source, and the caller supplies `dbClient` or `transaction` under the request-aware Engineer Mobile options.

## API Shape Decision

No route or public response shape changes were made.

Task list responses remain:

- `status`
- `tasks`

Task detail responses remain:

- `status`
- `detail`

## Sensitive Output Boundary

The injected repository path must not expose:

- DB URL
- token
- secret
- raw LINE id
- full phone
- full address
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

Task786 preserves:

- one Case = one formal completion report
- multiple appointments / dispatch visits are allowed for one Case
- Engineer Mobile read paths do not create completion reports
- Engineer Mobile read paths do not decide `finalAppointmentId`
- `finalAppointmentId` remains backend/system-owned

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileInjectedRepositoryProviderClosure.static.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobileInjectedRepositoryProviderClosure.static.test.js docs/task-786-engineer-mobile-injected-repository-provider-path-closure-guard-no-real-db-no-api-shape-change.md docs/design/engineer-mobile-workbench.md src/engineerMobile/engineerMobileReadProviderOptionsComposer.js
```

## Future Tasks

Future candidates require separate explicit approval:

- Add real DB executor configuration only after Migration 022 dry-run/apply approval.
- Add assignment/permission runtime around real repository usage.
- Add task-read audit evidence if a later ISO controls task requires it.
- Add mobile completion submission runtime.
- Add provider/notification sending.
- Add AI/RAG helper layer.
- Add smoke/integration coverage.
