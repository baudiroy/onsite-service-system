# Task1889 Repair Intake Draft-to-Case Service Runtime Wiring / No Route

Status: implemented and verified with synthetic tests only.

Scope:
- Harden the existing Repair Intake draft-to-Case planning service boundary.
- Keep the service internal and unmounted.
- Keep the service injected dependency only.
- Prepare sanitized draft-to-Case intent envelopes without creating or linking a formal Case.

## Implementation Summary

- Hardened `src/repairIntake/repairIntakeDraftCasePlanningService.js`.
- Added fail-closed organization scope mismatch handling before candidate building.
- Added recursive sanitizer protection around returned intent and candidate envelopes.
- Preserved the existing injected `draftReader`, `eligibilityEvaluator`, and `candidateBuilder` design.
- Did not add a parallel draft-to-Case service.

## Service Boundary Behavior

- A valid draft can return a sanitized internal planning intent.
- Missing draft data returns a safe blocked envelope.
- Reader failures return a safe blocked envelope without raw error leakage.
- Organization mismatch returns `organization_scope_mismatch` before candidate building.
- Duplicate candidate metadata remains advisory and requires review when unresolved.
- Reporter, customer, billing contact, and on-site contact references remain distinct.
- Case candidate data remains an internal planning candidate only.

## Explicit Non-goals

- No route.
- No route mount.
- No controller.
- No app/server bootstrap change.
- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No smoke.
- No deploy.
- No Zeabur env changes.
- No provider sending.
- No AI/RAG.
- No billing.
- No formal Case creation.
- No draft-to-Case persistence.
- No draft-to-formal-Case linking.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Verification Summary

- Added synthetic tests for:
  - valid planning intent preparation;
  - missing and failed draft safe failure paths;
  - organization mismatch fail-closed behavior;
  - duplicate candidate review-required behavior;
  - injected candidate builder output sanitization;
  - contact reference separation preservation.
- Added static Task1889 boundary coverage for:
  - no route/controller/app/server mount;
  - no DB, migration, seed, smoke, deploy, provider, AI, or billing execution;
  - no formal Case creation/linking;
  - no Completion Report / Field Service Report behavior;
  - no finalAppointmentId mutation.
