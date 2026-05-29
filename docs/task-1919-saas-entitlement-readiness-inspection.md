# Task 1919 - SaaS Entitlement Readiness Inspection

## Scope

Task1919 is an inspection-only checkpoint for the Phase 12 SaaS / Entitlement / Billing MVP branch.

No runtime source, route, database, migration, billing provider, invoice, payment, smoke, deploy, Zeabur, provider, AI/RAG, Completion Report, Field Service Report, or customer-visible publication behavior is changed by this task.

## Baseline

- Current synchronized baseline before this task: `f8dce110812a516b59cbc5db1fb879e1aec77b3b`.
- Branch: `main`.
- Upstream: `origin/main`.
- Held historical untracked docs remain out of scope.

## Files And Evidence Inspected

- `docs/planning/future-task-master-roadmap-1877-2000/task-1919-saas-entitlement-readiness-inspection.md`
- `docs/planning/future-task-master-roadmap-1877-2000/task-1920-organization-plan-entitlement-runtime-model.md`
- `docs/planning/future-task-master-roadmap-1877-2000/phase-12-tasks-1919-1928-phase-12-saas-entitlement-and-billing-mvp.md`
- `docs/design/saas-plan-entitlement-and-add-ons.md`
- `docs/design/saas-trial-usage-billing.md`
- `docs/task-282-saas-plan-entitlement-usage-boundary-branch-kickoff-no-runtime-change.md`
- `docs/task-288-saas-plan-entitlement-usage-branch-readiness-gate-review-no-runtime-change.md`
- `docs/task-330-repair-intake-reporter-customer-billing-contact-boundary-matrix-no-runtime-change.md`
- `src/services/OrganizationAccessService.js`
- `src/middlewares/requireOrganizationAccess.js`
- `src/services/PermissionService.js`
- `src/middlewares/requirePermission.js`
- `src/routes/organizations.routes.js`
- `src/repositories/OrganizationRepository.js`
- `src/routes/billing.routes.js`
- `src/controllers/BillingController.js`
- `src/services/BillingService.js`
- `src/repositories/BillingRepository.js`
- `package.json`

## Existing Readiness Findings

### Organization isolation

Organization isolation is already the strongest runtime SaaS boundary.

Existing runtime evidence:

- `OrganizationAccessService.assertAccess` validates actor access to an organization id.
- `OrganizationAccessService.buildScopedFilter` scopes non-admin users to their organization ids.
- `requireOrganizationAccess` derives organization context from request params/body/query and fails through the existing error path.
- Existing organization routes require `organizations.read` / `organizations.manage`.

Gap:

- There is no dedicated SaaS entitlement model yet.
- Organization access and user permission do not currently evaluate plan, trial, entitlement, or usage state.

### Permission separation

Existing runtime evidence:

- `requirePermission` enforces user permission keys from `req.user.permissions`.
- `PermissionService` reads role permissions through repositories.

Readiness:

- Permission runtime already treats permission as user action authorization.
- This matches the SaaS design principle that entitlement and permission must remain separate checks.

Gap:

- Future entitlement checks must not replace `requirePermission`.
- Future permission checks must not imply plan entitlement.

### SaaS docs and design direction

Existing docs already define the correct concept boundaries:

- Plan is not subscription.
- Subscription is not entitlement.
- Entitlement is not permission.
- Permission is not data visibility.
- Usage tracking is not invoice.
- Billing contact is not customer/reporter.
- Trial is not paid subscription.
- Feature flag is not formal authorization.
- AI add-on is not permission bypass.

Readiness:

- The documentation base is strong enough to start a small pure runtime model in Task1920.

Gap:

- The docs are future design only and do not yet provide a reusable runtime policy function.

### Billing and settlement runtime

Existing runtime evidence:

- `BillingService` manages service-case billing records and settlements.
- `BillingController` and `billing.routes` expose service billing endpoints behind `billing.manage`.
- `BillingRepository` persists service billing records.

Readiness:

- Existing billing code is field-service / case billing, not platform SaaS subscription billing.

Important boundary:

- Phase 12 must not use existing service billing as a SaaS invoice/payment system.
- Platform SaaS entitlement must not create customer repair invoices, payments, settlements, or payment methods.

### Billing contact separation

Existing docs define a clear boundary:

- `billing_contact` is the billing/invoice/payment communication contact.
- `billing_contact` may differ from customer, reporter, and on-site contact.
- `billing_contact` must not automatically become customer.

Gap:

- Runtime model should preserve billing contact only as metadata until a later guard task.
- Task1920 should not create or mutate any customer/reporter/billing-contact relationship.

### Usage metering

Existing docs distinguish usage tracking from:

- authorization,
- audit log,
- invoice,
- payment,
- customer charge,
- provider sending.

Gap:

- No runtime usage meter is implemented yet.
- Task1920 should leave usage metering as a later boundary and must not produce invoice/payment behavior.

### Audit patterns

Existing service modules use audit services for state-changing workflows.

Readiness:

- Later Phase 12 tasks can add audit boundary tests for entitlement/trial/usage decisions.

Gap:

- Task1920 should stay pure and not write audit logs.
- Task1925 is the later audit boundary task.

## Core Invariants Confirmed

- Organization isolation is the SaaS tenant boundary.
- Entitlement cannot be frontend-only.
- Trial and plan limits must be enforced server-side when implemented.
- `billing_contact` is not customer/reporter/on-site contact.
- Usage metering is not invoice.
- Existing field-service billing is not platform SaaS subscription billing.
- Invoice/payment provider execution is not in this branch until explicitly scoped.
- Provider keys and secrets must not be printed.
- Customer-visible publication behavior is not part of this branch.
- Completion Report / Field Service Report creation, approval, revocation, publication, and mutation are not part of this branch.
- `finalAppointmentId` mutation is not part of this branch.
- AI/RAG provider execution is not part of this branch.

## Safest Next Implementation Target

Task1920 should add a pure organization entitlement model, not route wiring.

Recommended smallest target:

- a pure runtime module under `src/saas/`
- synthetic unit tests under `tests/saas/`
- no DB client,
- no repository,
- no route mount,
- no app/server import,
- no billing provider,
- no invoice/payment creation,
- no usage meter persistence,
- no mutation of organization records.

The model should evaluate:

- `organizationId`
- `planCode` / `planTier`
- trial state
- effective status
- entitlement flags
- limits metadata
- optional `billingContactRef` metadata
- optional usage meter metadata
- required entitlement key

The model should fail closed for:

- missing organization,
- unknown plan,
- expired/disabled/suspended status,
- ambiguous trial state,
- missing required entitlement,
- frontend-only entitlement signal.

## Testing Recommendation For Task1920

Add synthetic tests only:

- allowed paid plan entitlement path,
- trial allowed path,
- trial expired denied path,
- disabled/suspended denied path,
- unknown plan denied path,
- missing organization denied path,
- missing entitlement denied path,
- frontend-only entitlement signal denied path,
- billing contact metadata does not become customer/reporter,
- usage metering metadata does not create invoice/payment behavior,
- static boundary test confirms no DB, route, app/server, migration, provider, billing provider, invoice, payment, AI/RAG, or secret access.

Run:

- `node --test tests/saas/organizationEntitlementModel.unit.test.js tests/saas/organizationEntitlementModel.static.test.js`
- relevant security/permission tests when available,
- `npm run check` or the package-equivalent syntax check.

## Non-goals Preserved

- No DB connection.
- No SQL execution.
- No migration or seed.
- No Zeabur configuration or deploy.
- No SaaS/billing smoke.
- No billing provider call.
- No invoice, payment, payment method, subscription provider, or checkout behavior.
- No LINE/SMS/Email/App/Webhook provider sending.
- No AI/RAG provider call.
- No secrets read or printed.
- No admin frontend change.
- No package or lockfile change.
- No customer-visible publication behavior.
- No Completion Report / Field Service Report behavior.
- No `finalAppointmentId` mutation.
