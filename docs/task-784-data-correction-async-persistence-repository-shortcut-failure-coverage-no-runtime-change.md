# Task 784 — Data Correction Async Persistence Repository Shortcut Failure Coverage / No Runtime Change

## Scope

Add failure-path coverage for the async persistence repository when it is passed through app/server `dataCorrectionRepository` shortcut options.

This task is test-only plus documentation. It confirms async executor failures remain safe at the mounted route boundary and do not leak raw errors or sensitive values.

## Changes

- Added app factory coverage for `createApp({ dataCorrectionRepository: repository })` with an opt-in async persistence repository whose executor rejects.
- Added server bootstrap coverage for `createServerBootstrap({ dataCorrectionRepository: repository })` with the same failure shape.
- Asserted the route returns a safe `failed` envelope for follow-up proposal writer failure.
- Asserted captured query specs remain allow-listed and do not leak raw error text, tokens, secrets, phone data, LINE identifiers, or `finalAppointmentId`.

## Guardrails

- No runtime code change.
- No DB connection is opened; tests use injected synthetic async executors only.
- No migration, schema, index, API contract, package script, provider sending, LINE/SMS/App push, AI/RAG, billing, settlement, or customer-visible behavior is introduced.
- Follow-up appointment handling remains a proposal/draft path and does not create a formal appointment.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 60 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 544 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1816 passed / 0 failed.
- `git diff --check` — PASS.
