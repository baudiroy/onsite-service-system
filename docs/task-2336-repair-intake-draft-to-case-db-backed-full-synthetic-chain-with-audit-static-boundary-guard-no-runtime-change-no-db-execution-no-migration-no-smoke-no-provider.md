# Task2336 Repair Intake Draft-to-Case DB-Backed Full Synthetic Chain with Audit Static Boundary Guard

## Scope

Task2336 adds a focused text-only static boundary guard for the Task2335 full fake DB-backed Repair Intake draft-to-case chain with audit persistence.

No runtime/source behavior changed.

## Guarded Boundary

The guard reads source, test, and docs as text only. It does not import or execute DB clients, migration code, server code, route mounts, endpoint probes, smoke tests, providers, env, Zeabur, or secrets.

The guard freezes that the Task2335 full synthetic chain composes:

- runtime ports factory
- application service
- API module
- fake draft/idempotency query DB client
- fake transaction runner
- fake case repository
- fake audit DB client

## Static Coverage

The guard freezes successful path coverage for:

- matching organization/draft read
- idempotency lookup
- idempotency record
- fake transaction create/link/audit/commit
- runtime factory audit writer
- fake `repair_intake_audit_events` audit insert payload
- safe application/API output

The guard freezes audit payload markers:

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

The guard also freezes that event type remains `repair_intake_draft_to_case_submission` and safe metadata remains minimized/sanitized to the runtime factory source marker.

## Fail-Closed Coverage

The guard freezes visible fail-closed coverage for:

- fake audit DB thrown error
- fake audit DB rejected error
- malformed fake audit DB result
- missing organization audit event before fake audit DB call
- cross-organization draft before transaction and audit persistence
- wrong idempotency replay scope not replaying attacker data

## No-Leakage And No-Mutation Coverage

The guard freezes unsafe leakage coverage for:

- raw DB rows
- SQL / stack / DB errors
- token/password/secret
- provider payload
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- audit internals
- customer private/contact/address fields
- raw service payloads

The guard freezes no-mutation coverage for:

- input request objects
- fake row/result objects
- fake dependency objects

## Runtime Statement

- No DB execution occurred.
- No SQL was executed against a real DB.
- No migration was created, dry-run, or applied.
- Migration 026 was not applied.
- No env, Zeabur, secrets, or `DATABASE_URL` values were inspected.
- No server/listener was started.
- No smoke or endpoint probe was run.
- No provider sending occurred.
- Task2336 does not authorize DB, migration, smoke, runtime, deploy, staging, or provider execution.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2336 scope and must stay untouched unless PM explicitly authorizes that exact action.
