# Task 1924 - SaaS Permission Contract Hardening

## Scope

Task1924 adds a pure SaaS permission contract for tenant/org/plan entitlement boundaries.

The contract verifies that organization isolation, user permission, and server-side entitlement remain separate required controls. It does not connect to a database, execute SQL, apply migrations, run seed, mount routes, start the runtime server, run SaaS/billing smoke, configure Zeabur, deploy, call providers, execute AI/RAG providers, create invoices, create payments, collect payment methods, mutate organization billing state in DB, or create customer-visible publication behavior.

## Files Changed

- `src/saas/saasPermissionContract.js`
- `tests/saas/saasPermissionContract.unit.test.js`
- `tests/saas/saasPermissionContract.static.test.js`
- `docs/task-1924-saas-permission-contract-hardening.md`

## Runtime Model

`src/saas/saasPermissionContract.js` exports:

- `SAAS_PERMISSION_CONTRACT_KIND`
- `REASON_CODES`
- `evaluateSaasPermissionContract`

The model evaluates only supplied in-memory input. It has no imports, no DB client, no repository, no route, no app/server import, no provider call, no billing provider call, and no environment variable access.

The input may represent:

- `organizationId`
- organization isolation context
- organization status
- actor metadata
- required permission
- permission context
- required entitlement
- entitlement context
- optional usage meter metadata
- `requestId`

## Contract Rules

The contract verifies:

- organization isolation is required before entitlement, usage, or trial checks.
- organization mismatch is denied.
- suspended/disabled organization status fails closed.
- permission checks cannot rely on frontend-only plan/entitlement flags.
- entitlement does not replace RBAC/admin permission.
- RBAC/admin permission does not replace entitlement.
- billing contact is not a permission actor.
- customer/reporter is not billing authority.
- usage meter cannot authorize features by itself.

## Fail-Closed Behavior

The contract denies or fails closed for:

- missing organization id: `saas_permission_organization_required`
- missing organization isolation context: `saas_permission_organization_isolation_required`
- organization mismatch: `saas_permission_organization_mismatch`
- inactive organization: `saas_permission_organization_inactive`
- missing permission context: `saas_permission_context_required`
- missing required permission: `saas_permission_missing`
- missing entitlement context: `saas_entitlement_context_required`
- missing required entitlement: `saas_entitlement_missing`
- frontend-only entitlement: `saas_entitlement_frontend_only_denied`
- billing contact actor: `saas_permission_billing_contact_actor_denied`
- customer/reporter trying to act as billing authority: `saas_permission_customer_reporter_billing_authority_denied`
- usage meter attempting to authorize by itself: `saas_permission_usage_meter_cannot_authorize`

Allowed results use:

- `saas_permission_contract_allowed`
- `source: server_policy`

## Boundary Separation

The contract keeps these concepts separate:

- organization isolation is not optional.
- permission is not entitlement.
- entitlement is not permission.
- usage meter is not authorization.
- billing contact is not permission actor.
- customer/reporter is not billing authority.
- SaaS permission contract is not invoice/payment/provider execution.

Output explicitly includes:

- `invoiceCreated: false`
- `paymentCreated: false`
- `paymentMethodCollected: false`
- `billingProviderCalled: false`

## Tests

`tests/saas/saasPermissionContract.unit.test.js` covers:

- permission and entitlement both required after organization isolation
- entitlement alone denied when permission is missing
- permission alone denied when entitlement is missing
- frontend-only entitlement denied
- billing contact cannot act as admin permission actor
- customer/reporter cannot act as billing authority
- organization mismatch denied
- missing organization isolation fails before entitlement or usage checks
- usage meter cannot authorize features by itself
- suspended/disabled organizations fail closed
- no invoice/payment/payment method/billing provider behavior

`tests/saas/saasPermissionContract.static.test.js` covers:

- expected Task1924 files exist
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

Stop after Task1924. Do not start Task1925 until PM explicitly accepts Task1923/Task1924 and authorizes the next batch.
