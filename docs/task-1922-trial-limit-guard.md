# Task 1922 - Trial Limit Guard

## Scope

Task1922 adds a pure Trial Limit Guard for Phase 12 SaaS / Entitlement / Billing MVP.

The guard evaluates trial state and limits using supplied server-side organization, entitlement, and usage inputs. It does not connect to a database, execute SQL, apply migrations, run seed, mount routes, start the runtime server, run SaaS/billing smoke, configure Zeabur, deploy, call providers, execute AI/RAG providers, create invoices, create payments, collect payment methods, mutate organization billing state in DB, or create customer-visible publication behavior.

## Files Changed

- `src/saas/trialLimitGuard.js`
- `tests/saas/trialLimitGuard.unit.test.js`
- `tests/saas/trialLimitGuard.static.test.js`
- `docs/task-1922-trial-limit-guard.md`

## Runtime Model

`src/saas/trialLimitGuard.js` exports:

- `TRIAL_LIMIT_GUARD_KIND`
- `REASON_CODES`
- `evaluateTrialLimitGuard`

The model evaluates only supplied in-memory input. It has no imports, no DB client, no repository, no route, no app/server import, no provider call, no billing provider call, and no environment variable access.

The input may represent:

- `organizationId`
- organization status
- trial state
- server-side entitlement context
- usage meter/input metadata
- trial limits
- optional `billingContactRef` metadata
- `requestId`

## Fail-Closed Behavior

The guard denies or fails closed for:

- missing organization id: `trial_limit_organization_required`
- missing trial state: `trial_limit_trial_state_required`
- ambiguous trial state: `trial_limit_trial_state_ambiguous`
- expired trial: `trial_limit_expired`
- disabled/suspended/inactive/past-due organization: `trial_limit_organization_inactive`
- missing required entitlement: `trial_limit_entitlement_missing`
- missing usage meter input for active trial: `trial_limit_usage_input_required`
- invalid usage meter input: `trial_limit_usage_input_invalid`
- missing server-side trial limit: `trial_limit_limit_required`
- usage over trial limit: `trial_limit_exceeded`
- frontend-only trial flags: `trial_limit_frontend_only_trial_flag_denied`

Allowed active trial results use:

- `trial_limit_allowed`
- `source: server_policy`

Paid non-trial plan results use:

- `trial_limit_not_applicable_paid_plan`
- `trialApplied: false`

This keeps paid plan access from being incorrectly treated as trial-limited access.

## Boundary Separation

The guard keeps these concepts separate:

- trial is not paid subscription.
- trial limit is not invoice.
- trial limit is not payment.
- trial limit does not collect a payment method.
- usage metering is not billing provider charge.
- billing contact metadata is not customer/reporter/on-site contact identity.
- platform SaaS trial control is not field-service customer billing or settlement.

Trial usage output explicitly includes:

- `internalTrialLimitOnly: true`
- `invoiceCreated: false`
- `paymentCreated: false`
- `paymentMethodCollected: false`
- `billingProviderCalled: false`

`billingContactRef` is returned only as sanitized metadata. Customer or reporter identity fields supplied inside the billing contact input are not copied to the output.

## Tests

`tests/saas/trialLimitGuard.unit.test.js` covers:

- active trial under limit allowed
- active trial over limit denied with review-required marker
- expired trial denied
- ambiguous trial denied
- disabled/suspended organization denied
- missing usage input denied
- missing entitlement denied
- frontend-only trial flag denied
- paid plan not incorrectly treated as trial
- billing contact metadata not becoming customer/reporter identity
- no invoice/payment/payment method/billing provider behavior

`tests/saas/trialLimitGuard.static.test.js` covers:

- expected Task1922 files exist
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

Stop after Task1922. Do not start Task1923 until PM explicitly accepts Task1921/Task1922 and authorizes the next batch.
