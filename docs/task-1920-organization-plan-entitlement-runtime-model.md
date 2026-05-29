# Task 1920 - Organization Plan Entitlement Runtime Model

## Scope

Task1920 adds a pure organization entitlement runtime model for Phase 12 SaaS / Entitlement / Billing MVP.

This task does not mount routes, connect to a database, execute SQL, apply migrations, run seed, start the runtime server, configure Zeabur, deploy, run SaaS/billing smoke, call providers, execute AI/RAG, create invoices, create payments, collect payment methods, mutate organization billing records in DB, or create customer-visible publication behavior.

## Files Changed

- `src/saas/organizationEntitlementModel.js`
- `tests/saas/organizationEntitlementModel.unit.test.js`
- `tests/saas/organizationEntitlementModel.static.test.js`
- `docs/task-1920-organization-plan-entitlement-runtime-model.md`

## Runtime Model

`src/saas/organizationEntitlementModel.js` exports:

- `ORGANIZATION_ENTITLEMENT_MODEL_KIND`
- `PLAN_CATALOG`
- `REASON_CODES`
- `evaluateOrganizationEntitlement`

The model evaluates only supplied in-memory input. It has no imports, no DB client, no repository, no route, no app/server import, no provider call, and no environment variable access.

The input may represent:

- `organizationId`
- `planCode` / plan tier through the plan catalog
- effective organization/subscription status
- trial state
- required entitlement key
- entitlement flags / enabled entitlement list
- limits metadata
- optional `billingContactRef` metadata
- optional usage meter metadata
- `requestId`

## Fail-Closed Behavior

The model denies access for:

- missing organization id: `organization_id_required`
- missing plan: `organization_plan_required`
- unknown plan: `organization_plan_unknown`
- missing effective status: `organization_plan_status_required`
- disabled/suspended/expired/cancelled/inactive/past-due status: `organization_plan_inactive`
- ambiguous trial state: `organization_trial_ambiguous`
- expired trial: `organization_trial_expired`
- frontend-only entitlement signal: `organization_entitlement_frontend_only_denied`
- missing required entitlement: `organization_entitlement_missing`

Allowed results use:

- `organization_entitlement_allowed`
- `source: server_policy`

## Boundary Separation

The model keeps these concepts separate:

- organization isolation is the SaaS tenant boundary.
- plan entitlement is not user permission.
- user permission is not plan entitlement.
- trial is not paid subscription.
- usage meter metadata is not invoice.
- billing contact metadata is not customer/reporter/on-site contact.
- service-case billing is not platform SaaS subscription billing.

`billingContactRef` is returned only as sanitized metadata. Customer or reporter identity fields supplied inside the billing contact input are not copied to the output.

Usage meter metadata can report a `usageKey` and quantity, but the output explicitly keeps:

- `invoiceCreated: false`
- `paymentCreated: false`

## Tests

`tests/saas/organizationEntitlementModel.unit.test.js` covers:

- allowed paid plan entitlement path
- active trial allowed path
- expired trial denied path
- ambiguous trial denied path
- disabled/suspended denied path
- missing organization denied path
- unknown plan denied path
- missing entitlement denied path
- frontend-only entitlement signal denied path
- billing contact metadata not becoming customer/reporter identity
- usage meter metadata not becoming invoice/payment behavior

`tests/saas/organizationEntitlementModel.static.test.js` covers:

- expected Task1920 files exist
- no DB, route, runtime, migration, provider, secret, billing provider, invoice/payment, AI/RAG, Completion Report / FSR, finalAppointmentId, or customer-visible publication imports/execution markers
- fail-closed reason codes remain present
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
- No `finalAppointmentId` mutation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Next Task Recommendation

After PM acceptance and GitHub sync, the next scoped task should be Task1921 usage metering boundary, still without billing provider, invoice, payment, migration execution, Zeabur deploy, provider sending, or smoke execution unless separately approved.
