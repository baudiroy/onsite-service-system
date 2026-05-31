# Task2332 Repair Intake Draft-to-Case Audit Persistence Fake-Client Runtime Wiring

## Scope

Task2332 adds a focused fake-client runtime wiring test for the Repair Intake draft-to-case audit persistence seam.

No real DB, SQL, migration, route, smoke, endpoint, provider, server, listener, env, Zeabur, secrets, staging, production, or deploy command was executed.

## Source Change

One narrow fail-closed source fix was made in `src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js`: non-object fake DB results now return `REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED` instead of being treated as recorded.

No route, controller, public/open route, permission model, draft reader, idempotency, case creator transaction, runtime ports factory, package, provider, Customer Access, Engineer Mobile, AI/RAG, billing, or migration behavior changed.

## Fake-Client Wiring Coverage

The new test composes:

- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeDraftCaseAuditWriterAdapter`
- fake draft reader
- fake case planner
- fake case creator
- fake injected audit DB client

The test proves a successful submit path writes a fake `repair_intake_audit_events` payload with:

- required `organization_id`
- included `tenant_id`
- allowlisted `event_type`
- trusted actor/source/request attribution
- minimized `safe_metadata`
- safe returned audit writer result compatible with the application service

## Fail-Closed Coverage

The test proves:

- missing organization fails closed before fake DB call
- malformed event type fails closed before fake DB call
- malformed outcome fails closed before fake DB call
- fake DB thrown errors fail closed
- fake DB rejected errors fail closed
- malformed fake DB result fails closed

## Safety Coverage

The test proves no raw leakage for:

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

The test also proves input audit context objects, fake DB result objects, and fake dependency objects are not mutated by the successful path.

## Explicit Non-Authorization

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

The same 7 held historical untracked docs remain outside Task2332 scope and must stay untouched unless PM explicitly authorizes that exact action.
