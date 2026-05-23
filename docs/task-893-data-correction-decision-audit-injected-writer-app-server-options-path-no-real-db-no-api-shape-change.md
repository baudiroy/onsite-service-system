# Task 893 - Data Correction Decision Audit Injected Writer App/Server Options Path

Status: completed

## Goal

Extend and verify the existing Data Correction app/server shortcut options path so an optional injected `decisionAuditWriter` can be passed into request/apply services.

This remains opt-in only. It does not configure a default writer, does not connect a real DB, does not change public API shape, and does not change correction behavior.

## Modified Files

- `src/app.js`
- `src/server.js`
- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditRuntimeAdjacentWriterBranchClosure.static.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditWriterClosure.static.test.js`
- `docs/task-893-data-correction-decision-audit-injected-writer-app-server-options-path-no-real-db-no-api-shape-change.md`

## Runtime Change

The only runtime-adjacent change is adding the shortcut option key:

- `dataCorrectionDecisionAuditWriter`

to the existing Data Correction app/server option maps.

When explicitly supplied, the option is forwarded as:

- `dataCorrection.decisionAuditWriter`

The default app/server path still does not configure a writer.

## Safety Boundaries

Task893 preserves:

- no default `decisionAuditWriter`.
- no global DB / pool / `pg` import.
- no real repository / audit sink wiring.
- no Migration 025 dry-run or apply.
- no DB / `psql` / `npm run db:migrate` / DDL / SQL execution.
- no public API response shape change.
- no `auditIntent` or `decisionAuditWriterResult` in public/default response bodies.
- no correction outcome change from decision audit writer success/failure.
- no provider / LINE / SMS / App push / webhook / email runtime.
- no AI / RAG runtime.
- no billing / settlement runtime.
- no admin frontend.
- no package change.
- no smoke / integration test.
- no secrets/config touched.

## Coverage

The new unit test verifies:

- app/server immutable shortcut option maps include `dataCorrectionDecisionAuditWriter`.
- default app behavior keeps public response shape unchanged.
- `createApp` can explicitly pass an injected decision audit writer.
- `createServerBootstrap` can explicitly pass an injected decision audit writer.
- injected fake writer receives only safe Task869/870 metadata.
- writer success does not expand public response bodies.
- writer failure remains safe and does not change official request/apply outcome.
- app/server option path does not import decision audit repository/writer modules or DB runtime modules.

Existing app/server option tests were updated only to include the new immutable shortcut key.

Existing Task885/Task889 closure guards were adjusted only to recognize the new Task893
boundary: app/server may expose the injected shortcut option key, while API routes,
controllers, orchestrators, services, real repository promotion, default writer setup,
and DB-backed writer factories remain forbidden.

## Runtime Decision

Task893 is a bounded runtime-adjacent option plumbing slice.

It does not authorize future:

- real DB repository adapter.
- default audit writer configuration.
- service/app/API persistence promotion.
- public API response body changes.
- Migration 025 dry-run or apply.
- permission expansion.
- provider/LINE/SMS/App push/webhook/email runtime.
- AI/RAG runtime.
- billing/settlement runtime.
- admin frontend.
- package changes.
- smoke/integration expansion.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/dataCorrection tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-893-data-correction-decision-audit-injected-writer-app-server-options-path-no-real-db-no-api-shape-change.md
git diff --check -- src/app.js src/server.js tests/dataCorrection/dataCorrectionDecisionAuditWriterClosure.static.test.js tests/dataCorrection/dataCorrectionDecisionAuditRuntimeAdjacentWriterBranchClosure.static.test.js
```

Results:

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`: PASS, 100 passed / 0 failed.
- `node --test tests/dataCorrection/*.js`: PASS, 861 passed / 0 failed.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS.
- `git diff --check -- ...`: PASS.
- Extra `git diff --check` for `src/app.js`, `src/server.js`, and closure guard alignment tests: PASS.
