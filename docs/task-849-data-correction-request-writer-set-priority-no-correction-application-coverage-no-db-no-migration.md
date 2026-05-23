# Task 849 - Data Correction Request Writer Set Priority No Correction Application Coverage / No DB / No Migration

## Scope

Strengthen app/server option-priority coverage for `data_correction_request` so `dataCorrectionWriterSet` shortcut options take priority over repository shortcuts while preserving the request-only/no-correction-application boundary.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added app factory coverage where `dataCorrectionWriterSet` and a `dataCorrectionRepository` shortcut are both provided for a post-departure `data_correction_request`.
- Added server bootstrap coverage for the same option-priority path.
- Asserted writer-set audit/contact-log/dispatch-note writers are used.
- Asserted repository shortcut writers are not used.
- Asserted writer-set `correctionWriter` is not called, no `correction` writer result is returned, and `correctionApplicationReady` remains false.

## Guardrails

- Writer-set option priority does not widen `data_correction_request` into official correction application.
- Official correction application remains limited to the pre-departure apply path.
- Post-departure request paths remain manual-handling/contact-log/dispatch-note/audit oriented.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 78 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 623 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1895 passed / 0 failed.
- `git diff --check` - PASS.
