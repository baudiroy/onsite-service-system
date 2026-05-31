# Task2333 Repair Intake Draft-to-Case Audit Persistence Fake-Client Wiring Static Boundary Guard

## Scope

Task2333 adds a text-only static boundary guard for the fake-client audit persistence wiring accepted in Task2332.

No runtime/source behavior changed.

## Guarded Boundary

The guard reads source, test, and docs as text only:

- `src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiring.unit.test.js`
- Task2331 and Task2332 docs/tests
- Task2333 doc

It does not import or execute DB clients, migration code, server code, route mounts, endpoint probes, smoke tests, providers, env, Zeabur, or secrets.

## Static Coverage

The guard freezes that Task2332 fake-client wiring composes:

- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeDraftCaseAuditWriterAdapter`
- fake injected audit DB client
- fake draft reader
- fake case planner
- fake case creator

The guard freezes the accepted fake insert payload markers:

- `repair_intake_audit_events`
- `organization_id`
- `tenant_id`
- `event_type`
- `draft_id`
- `case_id`
- `case_ref`
- `actor_id`
- `actor_type`
- `request_id`
- `decision`
- `outcome`
- `reason_code`
- `safe_metadata`
- `visibility`
- `occurred_at`

## Fail-Closed Coverage

The guard freezes visible coverage for:

- missing organization before fake DB call
- malformed event type before fake DB call
- malformed outcome before fake DB call
- fake DB thrown error
- fake DB rejected error
- malformed fake DB result
- malformed fake DB result mapped to `REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED`

## Safety Coverage

The guard freezes unsafe leakage and no-mutation coverage for:

- raw request body
- raw draft input
- raw DB rows
- SQL / stack / DB errors
- token/password/secret
- provider payload
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- customer private/contact/address fields
- raw service payloads
- command/fake dependency object immutability

## Forbidden Coupling

The guard asserts no forbidden runtime coupling is introduced:

- no `DATABASE_URL`
- no `process.env`
- no direct DB pool creation
- no app/server/listener imports
- no route mount
- no migration execution strings
- no applying migration 026
- no smoke/endpoint/deploy/Zeabur markers
- no provider sending
- no package/runtime server coupling

## Runtime Statement

- No DB execution occurred.
- No SQL was executed against a real DB.
- No migration was created, dry-run, or applied.
- Migration 026 was not applied.
- No env, Zeabur, secrets, or `DATABASE_URL` values were inspected.
- No server/listener was started.
- No smoke or endpoint probe was run.
- No provider sending occurred.
- No route path, mount, controller, public/open/customer route, admin frontend, Customer Access, Engineer Mobile, AI/RAG, billing, package, or deploy behavior changed.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2333 scope and must stay untouched unless PM explicitly authorizes that exact action.
