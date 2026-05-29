# Task 1923 - Billing Contact Separation Guard

## Scope

Task1923 adds a pure Billing Contact Separation Guard for Phase 12 SaaS / Entitlement / Billing MVP.

The guard preserves `billing_contact` separation from customer, reporter, on-site contact, admin actor, organization owner, entitlement owner, login identity, and payment authority. It does not connect to a database, execute SQL, apply migrations, run seed, mount routes, start the runtime server, run SaaS/billing smoke, configure Zeabur, deploy, call providers, execute AI/RAG providers, create invoices, create payments, collect payment methods, mutate organization billing state in DB, or create customer-visible publication behavior.

## Files Changed

- `src/saas/billingContactSeparationGuard.js`
- `tests/saas/billingContactSeparationGuard.unit.test.js`
- `tests/saas/billingContactSeparationGuard.static.test.js`
- `docs/task-1923-billing-contact-separation-guard.md`

## Runtime Model

`src/saas/billingContactSeparationGuard.js` exports:

- `BILLING_CONTACT_SEPARATION_GUARD_KIND`
- `REASON_CODES`
- `evaluateBillingContactSeparationGuard`

The model evaluates only supplied in-memory input. It has no imports, no DB client, no repository, no route, no app/server import, no provider call, no billing provider call, and no environment variable access.

The input may represent:

- `organizationId`
- `billingContactRef`
- related role references for customer, reporter, on-site contact, admin actor, and organization owner
- verification and consent markers
- normalized safe contact summary
- `requestId`

## Allowed Billing Contact Use

Billing contact may be used only as:

- billing metadata,
- safe notification recipient metadata,
- a separate role reference for billing communication.

Billing contact must not become:

- login identity,
- customer identity,
- reporter identity,
- on-site contact identity,
- admin actor,
- organization owner,
- entitlement owner,
- payment authority.

The same person may be represented in multiple roles, but the roles must remain distinct and must not be conflated.

## Fail-Closed Behavior

The guard denies or fails closed for:

- missing organization id: `billing_contact_organization_required`
- missing billing contact context: `billing_contact_context_required`
- unsupported billing contact type: `billing_contact_type_unsupported`
- frontend-only billing contact claim: `billing_contact_frontend_only_claim_denied`
- role conflation: `billing_contact_role_conflation_denied`
- raw unverified contact payload without normalized safe summary: `billing_contact_raw_unverified_payload_denied`
- missing consent marker: `billing_contact_consent_required`
- missing verification marker: `billing_contact_verification_required`

Allowed results use:

- `billing_contact_separation_allowed`
- `use: billing_metadata_only`

## Boundary Separation

The guard keeps these concepts separate:

- billing contact is not customer.
- billing contact is not reporter.
- billing contact is not on-site contact.
- billing contact is not admin actor.
- billing contact is not organization owner.
- billing contact is not entitlement owner.
- billing contact is not payment authority.
- billing contact is not login identity.

Output explicitly includes:

- `invoiceCreated: false`
- `paymentCreated: false`
- `paymentMethodCollected: false`
- `billingProviderCalled: false`
- `loginIdentityCreated: false`
- `customerIdentityAssigned: false`
- `reporterIdentityAssigned: false`
- `entitlementOwnerAssigned: false`

Raw phone, raw address, provider payloads, tokens, secrets, raw DB rows, payment method data, invoice data, and billing provider output are not copied to the output. Only normalized safe summary fields such as masked phone/address may be returned.

## Tests

`tests/saas/billingContactSeparationGuard.unit.test.js` covers:

- billing contact distinct from customer/reporter/on-site/admin/owner
- same person represented in multiple roles without role conflation
- missing billing contact denied
- unsupported billing contact type denied
- frontend-only billing contact claim denied
- role conflation denied
- raw phone/address/provider payload excluded when normalized safe summary exists
- raw unverified contact payload denied when safe summary is missing
- missing consent denied
- missing verification denied
- no invoice/payment/payment method/billing provider behavior

`tests/saas/billingContactSeparationGuard.static.test.js` covers:

- expected Task1923 files exist
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

After Task1923 acceptance, continue to Task1924 SaaS Permission Contract Hardening. Do not start Task1925 until PM explicitly accepts Task1924 and authorizes the next batch.
