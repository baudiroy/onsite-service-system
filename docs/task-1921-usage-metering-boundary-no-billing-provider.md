# Task 1921 - Usage Metering Boundary / No Billing Provider

## Scope

Task1921 adds a pure usage metering boundary for Phase 12 SaaS / Entitlement / Billing MVP.

The boundary represents measured usage as internal accounting metadata only. It does not create an invoice, create a payment, request or collect a payment method, call a billing provider, connect to a database, execute SQL, apply migrations, start the runtime server, mount routes, run SaaS/billing smoke, configure Zeabur, deploy, provider-send, or execute AI/RAG providers.

## Files Changed

- `src/saas/usageMeteringBoundary.js`
- `tests/saas/usageMeteringBoundary.unit.test.js`
- `tests/saas/usageMeteringBoundary.static.test.js`
- `docs/task-1921-usage-metering-boundary-no-billing-provider.md`

## Runtime Model

`src/saas/usageMeteringBoundary.js` exports:

- `USAGE_METERING_BOUNDARY_KIND`
- `USAGE_METRICS`
- `REASON_CODES`
- `evaluateUsageMeteringBoundary`

The model evaluates only supplied in-memory input. It has no imports, no DB client, no repository, no route, no app/server import, no provider call, no billing provider call, and no environment variable access.

The input may represent:

- `organizationId`
- `metricKey`
- usage quantity
- current usage count
- server-side entitlement context
- optional usage limits
- optional `billingContactRef` metadata
- `requestId`

## Supported Synthetic Metrics

The initial metric catalog supports safe synthetic counters:

- `cases.count`
- `appointments.count`
- `engineer_mobile.actions.count`
- `customer_report.views.count`
- `repair_intake.drafts.count`
- `storage.attachments.units`

These are internal usage counters only. They are not invoice lines, payment requests, customer repair charges, service billing records, settlements, or billing provider events.

## Fail-Closed Behavior

The boundary denies usage metering for:

- missing organization id: `usage_metering_organization_required`
- missing metric key: `usage_metering_metric_required`
- unknown metric key: `usage_metering_metric_unknown`
- negative or non-integer count usage: `usage_metering_quantity_invalid`
- frontend-only usage claim: `usage_metering_frontend_only_claim_denied`
- missing server-side entitlement context: `usage_metering_entitlement_context_required`
- missing required entitlement: `usage_metering_entitlement_missing`
- usage above a server-side limit: `usage_metering_limit_exceeded`

Accepted results use:

- `usage_metering_event_accepted`
- `source: server_policy`

## Boundary Separation

The boundary keeps these concepts separate:

- usage event is not invoice.
- usage event is not payment.
- usage event does not collect a payment method.
- usage counter is not billing contact.
- entitlement limit is not billing provider plan.
- billing contact metadata is not customer/reporter/on-site contact identity.
- platform SaaS usage metering is not field-service customer billing or settlement.

Accepted usage output explicitly includes:

- `internalAccountingOnly: true`
- `invoiceCreated: false`
- `paymentCreated: false`
- `paymentMethodCollected: false`
- `billingProviderCalled: false`

`billingContactRef` is returned only as sanitized metadata. Customer or reporter identity fields supplied inside the billing contact input are not copied to the output.

## Tests

`tests/saas/usageMeteringBoundary.unit.test.js` covers:

- accepted synthetic usage event
- unknown metric denied
- negative usage denied
- non-integer usage denied
- frontend-only usage claim denied
- missing entitlement context denied
- missing required entitlement denied
- usage above server-side limit denied
- usage meter not invoice/payment/payment method/billing provider
- billing contact metadata not becoming customer/reporter identity

`tests/saas/usageMeteringBoundary.static.test.js` covers:

- expected Task1921 files exist
- no DB, route, runtime, migration, provider, secret, billing provider, invoice/payment, AI/RAG, Completion Report / FSR, finalAppointmentId, or customer-visible publication imports/execution markers
- fail-closed reason codes and non-billing output markers remain present
- task documentation records the intended safety boundaries

## Explicit Non-goals

- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No route mount.
- No runtime server start.
- No SaaS/billing smoke.
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

After Task1921 acceptance, continue to Task1922 Trial Limit Guard. Do not start Task1923 until PM explicitly accepts Task1922 and authorizes the next batch.
