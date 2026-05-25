# Task 703 - Engineer Mobile Phase 1 Runtime Foundation Checkpoint

## Current Branch Status

Branch: Engineer Mobile Workbench / task list read-only Phase 1.

Status: runtime foundation established; no DB connected; no real provider; no UI.

Accepted baseline:

- Task 651
- Task 689 through Task 702

This checkpoint is documentation-only. It does not grant DB, migration, provider,
AI/RAG, audit runtime, smoke, browser, Admin UI, or production rollout approval.

## Completed Runtime Foundation

Task 651 established the initial Engineer Mobile task list read-only service,
controller, and route skeleton.

Task 689 mounted the Engineer Mobile task list route through the central route index.

Task 690 wired Engineer Mobile options through the app factory.

Task 691 wired Engineer Mobile options through the server bootstrap path while preserving
`options.app` priority.

Task 692 added the read model mapper and non-executable query spec for future task list
repository work.

Task 693 added the injected-executor read repository skeleton. It fail-closes by default
and does not execute SQL unless explicitly placed in synthetic test mode.

Task 694 added repository-to-app/server compatibility coverage without real DB access.

Task 695 added the request-aware read provider adapter for mapping request auth/query
context into repository input.

Task 696 updated the service/provider invocation contract so request-aware providers
receive sanitized request input at request execution time.

Task 697 wired the Task 695 adapter into app/server options behind
`engineerMobile.useRequestAwareProvider === true`.

Task 698 added source-boundary static coverage for the Engineer Mobile source chain.

Task 699 added the Engineer Mobile permission middleware skeleton.

Task 700 wired the permission middleware into `GET /engineer-mobile/tasks`.

Task 701 aligned the source-boundary static test after Task 700 permission middleware
wiring.

Task 702 added route index, app factory, and server factory permission compatibility
integration coverage.

## Current Live Behavior

`GET /engineer-mobile/tasks` is mounted through the central router and is reachable via
the app/server factory option path.

The route stack is:

1. Engineer Mobile permission middleware.
2. Engineer Mobile task list controller handler.

The permission middleware is an input-auth skeleton. It requires organization, user,
engineer, role, and compatible Engineer Mobile permission context. `customer_service`
is denied by default, and `ai` is denied.

The request-aware provider path can map `req.auth` / `req.query` into repository input.
Request body `organizationId` and `engineerId` are ignored as source of truth.

The repository remains injected-executor only. The SQL query spec exists for future work
but is non-executable by default. No real DB repository is connected.

There is no Engineer Mobile UI, PWA, LIFF-like entry, Admin UI integration, file upload,
signature capture, notification sending, or offline flow in this branch.

## Hard No-go Boundaries Still Active

The following remain out of scope until a future task explicitly authorizes them:

- DB execution.
- SQL execution.
- migration creation, apply, or dry-run.
- real DB repository connection.
- real provider integration.
- LINE / SMS / email / app push sending.
- AI / RAG runtime.
- audit log runtime writes.
- finalAppointmentId mutation.
- Case / Appointment / Field Service Report mutation.
- customer-visible data expansion.
- broad task visibility outside authenticated organization / engineer assignment scope.
- Admin frontend changes.
- smoke or browser tests.

## Verification Summary

The current branch has focused coverage in these families:

- Engineer Mobile task list service and controller unit tests.
- Engineer Mobile route unit and central route mount tests.
- App factory and server option tests.
- Read model mapper and query spec unit tests.
- Injected-executor repository unit tests.
- Repository compatibility / E2E-style synthetic tests.
- Request-aware provider adapter tests.
- Request-aware provider invocation contract tests.
- App/server opt-in provider wiring tests.
- Source-boundary static tests.
- Permission middleware unit tests.
- Route permission middleware unit tests.
- Route index / app / server permission compatibility integration tests.

These tests use synthetic data only and do not connect to a real database or send
notifications.

## Next Task Candidates

Candidate options:

- Engineer Mobile disposable DB/read repository dry-run authorization packet.
- Real DB read repository implementation with injected DB client, no shared DB.
- Engineer Mobile task detail read-only slice, no DB.
- Engineer Mobile UI / PWA task list skeleton.
- Engineer Mobile auth/session middleware integration.
- Return to Data Correction branch for disposable DB dry-run only if explicitly authorized.
- PM handoff / new conversation if context length is high.

## Recommended PM Next Step

Do not apply DB migrations or run DB dry-runs unless the user explicitly authorizes the
exact DB scope.

Safer next runtime options:

- Engineer Mobile task detail read-only slice, no DB.
- Engineer Mobile UI / PWA task list skeleton.
- Engineer Mobile auth/session integration if the auth boundary is ready.

If persistence is the next priority, first create a DB-read authorization packet that
states whether the target is disposable local/test DB only, confirms no shared DB target,
and lists the exact commands allowed.

## Non-goals

Task 703 does not:

- modify runtime source
- modify API behavior
- connect to a database
- execute SQL
- add or apply migrations
- modify permission runtime
- write audit logs
- send notifications
- add AI / RAG runtime
- modify smoke or browser tests
- modify admin frontend
- modify package files
- modify guardrails, design docs, or task indexes
