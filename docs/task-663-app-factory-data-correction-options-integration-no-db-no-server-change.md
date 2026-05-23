# Task 663 — App Factory Data Correction Options Integration / No DB / No Server Change

## Scope

Task663 connects the existing data correction governance route stack to the app factory options boundary.

`createApp({ dataCorrection })` can now pass injected data correction writer options into `createAppRouter({ dataCorrection })`, which then passes them to the data correction route handler added in earlier tasks.

This task intentionally keeps the change at the app factory boundary only.

## Runtime Decision

- `src/app.js` now forwards `options.dataCorrection` to `createAppRouter`.
- The default exported app created by `createApp()` is preserved.
- No `server.js` change was made.
- No real persistence writer was connected.
- No database, repository, provider, AI, notification, LINE, SMS, App push, or audit runtime was added.
- No route path was changed.
- No middleware was added.

## Covered Behaviors

The app factory unit coverage verifies:

- `src/app.js` still exports the default `app`.
- `src/app.js` still exports `createApp`.
- The default app includes `POST /data-correction/governance` and safely denies requests without auth/options.
- `createApp({ dataCorrection: { correctionWriter } })` supports pre-departure apply and calls the injected writer only during the request.
- Phone correction requests require re-verification and do not call `correctionWriter`.
- Post-departure freeze calls injected contact log, dispatch note, and audit writers.
- Unable-to-complete appointment result calls `appointmentResultWriter`.
- Follow-up proposal calls `followUpDraftWriter`.
- Responses redact raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.
- App factory creation does not call injected writers.
- `src/app.js` does not import DB, repositories, providers, AI/RAG/vector modules, or `server.js`.
- Importing app factory code does not call `app.listen`.

## Non-goals

- No DB migration.
- No DB schema change.
- No server bootstrap change.
- No `server.js` options integration.
- No permission middleware integration.
- No real audit/contact/dispatch/appointment/follow-up writer.
- No API contract expansion beyond the existing mounted route.
- No smoke, browser, fixture, or provider tests.
- No admin frontend change.
- No docs guardrail or design index change.

## Future Tasks

- Add server-level `dataCorrection` options only when the runtime writer composition path is approved.
- Add permission middleware before production exposure.
- Connect real persistence writers for correction, audit, contact log, dispatch note, appointment result, and follow-up draft through a bounded repository task.
- Add integration or smoke coverage after real persistence and permission middleware exist.
- Keep response redaction coverage when adding real writers.

## Verification

Executed verification commands:

- `node --check src/app.js`: PASS
- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`: PASS, 8 passed / 0 failed
- `git diff --check -- src/app.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js docs/task-663-app-factory-data-correction-options-integration-no-db-no-server-change.md`: PASS

## Compatibility Note

Task665/666 later added the data correction permission middleware. The Task663 app factory coverage now uses the current permission keys:

- `case.correction.apply`
- `case.correction.request`
- `appointment.result.record`
- `appointment.follow_up.propose`

This keeps Task663 aligned with the current route permission contract without changing `src/app.js` behavior.
