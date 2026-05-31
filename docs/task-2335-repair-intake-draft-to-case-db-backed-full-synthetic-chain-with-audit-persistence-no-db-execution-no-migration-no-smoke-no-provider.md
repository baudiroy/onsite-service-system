# Task2335 Repair Intake Draft-to-Case DB-Backed Full Synthetic Chain with Audit Persistence

## Scope

Task2335 adds a focused full synthetic test proving the accepted fake DB-backed Repair Intake draft-to-case chain can include audit persistence through the Task2334 runtime ports factory audit writer seam.

No source behavior changed.

## Full Synthetic Chain

The new focused test composes fake/injected dependencies only:

- fake draft/idempotency query DB client
- fake transaction runner
- fake case repository
- fake audit DB client
- `createRepairIntakeDraftToCaseRuntimePorts`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseApiModule`
- injected controller facade matching the accepted Task2326 pattern

The successful path proves:

- draft reader reads matching organization and draft from the fake query client
- idempotency lookup and record use the scoped fake query client
- case creator transaction skeleton reaches create, link, audit, and commit
- runtime factory audit writer uses the injected fake audit DB client
- fake audit DB receives `repair_intake_audit_events` payloads
- audit payload includes `organization_id`
- `tenant_id` is included when present
- event type remains allowlisted as `repair_intake_draft_to_case_submission`
- safe metadata remains minimized to the runtime factory source marker
- API output remains safe and compatible with the existing public envelope shape

## Fail-Closed Coverage

The focused test proves:

- fake audit DB thrown errors fail closed
- fake audit DB rejected errors fail closed
- malformed fake audit DB results fail closed
- missing organization in audit event fails closed before fake audit DB call
- cross-organization draft fails closed before transaction and audit persistence
- wrong idempotency replay scope does not replay attacker data

## No-Leakage And No-Mutation Coverage

The focused test verifies output and captured fake persistence calls do not expose:

- raw DB rows
- SQL / stack / DB errors
- token/password/secret
- provider payload
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- audit internals
- customer private/contact/address fields
- raw service payloads

The focused test also verifies:

- input request objects are not mutated
- fake row/result objects are not mutated
- fake dependency objects are not mutated

## Runtime Statement

- No DB execution occurred.
- No SQL was executed against a real DB.
- No migration was created, dry-run, or applied.
- Migration 026 was not applied.
- No env, Zeabur, secrets, or `DATABASE_URL` values were inspected.
- No server/listener was started.
- No smoke or endpoint probe was run.
- No provider sending occurred.
- Task2335 does not authorize DB, migration, smoke, runtime, deploy, staging, or provider execution.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2335 scope and must stay untouched unless PM explicitly authorizes that exact action.
