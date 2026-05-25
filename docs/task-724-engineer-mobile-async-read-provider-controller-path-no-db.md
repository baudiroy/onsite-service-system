# Task 724 — Engineer Mobile Async Read Provider Controller Path / No DB

## Scope

This task adds a bounded runtime compatibility slice for Engineer Mobile Workbench read paths.

It allows the list and detail HTTP controller path to await injected async read providers or repository adapters, while preserving the existing synchronous fixture/provider behavior.

## Runtime Decision

- Added async service helpers for task list and task detail read models.
- Added async controller response/handler helpers.
- Route handlers continue using the synchronous path unless the injected options expose an async read source.
- The request-aware provider adapter now exposes `readModelAsync` and `taskProviderAsync`.
- App factory request-aware wiring now forwards async list/detail reads through those async methods.

## Guardrails

- No real DB connection.
- No migration apply or dry-run.
- No schema/index change.
- No admin frontend change.
- No LINE/SMS/App push/AI/RAG runtime.
- No sensitive payload logging.
- Existing safe field allow-lists remain in force.
- Existing sync fixture and provider compatibility remains supported.

## Coverage Added

- Async list service input mapping and fail-closed behavior.
- Async list controller input mapping.
- Async list route handler behavior.
- Async list request-aware app wiring through `repository.getReadModelAsync`.
- Async list provider adapter through `repository.getReadModelAsync`.
- Async detail provider adapter through `repository.getTaskDetailAsync`.
- Async detail route handler behavior.
- Async detail request-aware app wiring through `repository.getTaskDetailAsync`.

## Future Task

The next bounded runtime slice may connect the async read repository to an injected query executor behind the app/server factory, still without direct DB access in controllers/routes and without applying migrations.
