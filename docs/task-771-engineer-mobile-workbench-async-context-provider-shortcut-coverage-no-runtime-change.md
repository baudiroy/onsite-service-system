# Task 771 — Engineer Mobile Workbench Async Context Provider Shortcut Coverage / No Runtime Change

## Scope

Add targeted app/server compatibility coverage for async Engineer Mobile Workbench context shortcut providers:

- `engineerMobileWorkbenchContextProvider.getCurrentContext`

This task is test-only plus this implementation note. It does not change runtime behavior, API shape, migrations, DB access, provider sending, AI, RAG, LINE, SMS, package scripts, or smoke scripts.

## Changes

- Added app factory coverage that verifies async Workbench context shortcut providers are awaited.
- Added server bootstrap coverage that verifies async Workbench context shortcut providers are awaited.
- Confirmed context provider calls receive scoped `organizationId`, `engineerId`, `userId`, `role`, and permissions.
- Confirmed safe context output strips raw phone, raw LINE user id, tokens, and secrets.

## Guardrails

- Engineer Mobile Workbench remains engineer-scoped and organization-scoped.
- The shortcut path does not introduce DB execution, provider sending, AI/RAG calls, LINE/SMS behavior, or customer-visible data expansion.
- Sensitive provider fields remain filtered before response output.
- Core Case / Appointment / Field Service Report invariants are not touched.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 37 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 187 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1744 passed / 0 failed.
- `git diff --check` — PASS.
