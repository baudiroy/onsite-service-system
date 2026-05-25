# Task 727 — Engineer Mobile Query Executor Adapter Contract / No DB Connection

## Scope

This task adds a standalone query executor adapter contract for future Engineer Mobile read-model DB execution.

The adapter is not wired into app/server bootstrap and does not create or open any DB connection.

## Runtime Decision

- Added `src/engineerMobile/engineerMobileQueryExecutorAdapter.js`.
- The adapter accepts an injected query function or query client.
- It only executes query specs that are:
  - `ok: true`
  - `executable: true`
  - named as an approved Engineer Mobile read-model query
  - carrying non-empty SQL text
- It maps query params to a fixed positional order per approved query name.
- Unknown, malformed, non-executable, or failing query specs fail closed with `{ rows: [] }`.

## Guardrails

- No real DB connection.
- No `psql`, SQL execution against a real database, migration apply, or migration dry-run.
- No schema/index change.
- No Admin frontend change.
- No LINE/SMS/App push/notification runtime.
- No AI/RAG/vector/provider runtime.
- No official Case / Appointment / Field Service Report mutation.
- No sensitive payload logging.
- Query adapter is inert unless explicitly imported and given a query client by a future approved task.

## Coverage Added

- Approved list and detail query names use fixed parameter order.
- Injected query client receives only SQL text plus ordered values.
- Non-executable, malformed, and unknown query specs do not call the client.
- Query failures fail closed without logging raw errors.
- Returned rows are cloned so caller mutation does not affect source rows.
- Source-boundary test confirms no DB/pool/app/server/notification/AI/RAG imports.

## Future Task

A later bounded task may wire this adapter behind an explicitly injected disposable/local DB client or production-safe runtime boundary. Migration 022 remains not applied and not dry-run by this task.
