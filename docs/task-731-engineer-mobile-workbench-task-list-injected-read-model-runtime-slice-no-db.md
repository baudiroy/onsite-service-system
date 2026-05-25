# Task 731 — Engineer Mobile Workbench Task List Injected Read Model Runtime Slice / No DB

## Scope

This task enables the Engineer Mobile Workbench task list endpoint to use the existing Engineer Mobile task-list read model path when a safe task source is injected.

## Changes

- `EngineerMobileWorkbenchController.listTasks` now delegates to the existing Engineer Mobile task-list response builder when `engineerMobileTaskListOptions` are injected.
- `engineerMobileWorkbench.routes` now exposes `createEngineerMobileWorkbenchRouter(options)` while preserving the default skeleton router behavior.
- The central route index passes `options.engineerMobileWorkbench || options.engineerMobile` into the Workbench router factory.
- Added runtime unit coverage proving injected read model / task provider paths return assigned, scoped, sanitized tasks.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No real provider, notification, LINE/SMS/App push, AI, RAG, vector DB, file upload, completion submission, appointment mutation, Field Service Report mutation, or audit runtime was added.
- Default Engineer Mobile Workbench behavior remains skeleton-only unless a task source is explicitly injected by app/server tests or future bootstrap wiring.

## Guardrails Preserved

- Engineer tasks are filtered by `organizationId` and `engineerId`.
- Missing engineer auth is denied before task source execution.
- Output uses the existing safe Engineer Mobile task allow-list.
- Internal notes, audit data, raw identity fields, tokens, secrets, and `finalAppointmentId` do not appear in task list output.
- One Case / one formal Field Service Report and backend-owned `finalAppointmentId` invariants are unchanged.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskListRuntime.unit.test.js`: PASS, 15 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 114 passed / 0 failed.
- `node --test tests/engineerMobile/*.js tests/engineerMobileWorkbench/*.js`: PASS, 1628 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
