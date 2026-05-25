# Task 736 — Engineer Mobile Workbench App Factory Dedicated Options Wiring / No DB

## Scope

This task wires dedicated Engineer Mobile Workbench runtime options through `createApp`.

## Changes

- `createApp` now passes `options.engineerMobileWorkbench` into the central router.
- Dedicated `engineerMobileWorkbench` options take priority over the existing `engineerMobile` fallback inside the route aggregation layer.
- Added app-factory coverage for:
  - `createApp({ engineerMobileWorkbench })` mounting dedicated Workbench context options,
  - dedicated Workbench options taking priority over `engineerMobile`,
  - `engineerMobile` remaining the fallback when no dedicated Workbench options exist,
  - default Workbench context skeleton behavior without injected options.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No provider sending, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload runtime, formal Field Service Report mutation, final appointment inference, billing/settlement mutation, customer-facing report publication, or audit runtime was added.
- This only exposes already-injected Workbench options through app factory composition.

## Guardrails Preserved

- Workbench access remains scoped by authenticated request context.
- Default behavior remains skeleton-only with no dedicated or fallback injected options.
- The dedicated Workbench option path does not bypass organization scope, permissions, or existing route-level safe envelopes.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskStatusOperationRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchContextRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskListRuntime.unit.test.js`: PASS, 38 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 146 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1660 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
