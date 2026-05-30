# Task2209 Repair Intake Draft-to-Case Public Success Envelope Final Allowlist

## Scope

- Strengthened the final public success envelope allowlist in the existing Repair Intake draft-to-case public presenter.
- Added focused unit coverage for synthetic/public presenter output and HTTP result mapper output.
- No DB, repository, migration, env, Zeabur, smoke, endpoint, server/listener, provider, AI/RAG, billing, package, admin frontend, Customer Access, or Engineer Mobile changes.
- The 7 held historical docs remain untracked and untouched.

## Boundary Inspected and Changed

- Inspected `repairIntakeDraftToCasePublicResultPresenter`, `repairIntakeDraftToCaseHttpResultMapper`, full synthetic/HTTP envelope tests, and Task2191 safe output allowlist coverage.
- Changed only `src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js` so public scalar ids are constrained before synthetic/public callers receive them.

## Final Public Success Envelope Allowlist

- Public success output is limited to:
  - `ok`
  - `status`
  - `messageKey`
  - `reasonCode`
  - `caseId`
  - `repairIntakeDraftId`
- `caseId` and `repairIntakeDraftId` must be safe scalar identifiers: nonblank, at most `160` characters, safe characters only, and without unsafe private/system markers.
- No organization, tenant, actor, source, request body, draft input, customer private/contact/address, appointment, engineer, provider, AI/RAG, billing, audit, permission/internal/debug/SQL/stack/raw error, token/password/secret fields are exposed.
- Denied, failure, unavailable, invalid, and permission-denied envelopes remain generic and sanitized.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCasePublicSuccessEnvelopeFinalAllowlist.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseResponsePresenterSafeOutputAllowlist.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionGateWiring.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.unit.test.js`
- Adjacent presenter/mapper tests as applicable.
- `git diff --check`
- `git diff --cached --check`
