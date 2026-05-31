# Task2337 Repair Intake Draft-to-Case Audit Persistence Fake-Client Branch Closure

## Scope

Task2337 closes the current Repair Intake draft-to-case audit persistence fake-client branch for this phase.

This is a docs-only closure. No runtime/source/test behavior changed.

## Accepted Branch Outcomes

Task2330 created the audit persistence implementation authorization packet and inventory. It documented current audit seams, existing table/schema markers, open decisions, and the recommended bounded path without authorizing audit persistence execution.

Task2331 aligned the audit writer adapter contract with the `repair_intake_audit_events` table candidate from migration 026. The accepted payload shape includes:

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

Task2332 proved audit persistence fake-client runtime wiring through the application service, audit writer port adapter, and draft-case audit writer adapter using fake/injected clients only.

Task2333 added the static boundary guard for the Task2332 fake-client audit persistence wiring and fail-closed behavior.

Task2334 wired the runtime ports factory audit writer path to the accepted fake-client audit persistence seam through explicit injected `auditDbClient`, with fallback to the accepted injected `dbClient`.

Task2335 proved the full fake DB-backed chain with audit persistence: runtime ports factory, application service, API module, fake draft/idempotency DB, fake transaction runner, fake case repository, and fake audit DB client.

Task2336 added the static guard for the Task2335 full synthetic chain with audit persistence.

## Current Audit Persistence Fake-Client Status

`repairIntakeDraftCaseAuditWriterAdapter.js` is aligned to the `repair_intake_audit_events` table candidate.

The audit event taxonomy is explicit and allowlisted:

- `repair_intake_draft_to_case_submission`
- `repair_intake_draft_to_case_permission_denied`

`safe_metadata` remains minimized and sanitized. Runtime factory audit metadata is limited to the runtime factory source marker unless a future exact PM task authorizes more.

The runtime ports factory can compose the audit writer through an explicit injected `auditDbClient` or the accepted fallback `dbClient`.

The full synthetic chain composes:

- runtime ports factory
- application service
- API module
- fake draft/idempotency DB client
- fake transaction runner
- fake case repository
- fake audit DB client

All accepted audit persistence tests use fake, injected, or synthetic clients only.

## Current Safety Status

Organization and tenant scope remain enforced. `organization_id` is required before fake audit DB write, and `tenant_id` is included when present.

Actor, source, and request attribution remain server-owned and minimized.

The accepted fail-closed coverage includes:

- missing organization fails before fake audit DB call
- malformed event type fails before fake audit DB call
- malformed outcome fails before fake audit DB call
- fake audit DB thrown errors fail closed
- fake audit DB rejected errors fail closed
- malformed fake audit DB results fail closed
- cross-organization draft fails closed before transaction and audit persistence
- wrong idempotency replay scope does not replay attacker data

The accepted no-leakage coverage includes:

- raw request body
- raw draft input
- raw DB rows
- SQL / stack / DB errors
- token/password/secret
- provider payload
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- audit internals
- customer private/contact/address fields
- raw service payloads

Input request objects, fake row/result objects, and fake dependency objects are covered by no-mutation tests.

## Closed For This Phase

The Repair Intake draft-to-case audit persistence fake-client branch is closed for this phase.

This closure authorizes no additional runtime work.

No real DB execution occurred.

No SQL was executed against a real DB.

No migration was created, dry-run, or applied.

Migration 026 was not applied.

No route path or route mount behavior changed.

No public/open route expansion occurred.

No smoke, staging, production, provider, package, server/listener, endpoint, deploy, env, Zeabur, or secrets behavior was authorized.

## Non-Authorized Future Work

The following remain non-authorized unless PM grants one exact bounded task:

- real DB execution or disposable DB dry-run
- migration or schema creation, dry-run, or apply
- applying migration 026
- route/admin production DB-backed wiring
- public/open Repair Intake route exposure
- provider or notification sending
- smoke, staging, production, or deploy rollout
- auth/session middleware changes
- rate-limit middleware changes
- payload-size or body-parser middleware changes
- AI/RAG expansion
- billing, settlement, payment, or invoice work
- package dependency changes
- changing audit failure mode from current blocking behavior to best-effort
- changing audit transaction coupling

## Runtime Statement

- No DB commands were run.
- No SQL runtime execution against a database occurred.
- No real DB connection was opened.
- No `DATABASE_URL`, Zeabur, env, or secrets were inspected.
- No server/listener was started.
- No smoke test or endpoint probe was run.
- No provider sending occurred.
- No package or package-lock changes occurred.

## Held Docs

The same 7 held historical untracked docs remain outside Task2337 scope and must stay untouched unless PM explicitly authorizes that exact action.
