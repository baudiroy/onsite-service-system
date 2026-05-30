# Task2207 Repair Intake Draft-to-Case Safe Audit Context Propagation

## Scope

- Strengthened safe audit context propagation in the existing Repair Intake draft-to-case injected audit writer adapter.
- Added focused unit coverage for admin injected allowed-path audit context and permission-denied synthetic audit behavior.
- No DB, repository, migration, env, Zeabur, smoke, endpoint, server/listener, provider, AI/RAG, billing, package, admin frontend, Customer Access, or Engineer Mobile changes.
- The 7 held historical docs remain untracked and untouched.

## Boundary Inspected and Changed

- Inspected the route/admin/API/controller/application/synthetic audit path.
- Inspected existing audit-aware synthetic handler and permission-denied audit tests.
- Changed `src/repairIntake/repairIntakeAuditWriterPortAdapter.js` only, so audit port payloads now retain explicit sanitized `repairIntakeDraftId`, `actorId`, `actorRole`, `source`, and trusted request context when those values are provided by server-owned context.

## Final Audit Context Rule

- Accepted audit context sources are trusted server-owned route/application/synthetic context: `organizationId`, `tenantId`, `actorId`, `actorRole`, `repairIntakeDraftId`, `source`, and sanitized request correlation already present in the current route/application pattern.
- Body, nested `draftInput`, provider payloads, AI/RAG, billing/settlement/invoice, debug/internal/SQL/stack/raw fields, customer private/contact/address fields, and client-controlled audit fields cannot provide or override audit context.
- Permission-denied audit intent remains resolver-context-only and sanitized.
- Audit writer absence and audit writer failure remain safe and do not leak raw details into public/synthetic envelopes.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditAwareSyntheticHandlerIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js`
- Adjacent audit writer/application/admin tests as applicable.
- `git diff --check`
- `git diff --cached --check`
