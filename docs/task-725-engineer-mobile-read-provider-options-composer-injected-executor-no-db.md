# Task 725 — Engineer Mobile Read Provider Options Composer / Injected Executor / No DB

## Scope

This task adds a small runtime composition layer for Engineer Mobile read paths.

`createApp({ engineerMobile })` can now compose a request-aware Engineer Mobile read repository from an injected executor when all of the following are true:

- `useRequestAwareProvider: true`
- no explicit `repository`, `readModel`, `readModelAsync`, `taskProvider`, or `taskProviderAsync` is supplied
- an injected `executor`, `queryExecutor`, `listExecutor`, or `detailExecutor` is supplied

## Runtime Decision

- Added `src/engineerMobile/engineerMobileReadProviderOptionsComposer.js`.
- App factory request-aware provider wiring now normalizes Engineer Mobile options through the composer before creating list/detail providers.
- Explicit repository/readModel/taskProvider options remain caller-owned and are not overwritten.
- The composed repository uses the existing async-capable Engineer Mobile read repository layer.

## Guardrails

- No real DB connection.
- No `psql`, SQL execution, migration apply, or migration dry-run.
- No schema/index change.
- No Admin frontend change.
- No LINE/SMS/App push/notification runtime.
- No AI/RAG/vector/provider runtime.
- No sensitive payload logging.
- Query specs remain cloned/frozen before injected executor invocation.
- `allowNonExecutableForTest` remains required for the current non-executable query-spec test path.

## Coverage Added

- Composer preserves non request-aware and explicit repository/read-source options.
- Composer builds async-capable repository from injected executor.
- Composer supports `queryExecutor` alias when `executor` is absent.
- App list route works through injected executor composition.
- App detail route works through injected executor composition.
- Source boundary tests confirm no DB/pool/app/server/notification/AI imports.

## Future Task

A later bounded task may add a production-safe DB executor adapter behind an explicit opt-in and separate DB authorization boundary. Migration 022 remains not applied and not dry-run by this task.
