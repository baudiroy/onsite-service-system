# Task 733 — Engineer Mobile Workbench Context Injected Runtime Slice / No DB

## Scope

This task adds the first minimal runtime slice for the Engineer Mobile Workbench `/context` endpoint.

## Changes

- Added `engineerMobileWorkbenchContextService` to build a safe current-context response from authenticated request scope.
- `EngineerMobileWorkbenchController.getCurrentContext` now delegates to the context service only when safe context options are explicitly injected.
- The Workbench router factory now recognizes injected context providers while preserving default skeleton behavior.
- Added runtime coverage for:
  - safe context success through the context service,
  - provider not called when auth scope is missing,
  - provider error fail-closed behavior,
  - controller default skeleton behavior,
  - controller injected context response,
  - Workbench route factory context path,
  - central router mounted Workbench context path.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No provider sending, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload, completion submission, appointment mutation, Field Service Report mutation, or audit runtime was added.
- Default Engineer Mobile Workbench `/context` behavior remains skeleton-only unless a context source is explicitly injected.

## Guardrails Preserved

- Context access requires authenticated `organizationId` and `engineerId`.
- Missing auth is denied before context provider execution.
- Context output is allow-listed and minimal.
- Raw phone, raw address, raw LINE identity, internal notes, audit log content, tokens, secrets, and AI raw payload fields do not appear in output.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchContextRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskListRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`: PASS, 27 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 126 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1640 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
