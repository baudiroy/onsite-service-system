# Task2208 Repair Intake Draft-to-Case Safe Audit Context Static Boundary Guard

## Scope

- Added a focused static boundary guard for the Task2207 safe audit context propagation rules.
- No runtime/source behavior changes.
- No DB, repository, migration, env, Zeabur, smoke, endpoint, server/listener, provider, AI/RAG, billing, package, admin frontend, Customer Access, or Engineer Mobile changes.
- The 7 held historical docs remain untracked and untouched.

## Static Boundary Covered

- Audit writer port adapter keeps explicit sanitized context only.
- Accepted audit context remains limited to trusted server-owned fields: `organizationId`, `tenantId`, `actorId`, `actorRole`, `repairIntakeDraftId`, `source`, and current trusted request correlation.
- Body-level audit/auditActor/auditContext, actor, organization, request/correlation/debug, provider, AI/RAG, billing/settlement/invoice, token/password/debug/internal/SQL/stack/raw fields are not trusted as audit context.
- Nested `draftInput` cannot provide or override audit context.
- Permission-denied audit intent remains sanitized and resolver-context-only.
- Allowed-path audit payload remains sanitized before the audit writer boundary.
- Audit writer absence and failure remain safe.
- Permission-denied path still returns before injected controller/service adapter input or invocation.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditAwareSyntheticHandlerIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
