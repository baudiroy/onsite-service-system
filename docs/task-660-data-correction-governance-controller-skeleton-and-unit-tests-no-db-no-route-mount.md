# Task660 - Data Correction Governance Controller Skeleton and Unit Tests / No DB / No Route Mount

## Scope

Task660 adds a controller skeleton for the Data Correction / Amendment Governance phase-1 orchestrator.

This task intentionally stops at the controller boundary:

- no route mount;
- no app/server change;
- no DB;
- no repository;
- no migration;
- no provider sending;
- no real persistence;
- no permission runtime beyond `req.auth` context;
- no smoke tests.

## Added Controller

`src/controllers/dataCorrectionController.js`

Exported API:

- `buildDataCorrectionGovernanceResponse(req, options)`
- `handleDataCorrectionGovernanceRequest(req, res, options)`
- `createDataCorrectionGovernanceHandler(options)`

The controller imports only:

- `../dataCorrection/dataCorrectionGovernanceOrchestrator`

## Request Boundary

The controller expects future middleware/route code to provide:

- `req.auth.organizationId`
- `req.auth.userId`
- `req.auth.role`
- `req.auth.permissions`
- `req.body.actionType`
- `req.body.payload`

The controller uses `req.auth` as the actor and organization source of truth for this skeleton. Body-supplied actor/organization values are not trusted.

## Response Behavior

The controller returns safe response envelopes:

- missing auth -> generic `403`;
- malformed body -> generic `400`;
- safe deny from orchestrator -> generic `403`;
- handled action -> `200`;
- downstream writer failure envelope -> `200` with safe failure metadata.

Responses do not expose raw error messages, raw request bodies, or sensitive data.

## Injected Writers / Options

The controller passes `options` through to the orchestrator. Supported injected writers remain future-route supplied only, for example:

- `correctionWriter`
- `auditWriter`
- `contactLogWriter`
- `dispatchNoteWriter`
- `engineerNotificationWriter`
- `appointmentResultWriter`
- `evidenceWriter`
- `followUpDraftWriter`

The controller does not create writers, import writers, connect to DB, write audit/contact/dispatch records itself, or send providers.

## Sensitive Data Redaction

Controller responses must not contain:

- raw phone;
- raw address;
- raw LINE id;
- `lineUserId` / `line_user_id`;
- `lineChannelId` / `line_channel_id`;
- token / secret / password;
- `DATABASE_URL` / `DB_URL` / `POSTGRES_URL`;
- internal note raw values;
- audit raw payload;
- AI raw payload;
- `finalAppointmentId`;
- raw writer errors;
- full request dumps.

## Tests

Added:

- `tests/dataCorrection/dataCorrectionController.unit.test.js`

Coverage includes:

- Controller exports response builder, handler, and handler factory.
- Missing auth returns generic `403`.
- Pre-departure apply request calls the orchestrator through the controller and returns safe `200`.
- Phone correction returns re-verification metadata without raw phone output.
- Post-departure freeze returns manual handling metadata.
- Unable-to-complete result returns safe response without FSR/finalAppointmentId.
- Follow-up proposal returns safe response without formal appointment creation.
- Injected writer options pass through to downstream orchestrator behavior.
- Writer failure does not leak raw error to the response.
- Malformed request body returns generic safe response.
- Handler calls `res.status(...).json(...)` once.
- Handler safely returns a response if `res` is malformed.
- Handler factory returns a callable function and preserves injected options.
- Request object is not mutated.
- Controller source imports only the orchestrator and has no DB, route, provider, server, or AI imports.

## Non-goals

Task660 does not:

- Add or mount routes.
- Modify app/server.
- Add DB queries, repositories, transactions, migrations, or schema.
- Add real permission middleware.
- Add real persistence.
- Add real audit log, contact log, dispatch note, appointment result, or follow-up draft writers.
- Add Engineer Mobile, dispatch UI, or admin UI.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Add route skeleton only after explicit scope approval.
2. Add real permission middleware integration.
3. Add repository-backed persistence for selected actions.
4. Add real audit/contact/dispatch writers.
5. Add integration and smoke coverage once API and DB slices are approved.
