# Task 746 — Data Correction App/Server Permission Alias Coverage / No Runtime Change

## Scope

This task extends Data Correction permission alias coverage through the mounted app and server bootstrap paths.

## Changes

- Added app-factory coverage proving `data_correction.request` authorizes `post_departure_freeze` through the full mounted route and calls the manual handling writers.
- Added server-bootstrap coverage proving `dispatch.follow_up.propose` authorizes `follow_up_proposal` through the mounted route and calls the follow-up draft writer.
- Expanded the synthetic writer harness so route/app/server composition checks cover correction, appointment result, contact log, dispatch note, audit, and follow-up draft paths.

## Runtime Boundary

- No source runtime behavior changed.
- No database connection was created.
- No migration was added or applied.
- No API shape changed.
- No real audit/contact/dispatch persistence was connected.
- No LINE/SMS/App notification sending, AI/RAG/vector runtime, Field Service Report mutation, final appointment mutation, billing/settlement mutation, or customer-visible data expansion was added.

## Guardrails Preserved

- App and server options still require explicit injected Data Correction writers.
- Server `options.app` priority still bypasses Data Correction options.
- Permission alias behavior remains role-scoped and route-mediated.
- Response and writer checks still reject raw phone, address, LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPermissionCompatibility.integration.test.js`: PASS, 15 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 468 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1687 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
