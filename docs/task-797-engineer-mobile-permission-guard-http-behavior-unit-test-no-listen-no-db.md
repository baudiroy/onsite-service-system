# Task797 - Engineer Mobile Permission Guard HTTP Behavior Unit Test / No Listen No DB

Status: completed

Scope: Engineer Mobile permission guard HTTP-style app-like behavior unit coverage / no listen / no DB

## Purpose

Task797 adds app-like unit coverage proving the optional injected Task793 permission / assignment guard works through the existing Engineer Mobile list and detail HTTP-style paths.

The task keeps the boundary established by Task795 and Task796:

- no API response shape change
- no listen / server start
- no real DB
- no migration / DDL / dry-run / apply
- no audit writer
- no provider sending
- no completion write
- no Field Service Report write
- no `finalAppointmentId` exposure, inference, or mutation
- no AI / RAG runtime

## Changed Files

- `tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js`
- `docs/task-797-engineer-mobile-permission-guard-http-behavior-unit-test-no-listen-no-db.md`

No source change was needed for Task797.

## Coverage

The new HTTP-style app-like unit test verifies:

- guarded list path allows an assigned engineer
- guarded detail path allows an assigned engineer
- list output preserves existing `status` / `tasks` shape
- detail output preserves existing `status` / `detail` shape
- multiple appointments for one Case can be returned without introducing formal completion report ownership
- unassigned synthetic engineer context returns a safe empty list
- cross-organization synthetic context returns the existing safe not-found / denied detail envelope
- missing auth, unknown role, and missing permission fail closed
- guard disabled behavior remains backward compatible
- the test uses `app.handle(req, res)` and does not start a server
- responses do not expose sensitive or internal data

## Accepted Boundary

Task797 remains:

- app-like unit test only
- explicit opt-in guard only
- synthetic-context only
- existing response shapes only
- no route/controller/global app change
- no real DB
- no migration
- no psql
- no db:migrate
- no DDL
- no dry-run
- no apply
- no permission service expansion
- no audit writer
- no completion write
- no Field Service Report write
- no `finalAppointmentId` exposure, inference, or mutation
- no provider sending
- no LINE / SMS / App push / webhook runtime
- no AI / RAG
- no entitlement / billing runtime
- no admin UI
- no package change
- no smoke / integration expansion

## Safe Output Contract

Responses must not expose:

- stack
- SQL
- DB URL
- token
- secret
- raw LINE id
- full phone
- full address
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- Field Service Report id
- formal report id
- `finalAppointmentId`

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js docs/task-797-engineer-mobile-permission-guard-http-behavior-unit-test-no-listen-no-db.md src/engineerMobile
```

## Future Tasks

Future tasks require separate explicit PM approval:

- real assignment resolver integration
- real permission service integration
- real audit writer integration
- task-read evidence logging
- real DB repository promotion after Migration 022 authorization
- smoke / integration coverage
- admin / mobile UI behavior
- completion submission persistence

Task797 does not approve any of those steps.
