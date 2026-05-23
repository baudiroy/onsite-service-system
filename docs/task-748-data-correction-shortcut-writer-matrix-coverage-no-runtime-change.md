# Task 748 — Data Correction Shortcut Writer Matrix Coverage / No Runtime Change

## Scope

This task adds focused coverage for the Data Correction app/server shortcut writer matrix introduced in Task 747.

## Changes

- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js` now verifies every Data Correction shortcut writer can be routed through `createApp`.
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` now verifies every Data Correction shortcut writer can be routed through `createServerBootstrap`.
- The matrix covers:
  - pre-departure correction application
  - engineer reconfirm notification intent
  - post-departure manual handling contact / dispatch / audit writers
  - unable-to-complete appointment result and evidence writers
  - follow-up proposal writer

## Runtime Boundary

- No production runtime behavior changed.
- No database connection is created.
- No migration was added or applied.
- No API shape changed.
- No real audit/contact/dispatch persistence was connected.
- No LINE/SMS/App notification sending, AI/RAG/vector runtime, Field Service Report mutation, final appointment mutation, billing/settlement mutation, or customer-visible data expansion was added.

## Guardrails Preserved

- Shortcut writer options remain opt-in and injected-only.
- Explicit nested `dataCorrection` options remain the higher-priority source of truth from Task 747.
- Data Correction route permission middleware remains required before controller execution.
- Test payloads remain synthetic and assert safe output redaction for raw phone, address, LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`: PASS, 24 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 474 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1693 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
