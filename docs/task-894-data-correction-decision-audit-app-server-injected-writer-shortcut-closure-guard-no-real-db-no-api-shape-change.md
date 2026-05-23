# Task 894 - Data Correction Decision Audit App/Server Injected Writer Shortcut Closure Guard

Status: completed

## Goal

Close the Task893 app/server injected `decisionAuditWriter` shortcut path with a static/unit guard.

Task893 was accepted as a bounded runtime-adjacent option plumbing slice. It touched `src/app.js` and `src/server.js` only to expose an explicit injected shortcut option that forwards to `dataCorrection.decisionAuditWriter`.

Task894 adds a closure guard proving that this remains:

- explicit-option only.
- no default writer.
- no real DB / repository / audit sink wiring.
- no public API response shape change.
- no correction behavior change.
- no Migration 025 execution.

## Modified Files

- `tests/dataCorrection/dataCorrectionDecisionAuditAppServerShortcutClosure.static.test.js`
- `docs/task-894-data-correction-decision-audit-app-server-injected-writer-shortcut-closure-guard-no-real-db-no-api-shape-change.md`

## Runtime Decision

Task894 is test/documentation only.

It does not modify:

- `src/app.js`
- `src/server.js`
- `src/dataCorrection/**`
- API routes/controllers/DTOs
- migrations
- admin frontend
- package files
- smoke tests

## Guard Coverage

The new closure guard verifies:

- Task893 evidence doc and app/server option tests exist.
- `src/app.js` and `src/server.js` expose `dataCorrectionDecisionAuditWriter` only as an explicit shortcut option.
- `decisionAuditWriter` is forwarded only from the supplied option map.
- default `createApp()` behavior has no decision audit public side-channel.
- injected app/server writers receive safe internal intent metadata only.
- `data_correction_request` remains a manual-handling path and does not call the correction writer.
- valid `pre_departure_apply` remains the official correction application path.
- injected writer success does not expand public response bodies.
- injected writer failure remains side-effect bounded and does not change the correction outcome.
- route/controller/orchestrator layers do not expose `auditIntent` or `decisionAuditWriterResult`.
- app/server do not import the Task885 repository/writer modules directly.
- app/server do not introduce DB, migration execution, provider, AI/RAG, billing, or settlement runtime wiring.

## Preserved Boundaries

Task894 preserves:

- no default `decisionAuditWriter`.
- no real DB connection.
- no global DB / pool / `pg` import.
- no repository promotion.
- no `psql`.
- no `npm run db:migrate`.
- no DDL / SQL execution.
- no Migration 025 dry-run or apply.
- no public API response body change.
- no `auditIntent` or `decisionAuditWriterResult` in public response bodies.
- no permission runtime expansion.
- no provider / LINE / SMS / App push / webhook / email runtime.
- no AI / RAG runtime.
- no billing / settlement runtime.
- no admin frontend.
- no package change.
- no smoke / integration test expansion.
- no secret/config/provider setting touched.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditAppServerShortcutClosure.static.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- tests/dataCorrection/dataCorrectionDecisionAuditAppServerShortcutClosure.static.test.js docs/task-894-data-correction-decision-audit-app-server-injected-writer-shortcut-closure-guard-no-real-db-no-api-shape-change.md src/app.js src/server.js
```

Results:

- PASS, 8 passed / 0 failed.
- PASS, 100 passed / 0 failed for the Task893 app/server option regression set.
- PASS, 869 passed / 0 failed for `tests/dataCorrection/*.js`.
- PASS for `npm run check`.
- PASS, 2749 passed / 0 failed for all `tests/**/*.js`.
- PASS for `git diff --check`.

## Future Authorization Still Required

Task894 does not authorize:

- default decision audit writer configuration.
- real DB-backed app/server writer setup.
- repository promotion into production request handling.
- Migration 025 dry-run or apply.
- API response shape changes.
- permission expansion.
- provider/LINE/SMS/App push/webhook/email sending.
- AI/RAG runtime.
- billing/settlement runtime.
- admin UI.
- package or smoke changes.
