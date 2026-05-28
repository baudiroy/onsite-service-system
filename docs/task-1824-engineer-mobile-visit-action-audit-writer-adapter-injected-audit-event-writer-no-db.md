# Task1824 Engineer Mobile Visit Action Audit Writer Adapter Injected Audit Event Writer No DB

## Scope

Task1824 adds a pure injected audit writer adapter for the Engineer Mobile Visit Action flow.

Pipeline boundary:

```text
auditIntent -> audit event builder -> injected auditEventWriter.record(auditEventEnvelope)
```

This task prepares the future audit persistence boundary without implementing persistence. It does not write audit logs to DB, does not create a repository, and does not wire a route, controller, provider, or global mount.

## Files

- `src/engineerMobile/engineerMobileVisitActionAuditWriterAdapter.js`
- `tests/engineerMobile/engineerMobileVisitActionAuditWriterAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionAuditWriterAdapterBoundary.static.test.js`
- `docs/task-1824-engineer-mobile-visit-action-audit-writer-adapter-injected-audit-event-writer-no-db.md`

The 7 held historical untracked docs remain untouched.

## Runtime Shape

The adapter exports:

- `createEngineerMobileVisitActionAuditWriterAdapter`
- `ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND`

The factory accepts:

- `auditEventWriter`
- `now`

The returned adapter exposes:

- `record(auditIntent)`

The module imports only the accepted Task1822 audit event builder.

## Behavior

The adapter validates the injected `auditEventWriter.record` function before building an event. If it is missing, the adapter returns the stable sanitized failure reason `audit_event_writer_required`.

When a writer exists, the adapter builds a safe audit event envelope using `buildEngineerMobileVisitActionAuditEvent({ auditIntent, now })`.

If the builder denies or fails, the adapter returns a sanitized failure preserving the builder `reasonCode` and does not call the injected writer.

If the builder succeeds, the adapter calls `auditEventWriter.record(auditEventEnvelope)` exactly once with a copied sanitized envelope.

Writer success is limited to explicit safe success variants:

- `undefined`
- `null`
- `true`
- `{ ok: true }`
- `{ accepted: true }`
- `{ recorded: true }`
- `{ persisted: true }`

Writer failure variants return `audit_event_write_failed`, including:

- `false`
- `{ ok: false }`
- `{ accepted: false }`
- `{ recorded: false }`
- `{ persisted: false }`
- `{ error: ... }`
- unknown object shapes
- thrown errors

The adapter never exposes raw writer output, thrown error details, stack traces, SQL, DB metadata, provider payloads, customer data, report draft fields, customer-visible publication fields, Completion Report fields, Field Service Report fields, or final appointment mutation fields.

## Boundary

- No DB
- No migration
- No global mount
- No route registration
- No Express import
- No repository import
- Injected audit event writer only
- No real audit persistence implementation
- No provider sending
- No completion report creation
- No completion report approval
- No completion report publication
- No finalAppointmentId mutation
- No customer-visible publication

## Verification

Planned verification:

```bash
node --test tests/engineerMobile/engineerMobileVisitActionAuditWriterAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionAuditWriterAdapterBoundary.static.test.js
npm run check
```

Also run a precise credential/sensitive scan limited to the four Task1824 files. Boundary-test and doc literals may be reported as intentional false positives only if refined connection-string, token-shaped, and credential-assignment scans are clean.
