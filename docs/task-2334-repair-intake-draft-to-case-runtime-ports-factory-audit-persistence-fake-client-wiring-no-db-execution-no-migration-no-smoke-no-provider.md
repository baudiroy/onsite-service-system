# Task2334 Repair Intake Draft-to-Case Runtime Ports Factory Audit Persistence Fake-Client Wiring

## Scope

Task2334 verifies and narrowly aligns the Repair Intake draft-to-case runtime ports factory audit writer wiring so the accepted `repair_intake_audit_events` fake-client audit persistence seam can be composed through the runtime ports factory.

Source behavior changed only in `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js`:

- `createAuditPort` now delegates audit persistence to `createRepairIntakeDraftCaseAuditWriterAdapter`.
- The factory still requires the existing injected main `dbClient` for runtime ports factory composition.
- The audit writer can use an explicit injected `auditDbClient`; otherwise it falls back to the existing injected `dbClient`.
- No route, controller, public/open route, permission model, idempotency, draft reader, case creator transaction, package, provider, Customer Access, Engineer Mobile, AI/RAG, billing, deploy, staging, or production behavior changed.

## Runtime Factory Audit Wiring

The runtime factory now composes:

- `createRepairIntakeDraftToCaseRuntimePorts`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeDraftCaseAuditWriterAdapter`
- explicit injected fake `auditDbClient`
- accepted table name `repair_intake_audit_events`

The focused fake-client unit verifies:

- factory composition does not call the main fake query DB client
- factory composition does not call the fake audit DB client
- `ports.auditWriter.recordDraftToCaseDecision` writes through the injected fake audit DB client only when invoked
- the insert target is `repair_intake_audit_events`
- the payload includes `organization_id`, `tenant_id`, `event_type`, `draft_id`, `case_id`, `case_ref`, `actor_id`, `actor_type`, `request_id`, `decision`, `outcome`, `reason_code`, `safe_metadata`, `visibility`, and `occurred_at`

## Fail-Closed Coverage

Task2334 adds coverage proving:

- `organization_id` is required before fake audit DB write
- `tenant_id` is included when present
- event type remains allowlisted as `repair_intake_draft_to_case_submission`
- safe metadata is minimized to the runtime ports factory source marker
- fake DB thrown errors fail closed
- fake DB rejected errors fail closed
- malformed fake DB results fail closed with `REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED`
- fake dependencies and audit input objects are not mutated
- runtime factory missing main `dbClient` still fails closed with `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_DB_CLIENT_REQUIRED`

## Leakage Boundary

The focused unit and static guard freeze no-leakage coverage for:

- raw request body
- raw draft input
- raw service payloads
- raw DB rows
- SQL / stack / DB errors
- token/password/secret
- provider payload
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- customer private/contact/address fields

## Verification

Expected focused verification:

- `node --test tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceFakeClient.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceBoundary.static.test.js`

Expected adjacent verification:

- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiring.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiringBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceContract.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractBoundary.static.test.js`

No DB/integration tests requiring a real database are authorized by this task.

## Runtime Statement

- No DB execution occurred.
- No SQL was executed against a real DB.
- No migration was created, dry-run, or applied.
- Migration 026 was not applied.
- No env, Zeabur, secrets, or `DATABASE_URL` values were inspected.
- No server/listener was started.
- No smoke or endpoint probe was run.
- No provider sending occurred.
- Task2334 does not authorize DB, migration, smoke, runtime, deploy, staging, or provider execution.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2334 scope and must stay untouched unless PM explicitly authorizes that exact action.
