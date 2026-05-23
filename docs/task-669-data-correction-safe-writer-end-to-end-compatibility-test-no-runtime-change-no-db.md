# Task 669 - Data Correction Safe Writer End-to-End Compatibility Test / No Runtime Change / No DB

## Scope

Task669 adds end-to-end compatibility coverage for the Data Correction route path with the Task668 safe writer set injected into app/server options.

This task changes tests and task documentation only. It does not modify runtime source.

## Test Purpose

The test verifies the current route path can run through:

`route -> permission middleware -> controller -> orchestrator -> downstream services -> safe writers -> in-memory store`

No real server is started, no DB is connected, and no provider/AI runtime is used.

## Coverage Added

The integration test verifies:

- `createApp({ dataCorrection: safeWriterSet })` pre-departure apply writes a sanitized `correction_application` record.
- Post-departure freeze writes sanitized `contact_log`, `dispatch_note`, and `audit` records.
- Unable-to-complete result writes sanitized `appointment_result` and `audit` records, with evidence writer behavior remaining optional based on the current service-level evidence ref sanitization.
- Follow-up proposal writes sanitized `follow_up_draft`, `dispatch_note`, and `audit` records.
- Phone correction with valid permission returns re-verification and does not write `correction_application`.
- Engineer unable-to-complete works with engineer permission and the safe writer set.
- AI role is denied before any writer is called.
- The in-memory store contains only allow-listed payload keys.
- The in-memory store does not contain raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, AI raw payload, or `finalAppointmentId`.
- Store `list()` returns a copy and cannot mutate internal writes.
- `createServerBootstrap({ dataCorrection: safeWriterSet })` route path works without calling `listen`.
- The integration test imports only app, server, safe writers, and Node built-ins.

## Runtime / API / DB Decision

- Runtime source: no change.
- API: no new route; this tests existing mounted route behavior.
- DB / migration: no change.
- Permission: uses existing skeleton middleware.
- Audit log: in-memory test writer only, not real audit runtime.
- Contact/dispatch/follow-up persistence: in-memory test writer only.
- Engineer Mobile Workbench: no source change.
- LINE/SMS/App provider: no provider sending.
- AI/RAG/vector: no runtime.
- Smoke/browser: no change.

## Future Tasks

- Add real persistence writer contracts only after the storage model is approved.
- Add DB migrations only after audit/contact/dispatch/follow-up persistence design is approved.
- Add integration or smoke coverage for real persistence only after DB/repository boundaries are approved.
- Preserve safe writer allow-list behavior when adding real writer adapters.
- Keep phone re-verification from writing correction application records.

## Verification

Planned verification commands:

- `node --test tests/dataCorrection/dataCorrectionSafeWriterE2E.integration.test.js`
- `git diff --check -- tests/dataCorrection/dataCorrectionSafeWriterE2E.integration.test.js docs/task-669-data-correction-safe-writer-end-to-end-compatibility-test-no-runtime-change-no-db.md`
