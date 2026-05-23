# Task 747 — Data Correction App/Server Shortcut Writer Options / No DB

## Scope

This task adds lightweight app/server shortcut wiring for injected Data Correction writers, matching the existing bounded runtime pattern used by other injected modules.

## Changes

- `src/app.js` now composes `dataCorrection` options from individual shortcut writer options when no explicit nested `dataCorrection` object is provided.
- `src/server.js` now composes the same shortcut writer options before creating an app through `createServerBootstrap` or `resolveServerApp`.
- Explicit nested `dataCorrection` options keep priority over shortcut writers.
- Added app and server coverage for shortcut `dataCorrectionCorrectionWriter` and explicit-option priority.

Supported shortcut options:

- `dataCorrectionAppointmentResultWriter`
- `dataCorrectionAuditWriter`
- `dataCorrectionContactLogWriter`
- `dataCorrectionCorrectionWriter`
- `dataCorrectionDispatchNoteWriter`
- `dataCorrectionEngineerNotificationWriter`
- `dataCorrectionEvidenceWriter`
- `dataCorrectionFollowUpDraftWriter`

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No API shape changed.
- No real audit/contact/dispatch persistence was connected.
- No LINE/SMS/App notification sending, AI/RAG/vector runtime, Field Service Report mutation, final appointment mutation, billing/settlement mutation, or customer-visible data expansion was added.

## Guardrails Preserved

- Shortcut writer options are opt-in and injected-only.
- Explicit nested `dataCorrection` options remain the source of truth when present.
- Data Correction route permission middleware remains required before controller execution.
- Response and writer checks still reject raw phone, address, LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`: PASS, 22 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 472 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1691 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
