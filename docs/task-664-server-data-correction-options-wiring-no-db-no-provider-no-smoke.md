# Task 664 — Server Data Correction Options Wiring / No DB / No Provider / No Smoke

## Scope

Task664 wires server-level `dataCorrection` options into the existing app factory path.

The server layer can now accept caller-injected `options.dataCorrection` and pass it to `createApp({ dataCorrection })` through the app factory boundary added in Task663.

This is a server options wiring task only.

## Runtime Decision

- `createServerBootstrap({ dataCorrection })` can create an app with the existing data correction governance route active.
- `resolveServerApp({ dataCorrection })` uses the app factory instead of returning the default no-options app.
- Customer Access app creation remains compatible when `customerAccessBootstrap` and `dataCorrection` are both passed.
- `options.app` remains the highest priority and wins over `dataCorrection` options.
- Bootstrap creation does not call injected writers.
- Injected writers are only called during request execution.

## Explicit Non-goals

- No `server.js` direct import of data correction services, controllers, or routes.
- No DB connection.
- No DB repository or transaction integration.
- No migration or schema change.
- No permission middleware.
- No real audit/contact/dispatch/follow-up persistence.
- No provider, LINE, SMS, Email, App push, notification, AI, RAG, or vector runtime.
- No smoke, browser, fixture, admin frontend, or package change.
- No new route path.
- No environment secret read.

## Coverage Added

The server options unit coverage verifies:

- Server module exports existing helpers.
- `options.app` priority wins over `dataCorrection` options.
- `createServerBootstrap({ dataCorrection })` creates an app with the data correction governance route active.
- Bootstrap creation does not call injected writers.
- Pre-departure apply calls injected `correctionWriter` during request execution.
- Phone correction requires re-verification and does not call `correctionWriter`.
- Post-departure freeze calls contact log, dispatch note, and audit writers.
- Unable-to-complete result calls `appointmentResultWriter`.
- Follow-up proposal calls `followUpDraftWriter`.
- Response redaction excludes raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.
- Customer Access bootstrap path remains compatible when `dataCorrection` options are also passed.
- `src/server.js` does not directly import data correction modules, DB, repositories, providers, AI/RAG/vector modules, or notification providers.
- `startServer` with a synthetic injected app still listens only when explicitly called.

## Future Tasks

- Add production permission middleware before exposing the endpoint beyond controlled injected tests.
- Add real persistence writers through bounded repository/service tasks.
- Add DB migration only after the persistence model is approved.
- Add smoke coverage only after real persistence and permission middleware exist.
- Keep response redaction tests when adding real runtime writers.

## Verification

Planned verification commands:

- `node --check src/server.js`
- `node --test tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `git diff --check -- src/server.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-664-server-data-correction-options-wiring-no-db-no-provider-no-smoke.md`
