# Task 871 - Data Correction Decision Audit Intent Side-channel Closure Guard

Status: completed

## Goal

Close the Task869-870 Data Correction audit-intent side-channel slice with static/unit guard coverage. The guard proves the audit intent remains internal opt-in metadata only, with no public API shape change, no audit write, no DB work, and no correction behavior expansion.

## Scope

Changed files:

- `tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannelClosure.static.test.js`
- `docs/task-871-data-correction-decision-audit-intent-side-channel-closure-guard-no-audit-write-no-api-shape-change.md`

No source code change was needed for Task871.

## Closure Summary

Task869 added a pure audit-intent builder:

- safe metadata only
- `auditWritten: false`
- no DB / repository / provider / AI / RAG / billing / settlement / route / controller / app / server imports
- no audit writer / sink

Task870 composed that builder into request/apply services as an internal opt-in side-channel:

- `includeDecisionAuditIntent`
- `includeAuditIntent`
- default service response remains unchanged
- opt-in shape is internal `{ response, auditIntent }`
- no route/controller/API/public envelope change
- no DB, migration, audit sink, provider, AI/RAG, billing/settlement, or admin change

Task871 adds a closure guard to keep those boundaries explicit.

## Guard Coverage

The closure guard verifies:

- Task869 and Task870 evidence docs/tests exist.
- Task870 documents opt-in internal side-channel behavior.
- default request/apply service responses do not include `auditIntent`.
- opt-in request/apply service responses return internal `{ response, auditIntent }`.
- `auditIntent.auditWritten` remains `false`.
- routes/controllers/orchestrator do not expose `auditIntent` or side-channel flags.
- request/apply/builder import boundaries remain local and pure.
- no DB, repository, provider, LINE, SMS, App push, AI/RAG, billing, settlement, config/env, network, logger, app/server, or SQL write patterns are introduced by the side-channel.
- request/apply branch separation remains closed: `data_correction_request` does not create official correction applications, and official application remains limited to valid `pre_departure_apply`.
- audit intent excludes before/after values, raw correction payload, raw phone/address/LINE id, token, secret, DB URL, stack, SQL, `finalAppointmentId`, Field Service Report/report id, internal note, audit raw payload, AI raw payload, billing/settlement internals, and full payload.

## Non-goals

This task does not:

- modify Data Correction runtime behavior.
- add audit writer / sink runtime.
- add DB persistence, repository wiring, migration, DDL, psql, dry-run, or apply.
- change API routes, controllers, DTOs, app/server wiring, status codes, or public response bodies.
- expand permission logic.
- create or alter official correction application behavior.
- call provider, LINE, SMS, App push, webhook, AI, RAG, billing, or settlement runtime.
- touch admin UI, packages, environment files, provider config, tokens, or secrets.

## Future Task Boundary

Future audit persistence remains a separate branch requiring explicit bounded approval for:

- audit writer / sink implementation.
- DB schema or migration.
- repository / transaction wiring.
- route/controller/app exposure.
- audit viewer or reporting UI.
- integration or smoke coverage.

Task871 does not authorize any of those follow-up tasks.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannelClosure.static.test.js # PASS, 9 passed / 0 failed
node --test tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js # PASS, 53 passed / 0 failed
node --test tests/dataCorrection/*.js # PASS, 685 passed / 0 failed
npm run check # PASS
find tests -type f -name '*.js' -exec node --test {} + # PASS, 2565 passed / 0 failed
git diff --check -- tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannelClosure.static.test.js docs/task-871-data-correction-decision-audit-intent-side-channel-closure-guard-no-audit-write-no-api-shape-change.md src/dataCorrection/dataCorrectionRequestService.js src/dataCorrection/preDepartureCorrectionApplicationService.js # PASS
```
