# Task 749 — Engineer Mobile Workbench Task Provider Shortcut Options / No DB

## Scope

This task extends the Engineer Mobile Workbench app/server shortcut option pattern to task list and task detail providers.

## Changes

- `src/app.js` now accepts:
  - `engineerMobileWorkbenchTaskProvider`
  - `engineerMobileWorkbenchTasksProvider`
- `src/server.js` now accepts the same shortcut options through `createServerBootstrap` and `resolveServerApp`.
- App factory coverage verifies shortcut task providers serve:
  - `GET /api/v1/engineer/mobile-workbench/tasks`
  - `GET /api/v1/engineer/mobile-workbench/tasks/:taskId`
- Server bootstrap coverage verifies the same task list/detail shortcut behavior.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No API shape changed.
- No real task repository or persistence provider was connected.
- No LINE/SMS/App push, AI/RAG/vector runtime, Field Service Report mutation, final appointment mutation, billing/settlement mutation, or customer-visible data expansion was added.

## Guardrails Preserved

- Shortcut task providers are opt-in and injected-only.
- Explicit nested `engineerMobileWorkbench` options remain the source of truth when present.
- Workbench permission middleware remains available and keeps denying before provider execution when configured.
- Task list/detail responses still filter cross-engineer rows and redact raw phone, raw LINE id, token, and secret marker fields.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js`: PASS, 19 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 169 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1695 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
