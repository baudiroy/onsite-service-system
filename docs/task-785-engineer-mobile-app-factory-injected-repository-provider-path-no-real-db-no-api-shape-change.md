# Task785 - Engineer Mobile App Factory Injected Repository Provider Path / No Real DB No API Shape Change

Status: completed

Scope: Engineer Mobile app-factory provider composition / injected fake DB only / no real DB / no API shape change

## Purpose

Task785 wires the Task783 injected read-model repository into the existing Engineer Mobile app factory path as an optional injected provider source.

The new path is only enabled when the caller explicitly passes an Engineer Mobile request-aware option with injected `dbClient` or `transaction`. Default app behavior remains unchanged.

## Changed Files

- `src/engineerMobile/engineerMobileReadProviderOptionsComposer.js`
- `tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js`
- `docs/task-785-engineer-mobile-app-factory-injected-repository-provider-path-no-real-db-no-api-shape-change.md`

## Implementation Boundary

The app-factory composition now supports:

- `createApp({ engineerMobile: { useRequestAwareProvider: true, dbClient } })`
- `createApp({ engineerMobile: { useRequestAwareProvider: true, transaction } })`

When those injected query boundaries are present and no explicit read source already owns the path, the composer creates the Task783 `createEngineerMobileReadModelRepository` internally and passes it to the existing Engineer Mobile list/detail read providers.

The implementation does not:

- import a global DB pool
- connect to a real DB
- change route or API response shape
- change global app/server/router files
- call `app.listen`
- create or update Field Service Reports
- expose or mutate `finalAppointmentId`
- send provider / LINE / SMS / App push / webhook notifications
- add AI/RAG runtime
- add entitlement/billing runtime
- add admin frontend behavior
- add smoke/integration tests

## Test Coverage

`tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js` covers:

- default request-aware app factory with no injected DB remains safe and empty
- nested `dbClient` option reaches the injected repository for task list
- nested `dbClient` option reaches the injected repository for task detail
- nested `transaction` option reaches the injected repository
- DB throw / malformed rows / wrong scope fail closed without raw leaks
- composer source remains free of global DB, provider, webhook, AI/RAG, completion writer, finalAppointmentId mutation, app.listen, or server start behavior

## API Shape Decision

No route or public response shape changes were made.

List route still returns the existing Engineer Mobile list envelope:

- `status`
- `tasks`

Detail route still returns the existing Engineer Mobile detail envelope:

- `status`
- `detail`

## Sensitive Output Boundary

The new injected path must not expose:

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

Task785 preserves:

- one Case = one formal completion report
- one Case may have multiple appointments / dispatch visits
- Engineer Mobile reads do not create completion reports
- Engineer Mobile reads do not decide `finalAppointmentId`
- `finalAppointmentId` remains backend/system-owned

## Runtime Decision

This is a runtime-adjacent injected composition path only.

No real DB executor, DB configuration, migration execution, API shape change, completion submission, Field Service Report write, provider sending, AI/RAG helper layer, admin UI, package change, or smoke/integration coverage is promoted by this task.

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- src/engineerMobile tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js docs/task-785-engineer-mobile-app-factory-injected-repository-provider-path-no-real-db-no-api-shape-change.md
```

## Future Tasks

Future candidates require separate explicit approval:

- Expose top-level app-factory shortcut names for injected read-model DB client, if needed.
- Add real DB executor configuration after Migration 022 dry-run/apply approval.
- Add assignment/permission runtime around real repository usage.
- Add task-read audit evidence if a later ISO controls task requires it.
- Add mobile completion submission runtime.
- Add provider/notification sending.
- Add AI/RAG helper layer.
- Add smoke/integration coverage.
