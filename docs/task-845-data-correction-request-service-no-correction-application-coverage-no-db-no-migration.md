# Task 845 - Data Correction Request Service No Correction Application Coverage / No DB / No Migration

## Scope

Strengthen service-level coverage for `data_correction_request` so the request service cannot accidentally use `correctionWriter` or create official correction application records.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `dataCorrectionRequestService` coverage for a post-departure request with `auditWriter`, `contactLogWriter`, `dispatchNoteWriter`, and `correctionWriter` all injected.
- Asserted request/manual-handling writers are recorded when required.
- Asserted `correctionWriter` is ignored and no `correction` writer result is returned.
- Asserted `correctionApplicationReady` remains false for this request-only/manual-handling path.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Official correction application remains limited to the pre-departure apply path.
- Post-departure changes remain manual-handling/contact-log/dispatch-note/audit oriented.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 84 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 617 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1889 passed / 0 failed.
- `git diff --check` - PASS.
