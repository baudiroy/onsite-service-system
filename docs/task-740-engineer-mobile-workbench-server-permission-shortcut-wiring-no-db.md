# Task 740 — Engineer Mobile Workbench Server Permission Shortcut Wiring / No DB

## Scope

This task wires the optional Engineer Mobile Workbench permission middleware through server bootstrap shortcut options.

## Changes

- `server.js` now accepts `engineerMobileWorkbenchPermission` as a server-level shortcut option.
- When Workbench shortcut providers are used, the permission option is composed into the plain `engineerMobileWorkbench` app-factory options.
- Added server bootstrap coverage for:
  - permission denial before shortcut provider execution,
  - compatible engineer permission allowing shortcut provider execution,
  - source-boundary checks.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No real provider, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload runtime, formal Field Service Report mutation, final appointment inference, billing/settlement mutation, customer-facing report publication, or audit runtime was added.
- This task does not make Workbench permission mandatory by default; it only wires explicit server shortcut permission options.

## Guardrails Preserved

- Denied responses are generic and safe.
- Shortcut providers are not executed when permission checks fail.
- Explicit nested `engineerMobileWorkbench` options still own their own permission configuration.
- Existing `options.app` priority remains intact.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchPermissionMiddleware.unit.test.js`: PASS, 16 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 162 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1676 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
