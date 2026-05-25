# Task 742 — Engineer Mobile Workbench App Shortcut Permission Wiring / No DB

## Scope

This task wires Engineer Mobile Workbench shortcut options through the app factory, matching the server bootstrap shortcut behavior added earlier.

## Changes

- `createApp` now composes app-level Workbench shortcut options into `engineerMobileWorkbench` router options when no explicit dedicated Workbench options are provided.
- Added shortcut support for:
  - `engineerMobileWorkbenchContextProvider`
  - `engineerMobileWorkbenchCurrentContext`
  - `engineerMobileWorkbenchTaskStatusProvider`
  - `engineerMobileWorkbenchArrivedProvider`
  - `engineerMobileWorkbenchStartedProvider`
  - `engineerMobileWorkbenchCompletionSubmissionProvider`
  - `engineerMobileWorkbenchPermission`
- Added app-factory tests for:
  - context shortcut provider execution,
  - permission denial before shortcut provider execution,
  - explicit dedicated Workbench options taking priority over shortcuts.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No real provider, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload runtime, formal Field Service Report mutation, final appointment inference, billing/settlement mutation, customer-facing report publication, or audit runtime was added.
- This task does not make Workbench permission mandatory by default; it only wires explicit app-factory shortcut permission options.

## Guardrails Preserved

- Explicit `engineerMobileWorkbench` options remain the highest-priority app-factory input.
- Existing `engineerMobile` fallback remains available when no dedicated Workbench options or shortcuts are provided.
- Denied responses are generic and safe.
- Shortcut providers are not executed when permission checks fail.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchPermissionMiddleware.unit.test.js`: PASS, 17 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 167 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1681 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
