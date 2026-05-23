# Task 847 - Data Correction Request Route Permission No Correction Application Coverage / No DB / No Migration

## Scope

Strengthen route-permission coverage for `data_correction_request` so a valid request path with manual-handling writers cannot accidentally call `correctionWriter` or create official correction application records.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added route-permission middleware coverage for a valid `data_correction_request` with `case.correction.request`.
- Injected `auditWriter`, `contactLogWriter`, `dispatchNoteWriter`, and `correctionWriter` together.
- Asserted post-departure request/manual-handling writers are recorded.
- Asserted `correctionWriter` is not called, no `correction` writer result is returned, and `correctionApplicationReady` remains false.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Official correction application remains limited to the pre-departure apply path.
- Post-departure changes remain manual-handling/contact-log/dispatch-note/audit oriented.
- Route permission continues to authorize the request action without widening it into an official correction application action.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRoutePermissionMiddleware.unit.test.js` - PASS, 17 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 619 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1891 passed / 0 failed.
- `git diff --check` - PASS.
