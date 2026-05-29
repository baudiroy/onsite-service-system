# Task 1925 - SaaS Audit Log Boundary

## Scope

Task1925 adds a pure SaaS Audit Log Boundary for entitlement, trial, usage, permission, and billing-contact decisions.

The boundary builds internal-only sanitized audit metadata and can write through an injected synthetic audit writer. It does not connect to a database, execute SQL, apply migrations, run seed, mount routes, start the runtime server, run SaaS/admin/billing smoke, probe Zeabur, configure Zeabur, deploy, call providers, execute AI/RAG providers, create invoices, create payments, collect payment methods, mutate organization billing state in DB, or create customer-visible publication behavior.

## Files Changed

- `src/saas/saasAuditBoundary.js`
- `tests/saas/saasAuditBoundary.unit.test.js`
- `tests/saas/saasAuditBoundary.static.test.js`
- `docs/task-1925-saas-audit-log-boundary.md`

## Runtime Model

`src/saas/saasAuditBoundary.js` exports:

- `SAAS_AUDIT_BOUNDARY_KIND`
- `REASON_CODES`
- `buildSaasAuditEvent`
- `writeSaasAuditEvent`

The model evaluates only supplied in-memory input. It has no DB client, no repository, no route, no app/server import, no provider call, no billing provider call, and no environment variable access.

`writeSaasAuditEvent` accepts an injected `auditWriter` with `write(event)` or `record(event)`. The tests use synthetic writers only.

## Safe Audit Metadata

Audit payload may include only safe metadata:

- action type
- organization id
- normalized actor id
- request id
- entitlement decision reason/status
- safe plan code/tier/status
- usage metric/reason/count/limit metadata
- trial status/reason metadata
- permission status/reason metadata
- sanitized `billingContactRef`
- occurred-at timestamp

Audit payload is always:

- `visibility: internal_only`
- `customerVisible: false`

## Forbidden Audit Payload Data

Audit payload must not include:

- raw DB rows
- raw phone/address
- provider payloads or tokens
- database URLs, JWT values, secrets, passwords, private keys, or provider keys
- stack traces
- SQL text
- payment method data
- invoice details
- billing provider output
- AI output
- customer-visible report data
- Completion Report / Field Service Report internals
- finalAppointmentId

## Failure Behavior

Writer failures return sanitized failure envelopes:

- `saas_audit_writer_failed`
- `writerFailureSanitized: true`

Raw writer error messages, stacks, SQL text, tokens, secrets, provider payloads, and database URLs are not exposed.

## Boundary Separation

The boundary keeps these concepts separate:

- audit event is not customer-visible publication.
- audit write is not invoice.
- audit write is not payment.
- audit write does not collect payment method.
- audit write does not call billing provider.
- audit write does not mutate organization billing state.
- audit write does not provider-send.
- audit write does not create or mutate Completion Report / Field Service Report.

Output explicitly includes:

- `customerVisible: false`
- `invoiceCreated: false`
- `paymentCreated: false`
- `paymentMethodCollected: false`
- `billingProviderCalled: false`
- `organizationBillingStateMutated: false`
- `providerSendTriggered: false`

## Tests

`tests/saas/saasAuditBoundary.unit.test.js` covers:

- audit event build entitlement allow path
- synthetic audit writer write path
- denied/limit-exceeded audit metadata
- audit writer failure sanitization
- audit not customer-visible
- forbidden fields excluded
- no invoice/payment/payment method/billing provider behavior
- no organization billing DB mutation
- no provider sending

`tests/saas/saasAuditBoundary.static.test.js` covers:

- expected Task1925 files exist
- no DB, route, runtime, migration, provider, secret, billing provider, invoice/payment, AI/RAG, Completion Report / FSR, finalAppointmentId, or customer-visible publication imports/execution markers
- internal-only and non-execution markers remain present
- task documentation records the intended safety boundaries

## Explicit Non-goals

- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No route mount.
- No runtime server start.
- No SaaS/admin/billing smoke.
- No Zeabur env change.
- No deploy.
- No billing provider.
- No invoice.
- No payment.
- No payment method collection.
- No organization billing DB mutation.
- No provider sending.
- No AI/RAG provider execution.
- No package or lockfile change.
- No admin frontend change.
- No Completion Report / Field Service Report behavior.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Next Task Recommendation

After Task1925 acceptance, continue to Task1926 SaaS Admin Runtime Smoke Readiness. Task1926 remains readiness-only and must not run smoke or probe Zeabur public endpoints.
