# Task 743 — Data Correction Controller Permission Context Alignment / No DB

## Scope

This task aligns the Data Correction governance controller with the route permission middleware context.

## Changes

- The governance controller now prefers `req.dataCorrectionPermissionContext` when present.
- Raw `req.auth` remains the fallback for direct controller tests and existing injected paths.
- The governance payload still overrides caller payload organization/actor fields with the trusted request context.
- Added controller coverage showing middleware-produced permission context can drive the governance action safely without exposing caller-provided actor overrides.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No real audit/contact/dispatch persistence was connected.
- No phone identity update runtime, LINE/SMS/App provider sending, AI/RAG/vector runtime, Field Service Report mutation, final appointment mutation, billing/settlement mutation, or customer-visible data expansion was added.

## Guardrails Preserved

- Payload-provided organization and actor fields cannot override the trusted request context.
- Controller direct-call compatibility with `req.auth` remains.
- Response sanitization still strips phone/channel/token/secret/raw payload/final appointment fields.
- AI role remains blocked by the permission and policy layers.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js`: PASS, 16 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 463 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1682 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
