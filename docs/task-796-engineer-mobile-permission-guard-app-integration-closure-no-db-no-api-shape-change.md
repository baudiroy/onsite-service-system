# Task796 - Engineer Mobile Permission Guard App Integration Closure / No DB No API Shape Change

Status: completed

Scope: Engineer Mobile permission guard app/provider integration closure / static guard / no DB / no API shape change

## Purpose

Task796 closes the Task795 app/provider integration slice for the Task793 permission / assignment guard.

The goal is to prove the integration remains explicit opt-in, synthetic-context only, and does not become a global permission service, API contract change, DB path, audit writer, completion writer, or `finalAppointmentId` mutation path.

## Changed Files

- `tests/engineerMobile/engineerMobilePermissionGuardAppIntegrationClosure.static.test.js`
- `docs/task-796-engineer-mobile-permission-guard-app-integration-closure-no-db-no-api-shape-change.md`
- `docs/design/engineer-mobile-workbench.md`

Tiny source safety clarification:

- `src/engineerMobile/engineerMobileTaskListService.js`
- `src/engineerMobile/engineerMobileTaskDetailService.js`
- `src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js`

The clarification requires explicit `permissionAssignmentGuardEnabled` or `usePermissionAssignmentGuard` opt-in before an injected guard can run.

## Closure Evidence

Task796 verifies:

- Task795 evidence document exists.
- Task795 app/provider unit test exists.
- Guard integration is explicit opt-in and synthetic-context only.
- Default behavior remains backward compatible when guard is not enabled.
- Allowed app/provider outputs preserve the existing response shapes:
  - list: `status` / `tasks`
  - detail: `status` / `detail`
- Denied list/detail paths remain safe empty or existing not-found / denied envelopes.
- Source files do not import global permission services, DB, repository singletons, env/config/network/logger, provider/webhook, AI/RAG, completion/report writers, global app/server/router code, admin code, package code, or smoke code.
- Source files do not introduce completion writes, Field Service Report writes, `finalAppointmentId` exposure/inference/mutation, provider sending, AI/RAG, or DB behavior.

## Accepted Boundary

The integration remains:

- explicit opt-in only
- synthetic-context only
- app/provider read path only
- no API shape change
- no route/controller/global app change
- no real DB
- no migration
- no psql
- no db:migrate
- no DDL
- no dry-run
- no apply
- no real permission service
- no global permission model expansion
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

## Safe Result Contract

Guard-enabled allowed output keeps existing read response shapes:

- `status` / `tasks`
- `status` / `detail`

Guard-enabled denied output remains safe:

- list returns an empty task result through the existing app/provider shape
- detail returns the existing not-found / denied envelope

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
node --test tests/engineerMobile/engineerMobilePermissionGuardAppIntegrationClosure.static.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobilePermissionGuardAppIntegrationClosure.static.test.js docs/task-796-engineer-mobile-permission-guard-app-integration-closure-no-db-no-api-shape-change.md docs/design/engineer-mobile-workbench.md src/engineerMobile/engineerMobileTaskListService.js src/engineerMobile/engineerMobileTaskDetailService.js src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js
```

## Future Tasks

Future tasks require separate explicit PM approval:

- real assignment resolver integration
- real permission service integration
- real audit writer integration
- task-read evidence logging
- route/controller policy hardening
- real DB repository promotion after Migration 022 authorization
- smoke / integration coverage
- admin / mobile UI behavior
- completion submission persistence

Task796 does not approve any of those steps.
