# Task2217 Repair Intake Draft-to-Case Audit Persistence Decision Gate

## Scope

- Adds this no-runtime-change audit persistence decision gate for Repair Intake draft-to-case.
- Adds a static guard for the current audit persistence boundary.
- Does not implement audit DB writes, repository behavior, migrations, SQL, route/runtime wiring, providers, notifications, AI/RAG, billing, package changes, smoke probes, server/listener startup, or environment inspection.
- Does not authorize Task2218 or any future task.

## Current Audit Boundary

- Current audit behavior is injected, synthetic, and port-based only.
- `repairIntakeAuditWriterPortAdapter.js` requires an injected `auditPort.recordDraftToCaseDecision()` and returns sanitized envelopes.
- `repairIntakeDraftToCasePlanningAuditBoundary.js` builds a sanitized planning audit event and records it only through an injected audit writer.
- `repairIntakeDraftToCaseAuditIntentBuilder.js` builds a narrow server-owned audit intent with scalar phase/context/result fields.
- `repairIntakeDraftToCaseSyntheticHandler.js` writes permission-denied audit intent only through an injected writer or sink, then returns the safe deny envelope.

## Current Sanitization Rule

- Audit intent and audit payloads are sanitized and based on server-owned context.
- Accepted context is limited to safe event/context/reason fields such as organization, tenant, actor, role, draft id, source, request correlation, phase, result status, and reason code.
- Raw request/body/draft input, customer contact/address/private data, provider payloads, AI/RAG fields, billing/settlement/invoice/payment fields, tokens, passwords, SQL, debug/internal details, stack traces, and raw errors are not audit context.
- Audit writer absence and failure remain safe. Missing writers return safe no-record envelopes or no-op behavior; writer failures do not expose raw error details.

## Persistence Decision Gate

- No DB audit persistence is authorized by this task.
- No audit table, schema, migration, SQL string construction, SQL execution, or migration dry run is authorized.
- No repository implementation change is authorized.
- No provider, notification, webhook, AI/RAG, billing, settlement, invoice, or payment behavior is authorized.
- Future audit persistence requires a separate exact PM-authorized task.

## Future Decisions Required Before Persistence

- Audit table/schema target.
- Tenant/organization isolation column policy.
- Actor and source attribution rules.
- Event type taxonomy.
- Payload minimization and field allowlist.
- Retention/deletion policy.
- Failure mode: best-effort vs blocking.
- Transaction boundary: same transaction as case creation vs independent write.
- Replay/idempotency behavior.
- Migration and dry-run authorization.
- Smoke, staging, and production authorization.

## Static Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceDecisionGate.static.test.js` asserts no direct DB, repository, migration, provider, notification, AI/RAG, billing, settlement, invoice, or payment imports or markers were introduced in current audit-related files.
- The guard asserts the audit writer remains an injected port adapter instead of a concrete DB repository.
- The guard asserts permission-denied audit intent remains sanitized and injected-writer based.
- The guard ties this decision gate to the existing Task2199, Task2208, and audit writer adapter guards.

## Authorization Boundary

PM must still authorize one exact task at a time. Importing or documenting this decision gate does not authorize Task2218, audit persistence implementation, DB/migration work, runtime exposure, smoke probes, provider work, or any future task.
