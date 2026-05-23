# Task 844 - Data Correction Request Controller / Orchestrator No Correction Writer Coverage / No DB / No Migration

## Scope

Strengthen controller and orchestrator coverage for `data_correction_request` so the request-only path cannot be mistaken for official correction application when all writer options are available.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added orchestrator coverage for `data_correction_request` with post-departure manual-handling context and injected `auditWriter`, `contactLogWriter`, `dispatchNoteWriter`, and `correctionWriter`.
- Added controller coverage for the same path.
- Asserted the request path records only request/manual-handling writers and never calls `correctionWriter`.
- Clarified the current request contract through tests: a post-departure `data_correction_request` can be accepted and recorded as a safe request, while official correction application remains blocked from this path.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Official correction application remains limited to the pre-departure apply path.
- Post-departure changes remain manual-handling/contact-log/dispatch-note/audit oriented.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionController.unit.test.js` - PASS, 65 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 616 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1888 passed / 0 failed.
- `git diff --check` - PASS.
