# Task1892 Repair Intake Reporter / Customer / Billing Contact DTO Guard

Status: implemented and verified with synthetic tests only.

Scope:
- Add a Repair Intake contact-role DTO guard.
- Preserve reporter, customer, billing contact, and on-site contact override as distinct DTO fields.
- Harden the existing draft-to-Case candidate builder to use the guard.

## Implementation Summary

- Added `src/repairIntake/repairIntakeContactRoleDtoGuard.js`.
- Hardened `src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js`.
- The guard normalizes:
  - `reporterRef`
  - `customerRef`
  - `billingContactRef`
  - `onSiteContactOverrideRef`
- The guard supports same-person multi-role cases by keeping one explicit DTO per role.
- If an input role/type conflicts with the target field, the output role/type is normalized to the target role.
- Raw `phone`, `address`, raw rows, provider payloads, tokens, and secrets are excluded.
- Already-normalized safe contact summaries can pass through as `safeContactSummary`.

## Role Separation Rules

- Reporter is not treated as customer.
- Customer is not treated as reporter.
- Billing contact is not treated as customer.
- On-site contact override is not treated as customer or billing contact.
- Missing role refs remain `null`; no role borrows another role's ref.
- Same underlying person/reference can appear in multiple role fields, but each field stays explicitly role-scoped.

## Explicit Non-goals

- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No route.
- No route mount.
- No smoke.
- No deploy.
- No Zeabur env changes.
- No provider sending.
- No AI/RAG execution.
- No billing execution.
- No contact mutation.
- No customer mutation.
- No billing record mutation.
- No appointment mutation.
- No formal Case creation.
- No draft-to-formal-Case linking.
- No Completion Report / Field Service Report mutation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Verification Summary

- Added synthetic guard tests for:
  - all role refs distinct and preserved;
  - missing role safe handling;
  - same person in multiple roles without role conflation;
  - raw phone/address exclusion with safe contact summary preservation;
  - billing/reporter/on-site override not treated as customer.
- Added candidate builder tests for:
  - on-site contact override preserved separately;
  - role mismatch normalization;
  - safe contact summary preservation;
  - raw contact payload stripping.
- Added static Task1892 boundary coverage for:
  - no DB/migration/seed/smoke/deploy behavior;
  - no route/provider/AI/billing execution;
  - no formal Case creation/linking;
  - no contact/customer/billing/appointment mutation;
  - no Completion Report / Field Service Report mutation;
  - no finalAppointmentId mutation.
