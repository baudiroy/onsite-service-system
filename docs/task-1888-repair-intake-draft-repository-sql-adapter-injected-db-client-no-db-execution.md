# Task1888 Repair Intake Draft Repository SQL Adapter / Injected DB Client / No DB Execution

Status: implemented and verified with synthetic tests only.

Scope:
- Harden the existing Repair Intake draft SQL repository adapter boundary.
- Keep the adapter injected `dbClient` only.
- Preserve the Repair Intake draft boundary before any formal Case creation gate.

## Implementation Summary

- Hardened `src/repairIntake/repairIntakeDraftRepository.js`.
- Hardened `src/repairIntake/repairIntakeDraftRepositoryContract.js`.
- The repository still performs only a parameterized `SELECT` against `repair_intake_drafts`.
- The repository still requires an injected `dbClient.query`.
- No global pool, `DATABASE_URL`, app/server import, route import, provider import, AI import, billing import, or migration dependency was added.

## Draft-boundary Metadata

The SQL repository now preserves sanitized draft-boundary fields needed by later preflight and planning boundaries:

- `brandId`
- `serviceProviderId`
- `duplicateStatus`
- `duplicateCandidate`
- `reporterRef`
- `customerRef`
- `billingContactRef`
- `onSiteContactOverrideRef`
- `contactRoleSeparation`
- `platformAccepted`
- `importAccepted`

Duplicate metadata remains candidate metadata only:
- no confirmed duplicate marker is exposed;
- no formal Case id/ref/no is exposed from duplicate metadata;
- duplicate candidate output is limited to candidate/status/reason/source metadata.

Contact role fields remain separated:
- reporter remains reporter;
- customer remains customer;
- billing contact remains billing contact;
- on-site contact override remains on-site override.

## Contract Boundary

The repository contract was updated to allow the new sanitized draft-boundary fields through normalized envelopes while continuing to strip unsafe fields.

The contract still returns safe envelopes for:
- ready draft;
- not found;
- invalid input;
- repository/client failure.

## Explicit Non-goals

- No real DB connection.
- No DB command execution.
- No SQL execution against a live target.
- No migration.
- No seed.
- No smoke.
- No deploy.
- No Zeabur env changes.
- No provider sending.
- No AI/RAG.
- No billing.
- No formal Case creation.
- No Case table mutation.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Verification Summary

- Added synthetic repository coverage for parameterized scoped read and sanitized draft-boundary metadata.
- Added contract coverage for normalized safe envelopes preserving draft-boundary fields and stripping confirmed duplicate markers.
- Added static Task1888 boundary coverage for no DB runtime coupling, no migration/smoke/deploy/provider/AI/billing, no formal Case creation, and no FSR/finalAppointment mutation behavior.
- Used synthetic injected clients only.
