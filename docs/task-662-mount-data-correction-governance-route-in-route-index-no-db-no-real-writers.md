# Task662 - Mount Data Correction Governance Route in Route Index / No DB / No Real Writers

## Scope

Task662 mounts the Data Correction Governance route module into the central route index.

This task creates a live central-router route registration, but it does not modify app/server bootstrap, add DB access, add migrations, add real writers, or add provider sending.

## Runtime Change

Modified:

- `src/routes/index.js`

The central router now imports:

- `registerDataCorrectionRoutes` from `./dataCorrectionRoutes`

`createAppRouter(options = {})` now calls:

- `registerDataCorrectionRoutes(appRouter, options.dataCorrection)`

The default router remains:

- `const router = createAppRouter();`

## Route

Mounted route:

- `POST /data-correction/governance`

The route uses the Task661 route module and Task660 controller skeleton.

## Options Injection

`createAppRouter({ dataCorrection })` supports passing injected writer options through to the Data Correction controller/orchestrator layer:

- `correctionWriter`
- `auditWriter`
- `contactLogWriter`
- `dispatchNoteWriter`
- `engineerNotificationWriter`
- `appointmentResultWriter`
- `evidenceWriter`
- `followUpDraftWriter`

Task662 does not create any real writer. Writers are injected only by tests or a future approved route factory configuration.

## Tests

Added:

- `tests/dataCorrection/dataCorrectionRouteMount.unit.test.js`

Coverage includes:

- Default central router export still works.
- `createAppRouter` exports and works.
- Central router mounts `POST /data-correction/governance`.
- Mounted route handler exists and is callable.
- Missing auth returns generic `403`.
- `createAppRouter({ dataCorrection: { correctionWriter } })` with pre-departure apply request returns `200` and calls writer.
- Phone correction through mounted route returns re-verification response and does not call correction writer.
- Post-departure freeze through mounted route calls contact/dispatch/audit injected writers.
- Unable-to-complete result through mounted route calls `appointmentResultWriter`.
- Follow-up proposal through mounted route calls `followUpDraftWriter`.
- Response excludes raw phone / raw address / raw LINE id.
- Response excludes token / secret / DB URL / internal note / audit raw / AI raw / finalAppointmentId.
- Route index source does not import DB, repository, provider, AI, or server bootstrap.

## Non-goals

Task662 does not:

- Modify `src/app.js`.
- Modify `src/server.js`.
- Add permission middleware.
- Add DB queries, repositories, transactions, migrations, or schema.
- Add real persistence.
- Add real audit log, contact log, dispatch note, appointment result, or follow-up draft writers.
- Add Engineer Mobile, dispatch UI, or admin UI.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Add permission middleware and auth integration review for the live route.
2. Add repository-backed persistence for selected Data Correction actions.
3. Add real audit/contact/dispatch writers.
4. Add integration and smoke coverage once DB-backed behavior is approved.
