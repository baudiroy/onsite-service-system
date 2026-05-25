# Task784 - Engineer Mobile Read Model Repository Closure Guard / No Real DB No API

Status: completed

Scope: docs/static test closure / no real DB / no API behavior change

## Purpose

Task784 closes the Task783 Engineer Mobile injected read-model repository slice.

The accepted boundary remains repository-read only. The repository can read Engineer Mobile read-model rows only through an injected `dbClient` or `transaction`, map them through the existing safe read-model mappers, and fail closed without exposing sensitive data.

## Changed Files

- `tests/engineerMobile/engineerMobileReadModelRepositoryClosure.static.test.js`
- `docs/task-784-engineer-mobile-read-model-repository-closure-guard-no-real-db-no-api.md`
- `docs/design/engineer-mobile-workbench.md`

## Closed Boundary

Task783-784 establish:

- injected `dbClient` / `transaction` only
- no global DB import
- No real DB connection
- no psql
- no db:migrate
- no DDL
- No migration modification or execution
- no dry-run
- no apply
- No API route wiring
- no app/server/router wiring
- No completion writes
- no Field Service Report creation or update
- No finalAppointmentId exposure or mutation
- No provider / LINE / SMS / App push / webhook runtime
- No AI/RAG runtime
- no entitlement/billing runtime
- no admin frontend
- no package change
- No smoke/integration expansion

## Static Guard Coverage

`tests/engineerMobile/engineerMobileReadModelRepositoryClosure.static.test.js` asserts:

- Task783 evidence doc/test exists.
- This Task784 closure document exists and records the no-runtime boundary.
- The repository imports only existing Engineer Mobile read-model mapper modules.
- The repository does not import global DB, env, config, network, logger, provider, webhook, AI/RAG, API route, server, completion/report writer, admin, package, or smoke code.
- The repository requires injected `dbClient` or `transaction`.
- Missing injection and missing scope fail closed.
- Thrown, malformed, or empty query results fail closed without stack, SQL, DB URL, token, secret, raw LINE id, full phone/address, raw payload, or credentials.
- The repository queries only `engineer_mobile_task_read_models` with Migration 022-safe read-model columns.
- Repository output remains mapper-approved and excludes internal/sensitive values.

## Sensitive Output Boundary

Repository output must not expose:

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

## Core Invariants

Task784 preserves:

- one Case = one formal completion report
- one Case may have multiple appointments / dispatch visits
- Engineer Mobile read model does not create completion reports
- Engineer Mobile read model does not decide `finalAppointmentId`
- `finalAppointmentId` remains backend/system-owned
- engineers do not manually select `finalAppointmentId` in the normal flow

## Runtime Decision

No runtime behavior is promoted by Task784.

Future API wiring, real DB executor configuration, permission/audit runtime, completion submission, Field Service Report writes, provider sending, AI/RAG helper layer, or smoke/integration coverage all require separate explicit bounded approval.

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileReadModelRepositoryClosure.static.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobileReadModelRepositoryClosure.static.test.js docs/task-784-engineer-mobile-read-model-repository-closure-guard-no-real-db-no-api.md docs/design/engineer-mobile-workbench.md src/engineerMobile/engineerMobileReadModelRepository.js
```

## Future Tasks

Future candidates require separate explicit approval:

- Wire repository into an API/service boundary.
- Add real DB executor configuration after Migration 022 dry-run/apply approval.
- Add assignment/permission runtime around repository usage.
- Add audit evidence for task reads if required by a later ISO controls task.
- Add mobile completion submission runtime.
- Add provider/notification sending.
- Add AI/RAG helper layer.
- Add smoke/integration coverage.
