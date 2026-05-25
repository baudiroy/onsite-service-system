# Task 737 — Engineer Mobile Workbench Server Dedicated Options Wiring / No DB

## Scope

This task wires dedicated Engineer Mobile Workbench runtime options through `createServerBootstrap`.

## Changes

- `server.js` now carries `engineerMobileWorkbench` options into `createApp`.
- Dedicated Workbench options remain higher priority than `engineerMobile` fallback options.
- `options.app` still has priority and bypasses Workbench provider composition.
- Added server bootstrap coverage for:
  - `createServerBootstrap({ engineerMobileWorkbench })`,
  - dedicated Workbench options overriding `engineerMobile` fallback,
  - app priority bypassing Workbench options,
  - source import boundary checks.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No provider sending, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload runtime, formal Field Service Report mutation, final appointment inference, billing/settlement mutation, customer-facing report publication, or audit runtime was added.
- This only exposes already-injected Workbench options through server bootstrap composition.

## Guardrails Preserved

- Workbench access remains scoped by authenticated request context.
- Default server behavior remains unchanged unless dedicated Workbench options are explicitly provided.
- Existing `options.app` priority remains intact.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskStatusOperationRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchContextRuntime.unit.test.js`: PASS, 32 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 150 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1664 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
