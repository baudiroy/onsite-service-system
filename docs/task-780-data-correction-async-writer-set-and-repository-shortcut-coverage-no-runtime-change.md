# Task 780 — Data Correction Async Writer Set and Repository Shortcut Coverage

## Scope

Add bounded coverage for async Data Correction writers when they are supplied through app/server writer-set and repository shortcut options.

This task validates the existing composition path for `dataCorrectionWriterSet` and `dataCorrectionRepository.getWriterSet()` without changing runtime code. It does not add DB access, migrations, provider sending, AI, RAG, LINE, SMS, package scripts, or smoke scripts.

## Changes

- Added app factory coverage proving async writer-set shortcut options are awaited for `follow_up_proposal`.
- Added app factory coverage proving async repository writer-set shortcut options are awaited for `follow_up_proposal`.
- Added server bootstrap coverage proving async writer-set shortcut options are awaited for `follow_up_proposal`.
- Added server bootstrap coverage proving async repository writer-set shortcut options are awaited for `follow_up_proposal`.
- Confirmed the existing shortcut composition maps writer-set and repository shortcut options into the Data Correction controller async handler path.

## Guardrails

- Follow-up proposal remains a draft/proposal path, not an automatic appointment creation path.
- No formal appointment or Field Service Report is created by this coverage slice.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.
- No DB connection, migration, provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 56 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 531 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1803 passed / 0 failed.
- `git diff --check` — PASS.
