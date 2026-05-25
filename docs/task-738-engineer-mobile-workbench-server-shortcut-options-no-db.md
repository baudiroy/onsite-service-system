# Task 738 — Engineer Mobile Workbench Server Shortcut Options / No DB

## Scope

This task adds server bootstrap shortcut options for injected Engineer Mobile Workbench providers.

Supported shortcut options:

- `engineerMobileWorkbenchContextProvider`
- `engineerMobileWorkbenchCurrentContext`
- `engineerMobileWorkbenchTaskStatusProvider`
- `engineerMobileWorkbenchArrivedProvider`
- `engineerMobileWorkbenchStartedProvider`
- `engineerMobileWorkbenchCompletionSubmissionProvider`

## Changes

- `server.js` can now compose a plain `engineerMobileWorkbench` app-factory option object from Workbench server-level shortcut options.
- Explicit nested `engineerMobileWorkbench` options still have priority over shortcut options.
- Existing `options.app` priority still bypasses Workbench provider composition.
- Added server bootstrap coverage for:
  - context shortcut provider,
  - task status shortcut provider,
  - completion submission shortcut provider,
  - dedicated Workbench option priority,
  - source-boundary checks.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No provider sending, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload runtime, formal Field Service Report mutation, final appointment inference, billing/settlement mutation, customer-facing report publication, or audit runtime was added.
- This only exposes injected Workbench provider shortcuts through server bootstrap composition.

## Guardrails Preserved

- Workbench access remains scoped by authenticated request context.
- Provider inputs remain allow-listed and scoped to organization / engineer / task context.
- Completion submission remains source-data only and cannot supply or mutate `finalAppointmentId`.
- Default server behavior remains unchanged unless Workbench options or shortcuts are explicitly provided.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js`: PASS, 7 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 153 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1667 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
