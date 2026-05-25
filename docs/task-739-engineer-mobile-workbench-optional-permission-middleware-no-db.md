# Task 739 — Engineer Mobile Workbench Optional Permission Middleware / No DB

## Scope

This task adds a bounded Engineer Mobile Workbench permission middleware and optional route wiring.

## Changes

- Added `engineerMobileWorkbenchPermissionMiddleware`.
- The middleware checks:
  - `organizationId`,
  - `userId`,
  - `engineerId`,
  - allowed role,
  - compatible Engineer Mobile / Workbench permission.
- Workbench routes now enable this middleware only when `options.permission` is provided.
- Existing default Workbench route behavior is preserved for current injected-runtime tests.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No real provider, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload runtime, formal Field Service Report mutation, final appointment inference, billing/settlement mutation, customer-facing report publication, or audit runtime was added.
- This task does not make Workbench permission middleware mandatory by default; that remains a later bounded runtime task.

## Guardrails Preserved

- Denied responses are generic and do not leak raw reasons, raw identity, token, secret, customer phone, channel ids, internal notes, AI raw payload, or final appointment data.
- AI role is denied.
- Workbench provider execution is blocked when the optional permission middleware denies a request.
- Allowed context is reduced to organization / user / engineer / role / permissions.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchPermissionMiddleware.unit.test.js`: PASS, 7 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 160 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1674 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
