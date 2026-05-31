# Task2331 Repair Intake Draft-to-Case Audit Event Persistence Contract Guard And Table Shape Alignment

## Scope

Task2331 aligns the Repair Intake draft-to-case audit writer adapter contract with the existing `repair_intake_audit_events` table candidate from migration 026 and adds focused contract/static guard coverage.

This task does not execute DB, SQL, migration, smoke, endpoint, provider, server, listener, env, Zeabur, secrets, staging, production, or deploy commands.

## Modified Files

- `src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js`
- `tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceContract.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceBoundary.static.test.js`
- `docs/task-2331-repair-intake-draft-to-case-audit-event-persistence-contract-guard-table-shape-alignment-no-db-execution-no-migration-no-smoke-no-provider.md`

## Source Behavior Change

The source change is limited to the draft-case audit writer adapter contract/table-shape alignment.

The adapter now defaults to `repair_intake_audit_events` instead of the generic `audit_events` table name. Its payload shape now aligns to the migration 026 candidate columns:

- id
- organization_id
- tenant_id
- event_type
- draft_id
- case_id
- case_ref
- actor_id
- actor_type
- request_id
- decision
- outcome
- reason_code
- safe_metadata
- visibility
- occurred_at

The adapter remains injected-client only. It still accepts injected `insert`, `query`, or `execute` clients and uses the optional injected transaction client from input when present.

## Contract Coverage

Task2331 freezes the current audit event persistence contract:

- target table candidate is `repair_intake_audit_events`
- organization and tenant isolation are represented
- actor/source/request attribution is server-owned and allowlisted
- event taxonomy is allowlisted to `repair_intake_draft_to_case_submission` and `repair_intake_draft_to_case_permission_denied`
- outcomes remain allowlisted to submitted, blocked, and failed
- payload allowlist is minimized to migration-compatible scalar fields plus safe metadata
- idempotency/replay markers are represented only inside safe metadata when already available
- malformed event type, outcome, organization, draft, actor, or writer result fails closed
- input audit context and event objects are not mutated
- unsafe strings and unsafe fields are stripped or blocked

## Safety Coverage

Unsafe fields and markers remain excluded:

- raw request body
- raw draft input
- raw DB rows
- SQL
- stack traces
- token/password/secret
- provider payload
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- customer private/contact/address fields
- raw service payloads

## Static Boundary

The Task2331 static guard reads source, docs, and migration files as text only. It asserts:

- migration 026 contains `repair_intake_audit_events`
- adapter default table and insert shape align to the accepted table candidate
- generic `subject_type`, `subject_id`, `related_case_id`, `required_actions`, and `idempotency_key` table columns are no longer part of the insert shape
- adapter remains injected and not globally wired
- no DB execution, migration, route, server, provider, AI, billing, package, smoke, or rollout coupling is introduced
- Task2331 does not authorize applying migration 026

## Future Implementation Decisions Frozen

- Use `repair_intake_audit_events` as the table candidate unless PM explicitly changes the target.
- Keep audit persistence blocking inside the draft-to-case submit path unless PM explicitly chooses best-effort behavior; this preserves the accepted blocking failure mode.
- Freeze transaction coupling as a required future decision: couple submit audit persistence to the case creation transaction path when PM authorizes implementation against a disposable DB or runtime boundary.
- Keep permission-denied audit persistence separate from case creation transaction unless PM authorizes a separate path.
- Keep idempotency/replay markers minimized in safe metadata until PM authorizes a more specific replay/audit correlation contract.
- Keep retention/deletion unresolved beyond preserving the migration 026 `retention_until` marker.

## Explicit Non-Authorization

- No DB execution occurred.
- No SQL was executed against a real DB.
- No migration was created, dry-run, or applied.
- No env, Zeabur, secrets, or `DATABASE_URL` values were inspected.
- No server/listener was started.
- No smoke or endpoint probe was run.
- No provider sending occurred.
- No route path, mount, controller, public/open/customer route, admin frontend, Customer Access, Engineer Mobile, AI/RAG, billing, package, or deploy behavior changed.
- Task2331 does not authorize applying migration 026.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2331 scope and must stay untouched unless PM explicitly authorizes that exact action.
