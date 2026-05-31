# Task2330 Repair Intake Draft-to-Case Audit Persistence Implementation Authorization Packet

## Scope

Task2330 prepares the next Repair Intake draft-to-case audit persistence branch by documenting the current audit seams, existing table/schema markers, open decisions, and a recommended next bounded task.

This packet is docs plus source-reading static inventory only. It does not change runtime, source, route, controller, repository, migration, package, provider, admin frontend, Customer Access, Engineer Mobile, billing, or AI/RAG behavior.

Task2330 does not authorize audit persistence implementation.

## Current Accepted Audit Status

- Audit behavior in the application service remains injected-port based through `auditWriter.recordDraftToCaseDecision()`.
- Permission-denied audit intent remains sanitized and written only through an injected writer or sink.
- Application/service audit context propagation remains sanitized before it reaches the audit writer boundary.
- Audit writer result normalization and failure behavior remain safe: invalid input, thrown writer failures, rejected writer failures, invalid writer results, and object-shaped failure envelopes fail closed without raw error leakage.
- Existing DB-capable audit markers are inventory only in this packet; no real audit persistence execution is authorized here.

## Audit Seam Inventory

### Audit Writer Port Adapter

`src/repairIntake/repairIntakeAuditWriterPortAdapter.js`

- Exposes `createRepairIntakeAuditWriterPortAdapter(options)`.
- Requires injected `auditPort.recordDraftToCaseDecision(input)`.
- Sanitizes draft, plan, caseRef, decision, draft id, organization id, tenant id, request id, actor, metadata, and warnings.
- Blocks unsafe fields such as raw rows, raw payloads, SQL, stack traces, credentials, provider payloads, customer private/contact/address fields, and DB internals.
- Returns sanitized success/failure envelopes.
- Does not own a concrete repository or direct DB client.

### Draft-to-Case Audit Writer Adapter

`src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js`

- Exposes `createRepairIntakeDraftCaseAuditWriterAdapter(options)`.
- Accepts an injected `dbClient`, table name, clock, and id generator.
- Normalizes supported audit event input for `repair_intake_draft_to_case_submission`.
- Allows outcomes `submitted`, `blocked`, and `failed`.
- Builds an allowlisted payload with id, event type, outcome, organization id, actor id, request id, idempotency key, subject type/id, related case id, reason code, required actions, and created timestamp.
- Supports injected client methods `insert`, `query`, or `execute`.
- Returns blocked/failed/recorded envelopes without exposing raw errors.
- Current table-name default is `audit_events`, which should be reconciled before any Repair Intake production persistence wiring.

### Application Service Usage

`src/repairIntake/repairIntakeDraftToCaseApplicationService.js`

- Requires an injected `auditWriter.recordDraftToCaseDecision`.
- Builds an audit payload from sanitized input, draft summary, plan summary, and caseRef summary.
- Calls audit writer after case creation and before idempotency result recording.
- Treats object-shaped port failures from audit writer as submit failures.
- Does not execute DB or SQL directly.

### Runtime Ports Factory Wiring

`src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js`

- Wires `createRepairIntakeAuditWriterPortAdapter({ auditPort })` into the returned app-level ports.
- Contains a DB-capable `createAuditPort` that targets `repair_intake_audit_events` behind an explicitly injected `dbClient`.
- The accepted Task2324 through Task2328 branch verified this only through fake/injected clients and text/static boundaries.
- This packet inventories that DB-capable factory marker only; it does not authorize real DB execution, route wiring, smoke, staging, or production use.

### API Module

`src/repairIntake/repairIntakeDraftToCaseApiModule.js`

- Continues to depend on injected application service/controller behavior.
- No audit persistence route or public/open route exposure is authorized by this packet.

### Migration And Table Markers

`migrations/026_create_repair_intake_persistence_tables.sql`

- Contains an inert authoring-only table proposal for `repair_intake_audit_events`.
- The file itself states that apply or dry-run requires a separate task and explicit disposable DB authorization.
- Candidate audit table columns include organization, tenant, event type, draft id, case id/case ref, actor id/type, request id, decision, outcome, reason code, safe metadata, visibility, occurred timestamp, created timestamp, and retention timestamp.
- Candidate indexes cover organization plus created time, event type, draft id, case id, and request id.

### Relevant Accepted Tests And Guards

- `tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceDecisionGate.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.static.test.js`
- `tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseDbBackedImplementationAuthorization.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractBoundary.static.test.js`
- Task2217 audit persistence decision gate
- Task2314 through Task2329 DB-backed fake/synthetic persistence branch docs and checkpoints

## Future Audit Persistence Decisions

### Target Table

Preferred candidate: `repair_intake_audit_events` from migration 026.

Decision required before implementation: reconcile this target with `repairIntakeDraftCaseAuditWriterAdapter.js`, whose default table name is currently `audit_events` and whose payload uses generic subject columns that do not exactly match migration 026.

### Organization And Tenant Isolation

Future persistence must write `organization_id` on every audit event. It must include `tenant_id` when present and must never accept client-controlled organization or tenant overrides.

### Actor And Source Attribution

Future persistence must record server-trusted actor attribution only:

- actor id
- actor type or role
- source/system marker
- request id when present

No raw request body, client-provided actor override, headers, authorization token, or provider payload may become audit attribution.

### Event Type Taxonomy

Initial draft-to-case event taxonomy should stay narrow:

- `repair_intake_draft_to_case_submission`
- `repair_intake_draft_to_case_permission_denied`
- future blocked/failed variants only if PM authorizes exact event contracts

### Payload Minimization

Persist only allowlisted scalar and safe JSON fields:

- event id
- organization id
- tenant id when present
- event type
- draft id
- case id or case ref when present
- actor id/type
- request id
- idempotency key only if required for replay traceability
- decision/outcome
- reason code
- safe metadata allowlist
- timestamps
- retention timestamp when policy is defined

Do not persist raw DB rows, raw draft payloads, raw body/service payloads, SQL, stack traces, credentials, provider payloads, AI/RAG/vector content, billing/settlement/payment/invoice fields, audit internals, customer private/contact/address fields, or raw service payloads.

### Retention And Deletion

Migration 026 includes `retention_until`, but this branch has not established a complete retention/deletion policy. Retention policy remains undecided and must be resolved before production persistence rollout.

### Failure Mode

Recommended failure mode for the next implementation design: blocking inside the draft-to-case submit path until PM explicitly decides otherwise.

Reason: the current application service treats audit writer object-shaped failures as submit failures, and the Task2326 branch already accepted this fail-closed behavior.

### Transaction Coupling

Recommended transaction coupling: same transaction as case creation for the case creator transaction skeleton path, with rollback represented when supported.

Decision required before implementation: define whether audit persistence should also support independent best-effort writes outside the case creation transaction for non-submit or permission-denied events.

### Idempotency And Replay

Future audit persistence must avoid duplicate unsafe audit writes on replay. Recommended next decision: define idempotency-key and request-id correlation before DB persistence implementation.

### Raw Error Handling

Future persistence must return sanitized blocked/failed envelopes only. It must not expose SQL, stack traces, DB errors, connection strings, credentials, provider payloads, customer private data, or raw writer payloads.

## Recommended Next Bounded Task

Recommended next task: Repair Intake draft-to-case audit event persistence contract guard and table-shape alignment, no DB execution.

Why this task first:

- It can reconcile `repair_intake_audit_events` from migration 026 with the current `repairIntakeDraftCaseAuditWriterAdapter.js` table/payload shape before implementation.
- It can freeze the exact event type taxonomy, payload allowlist, failure mode, transaction coupling, and idempotency/replay expectations.
- It avoids DB execution and keeps implementation blocked until the contract is precise.

## Explicit Non-Authorization

Task2330 does not authorize:

- DB execution
- SQL execution against a real DB
- migration creation, dry-run, or apply
- `DATABASE_URL`, env, Zeabur, or secrets inspection
- server/listener startup
- smoke or endpoint probes
- provider sending
- public/open route expansion
- package or package-lock changes
- staging/prod traffic
- deploy
- audit persistence runtime implementation

PM must still authorize one exact bounded task at a time.

## Static Guard

`tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceImplementationAuthorization.static.test.js` reads source, test, docs, and migration files as text only. It verifies that Task2330 remains an authorization packet and inventory guard, not executable DB/migration/smoke/runtime authorization.

## Held Docs

The same 7 held historical untracked docs remain outside Task2330 scope and must stay untouched unless PM explicitly authorizes that exact action.
