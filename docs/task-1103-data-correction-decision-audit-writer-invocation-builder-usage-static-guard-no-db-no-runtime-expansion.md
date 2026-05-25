# Task1103 - Data Correction Decision Audit Writer Invocation Builder Usage Static Guard / No DB No Runtime Expansion

## Status

Completed locally. Not staged.

## Purpose

Add a static regression guard proving Data Correction decision audit writer invocation paths use the sanitized input builder before audit writer invocation.

This task does not modify production source and does not expand runtime behavior.

## Implemented Files

- `tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationBuilderUsage.static.test.js`
- `docs/task-1103-data-correction-decision-audit-writer-invocation-builder-usage-static-guard-no-db-no-runtime-expansion.md`

## Inspected Source Paths

The new static guard inspects:

- `src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js`
- `src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js`
- `src/dataCorrection/dataCorrectionRequestService.js`
- `src/dataCorrection/preDepartureCorrectionApplicationService.js`

## Static Guard Coverage

The new static guard checks:

- invocation helper imports `buildDataCorrectionDecisionAuditWriterInput`;
- invocation helper imports only the input builder and result normalizer;
- `writerInput` is built through `buildDataCorrectionDecisionAuditWriterInput(auditIntent)`;
- sync writer receives `write(writerInput)`;
- async writer receives `await write(writerInput)`;
- builder usage appears before sync and async writer invocation;
- writer is not called directly with `auditIntent`, `input`, `request`, `payload`, `context`, or raw values;
- request/apply services delegate decision audit writer calls through `callInjectedDecisionAuditWriter*`;
- request/apply services do not directly call `options.decisionAuditWriter` or `options.decisionAuditWriter.write`;
- invocation helper does not directly construct unsafe writer input fields;
- invocation path has no DB, repository, route, controller, app, server, provider, network, AI/RAG, billing, invoice, or payment coupling;
- existing regression tests still document Task1102 sanitization, input builder, closure, and invocation behavior.

## Raw Direct Writer Input Guard

The guard blocks patterns where decision audit writer invocation would directly pass:

- `auditIntent`
- `input`
- `request`
- `payload`
- `context`
- raw values

The current accepted path remains:

```js
const writerInput = buildDataCorrectionDecisionAuditWriterInput(auditIntent);
const result = write(writerInput);
```

and the async equivalent:

```js
const writerInput = buildDataCorrectionDecisionAuditWriterInput(auditIntent);
const result = await write(writerInput);
```

## Sensitive / Runtime Field Construction Guard

The guard verifies the invocation helper does not directly construct writer input fields such as:

- `raw`
- `rawRequest`
- `rawInput`
- `rawPayload`
- `rawRows`
- `sql`
- `query`
- `paramsSql`
- `db`
- `databaseUrl`
- `DATABASE_URL`
- `authorization`
- `cookie`
- `headers`
- `phone`
- `address`
- `customerPhone`
- `customerName`
- `lineUserId`
- `lineAccessToken`
- `finalAppointmentId`
- `stack`
- `repository`
- `connection`

The source currently uses the input builder seam instead of constructing these fields in the invocation helper.

## Boundaries Held

- No production source files modified.
- No existing tests modified.
- No migrations.
- No admin changes.
- No package changes.
- No DB, SQL, migration, psql, or db:migrate.
- No repository writer or repository imports.
- No API shape or OpenAPI expansion.
- No provider sending.
- No LINE, SMS, App, email, or webhook work.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No shared runtime or listen startup.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationBuilderUsage.static.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderSanitizationBoundary.static.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
