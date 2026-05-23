# Task 745 — Data Correction Route Permission Action Matrix Coverage / No Runtime Change

## Scope

This task adds route-level coverage for Data Correction permission action aliases and downstream writer behavior.

## Changes

- Added a route-stack test proving `data_correction.request` can authorize `post_departure_freeze`, populate `allowedActionTypes`, and call only the manual handling writers.
- Added a route-stack test proving `dispatch.follow_up.propose` can authorize `follow_up_proposal`, populate `allowedActionTypes`, and call only the follow-up draft writer.
- Kept coverage at the route middleware/controller seam so permission context propagation remains protected without introducing database or provider runtime.

## Runtime Boundary

- No source runtime behavior changed.
- No database connection was created.
- No migration was added or applied.
- No API shape changed.
- No real audit/contact/dispatch persistence was connected.
- No LINE/SMS/App notification sending, AI/RAG/vector runtime, Field Service Report mutation, final appointment mutation, billing/settlement mutation, or customer-visible data expansion was added.

## Guardrails Preserved

- Route permission middleware still runs before the controller.
- Permission aliases are explicit and role-scoped.
- `allowedActionTypes` remains generic and sanitized.
- Writer payload and response checks still reject raw phone, address, LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRoutePermissionMiddleware.unit.test.js`: PASS, 16 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 466 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1685 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
