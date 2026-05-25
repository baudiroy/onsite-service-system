# Task 726 — Engineer Mobile Server Executor Shortcut Options / No DB

## Scope

This task adds a narrow runtime convenience path at server bootstrap.

`createServerBootstrap(options)` can now compose Engineer Mobile request-aware read options from server-level injected executor options without requiring callers to manually build the nested `engineerMobile` object.

Supported shortcut options:

- `engineerMobileReadExecutor`
- `engineerMobileQueryExecutor`
- `engineerMobileReadQueryExecutor`
- `engineerMobileListExecutor`
- `engineerMobileReadListExecutor`
- `engineerMobileDetailExecutor`
- `engineerMobileReadDetailExecutor`
- `engineerMobileAllowNonExecutableForTest`

## Runtime Decision

- `src/server.js` still does not import Engineer Mobile route, controller, service, repository, provider, DB, notification, or AI modules.
- Server bootstrap builds only a plain `engineerMobile` app-factory option object.
- `src/app.js` remains responsible for normalizing that object through the existing read-provider options composer.
- Explicit `engineerMobile` options continue to win over shortcut executor options.
- `options.app` still bypasses all Engineer Mobile provider wiring.

## Guardrails

- No real DB connection.
- No `psql`, SQL execution, migration apply, or migration dry-run.
- No schema/index change.
- No Admin frontend change.
- No LINE/SMS/App push/notification runtime.
- No AI/RAG/vector/provider runtime.
- No customer channel identity mutation.
- No official Case / Appointment / Field Service Report mutation.
- No sensitive payload logging.

## Coverage Added

- Server bootstrap list route can read through an injected server-level executor.
- Server bootstrap detail route can read through an injected server-level detail executor.
- Explicit nested `engineerMobile` options override shortcut executor options.
- Existing source-boundary tests continue to ensure `src/server.js` does not directly import Engineer Mobile implementation modules.

## Future Task

A later bounded task may add a production DB executor adapter behind explicit DB authorization and connection-management boundaries. Migration 022 remains not applied and not dry-run by this task.
