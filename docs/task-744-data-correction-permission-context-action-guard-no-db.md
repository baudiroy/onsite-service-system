# Task 744 — Data Correction Permission Context Action Guard / No DB

## Scope

This task hardens the Data Correction governance controller so a trusted route permission context cannot be used for a different action than the one the middleware allowed.

## Changes

- When `req.dataCorrectionPermissionContext.allowedActionTypes` is present, the controller now requires the incoming governance `actionType` to be included in that safe list.
- Direct controller compatibility without `allowedActionTypes` is preserved for injected tests and existing internal call paths.
- Added controller coverage that a permission context allowed only for `data_correction_request` cannot run `pre_departure_apply`.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No real audit/contact/dispatch persistence was connected.
- No phone identity update runtime, LINE/SMS/App provider sending, AI/RAG/vector runtime, Field Service Report mutation, final appointment mutation, billing/settlement mutation, or customer-visible data expansion was added.

## Guardrails Preserved

- Permission middleware remains the source of allowed route actions when present.
- Mismatched action attempts fail closed with a generic response.
- Writers do not execute on mismatched permission-context actions.
- Response sanitization still strips phone/channel/token/secret/raw payload/final appointment fields.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js`: PASS, 17 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 464 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1683 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
