# Task1203 - Repair Intake Case Repository Implementation Preflight / No DB Execution

## Status

Completed locally. Not staged.

This is a docs-only implementation preflight for the next Repair Intake case repository implementation step. It does not create or modify source, tests, runtime wiring, package files, migration SQL, admin frontend, provider integrations, AI, billing, smoke/shared runtime, staging, or commits.

No DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate` was performed.

## Accepted Baseline

- Latest accepted commit: `84691b9 Add repair intake case repository contract`.
- Cached/staged area is clean after Task1202.
- Repair Intake case repository contract and case creator port adapter are committed.
- Repair Intake draft repository read model and draft repository contract are committed.
- Repair Intake idempotency repository read model, idempotency repository contract, and idempotency writer forwarding are committed.
- Migration `026_create_repair_intake_persistence_tables.sql` exists as a proposal only.
- Migration 026 has not been dry-run or applied.
- No DB execution has occurred for this Repair Intake persistence path.

## Read-Only Preflight Findings

The committed case repository contract exposes a bounded `createCaseFromDraft(input)` seam. It requires an injected repository or `caseRepository` with a `createCaseFromDraft` function, sanitizes input and output, rejects missing draft or plan payloads, strips unsafe fields, and returns failure envelopes instead of leaking raw errors.

The committed case creator port adapter already reduces draft and plan input to safe summaries before invoking the injected case creation port. It strips unsafe customer, token, DB, SQL, raw, repository, stack, and `finalAppointmentId` fields, and returns sanitized case references.

The committed draft repository is a read model over `repair_intake_drafts`. It uses an injected `dbClient.query`, scopes lookup by draft id plus optional organization and tenant, maps only safe draft fields, and does not globally import DB runtime.

The committed idempotency repository already has read and writer-forwarding behavior through injected `dbClient.query`. It scopes by organization, tenant, operation type, and idempotency key, stores safe replay result data, and keeps the idempotency writer separate from case creation.

Migration 026 separates `repair_intake_drafts`, `repair_intake_draft_case_conversions`, `repair_intake_idempotency_records`, and `repair_intake_audit_events`. The conversion table tracks draft-to-case conversion state. It must not become the formal Case source of truth.

The existing Appointment and Field Service Report services show that formal Case behavior participates in organization access, appointment scheduling, final appointment validation, service report creation, audit records, messages, and transaction boundaries. Repair Intake case creation must not bypass those domain rules.

## Case Creation Boundary

Case is a formal domain object, not a Repair Intake-local artifact.

Repair Intake must not directly create an alternate Case representation or use the conversion table as the formal Case source of truth. A future implementation must preserve the formal Case lifecycle already used by appointments, dispatch, field service reports, audit, and messages.

Hard case creation invariants:

- Do not expose, accept, persist, or infer `finalAppointmentId` from Repair Intake case creation.
- Do not create field service reports.
- Do not create or mutate appointments.
- Do not infer final appointments.
- Do not update Field Service Report state.
- Do not bypass organization or tenant isolation.
- Do not leak customer PII, raw draft data, raw SQL, DB handles, tokens, secrets, headers, stacks, or repository internals.
- Preserve the one Case / one formal report boundary.
- Keep draft conversion state separate from formal Case state.
- Keep audit and idempotency responsibilities separate from case creation.

## Implementation Options

### Option A - Existing Case Domain Service Through Injected `caseService`

Future implementation receives an injected formal Case service with a bounded method such as `createCaseFromRepairIntake` or an adapter-owned call into the existing Case creation flow.

Benefits:

- Most likely to preserve existing domain rules.
- Keeps formal Case creation in the formal Case owner.
- Avoids duplicating business logic in Repair Intake.

Risks:

- Requires a clearly authorized and stable Case service contract.
- May need transaction coordination later.
- Existing Case service may expose broader fields than Repair Intake should pass.

### Option B - Existing Case Repository Through Injected Adapter

Future implementation receives an injected adapter around the existing Case repository. The Repair Intake module would call only a narrow injected method and would not import `src/repositories/**` directly unless separately authorized.

Benefits:

- Keeps Repair Intake module decoupled from global DB imports.
- Can be tested with synthetic dependencies first.
- Allows the adapter to sanitize Repair Intake input before formal Case creation.

Risks:

- Repository-level calls can bypass higher-level service policies if the adapter is too thin.
- Requires explicit authorization before importing or invoking existing repository code.
- Transaction boundary remains undecided.

### Option C - Repair Intake Direct DB Writer Later

Future implementation writes directly to formal Case tables or repair intake conversion tables using a DB client.

Benefits:

- Simple dependency shape.
- Could be efficient once the formal schema and transaction policy are accepted.

Risks:

- Highest chance of bypassing Case domain rules.
- Can duplicate or fork formal Case logic.
- Can blur conversion tracking with formal Case creation.
- Should not be selected until PM separately authorizes direct repository writer behavior and transaction orchestration.

### Option D - Synthetic-Only Implementation First

Future implementation creates `src/repairIntake/repairIntakeCaseRepository.js` as an injected synthetic adapter. It accepts a narrow injected dependency, validates and sanitizes input, returns the contract's safe envelope, and uses tests with synthetic dependencies only.

Benefits:

- Lowest runtime risk.
- Proves input/output shape before real DB or formal service integration.
- Keeps PM decision points small.
- Preserves no-global-import and no-real-DB boundaries.

Risks:

- Does not yet prove real Case persistence.
- Requires a later task to choose formal Case service or repository integration.

## Recommended Next Implementation

Recommended path: Option D first, with an adapter shape that can later wrap Option A or Option B.

The next bounded implementation should create a synthetic injected Case creation repository/service adapter first. It should not use a real DB client, should not import global DB modules, and should not wire into route, controller, application service, or transaction orchestration.

Suggested next task:

- Task1204 - Repair Intake Case Repository Injected Implementation / No DB Execution

Future source file candidate:

- `src/repairIntake/repairIntakeCaseRepository.js`

Future test file candidate:

- `tests/repairIntake/repairIntakeCaseRepository.unit.test.js`

Future doc candidate:

- `docs/task-1204-repair-intake-case-repository-injected-implementation-no-db-execution.md`

Expected future behavior:

- require an injected `caseCreationService` or `caseCreationPort`;
- fail closed when the injected dependency is missing;
- accept only sanitized draft, plan, organization, tenant, actor, request, and metadata summaries;
- reject or omit unsafe customer, token, SQL, DB, raw, repository, stack, and final appointment fields;
- return the committed case repository contract envelope;
- preserve idempotency, conversion tracking, and audit as separate responsibilities;
- avoid real Case persistence until PM authorizes the formal Case integration strategy.

## Hard Boundaries For Future Implementation

- Injected dependency only.
- No `src/db/**` imports.
- No `src/repositories/**` imports unless separately authorized.
- No `process.env`.
- No `DATABASE_URL`.
- No real DB connection.
- No SQL execution.
- No migration dry-run or apply.
- No route, controller, app factory, app service, or server wiring.
- No transaction orchestration yet.
- No provider, LINE, SMS, app, email, webhook, admin, AI, billing, or settlement changes.
- No smoke/shared runtime changes unless separately assigned.
- No `finalAppointmentId` input, output, mutation, inference, or persistence.
- No field service report creation.
- No appointment creation or mutation.

## Validation Before Future Implementation

Before writing Task1204 source code, validate the following with read-only inspection in that future task:

- identify the existing formal Case service or repository contract that owns Case creation;
- confirm the minimum safe input needed to create a formal Case from a Repair Intake draft;
- define organization and tenant isolation requirements;
- define actor and request context handling;
- define safe output shape for `caseId`, `caseRef`, status, metadata, warnings, and required actions;
- confirm customer/PII fields remain referenced or summarized safely instead of copied raw;
- confirm idempotency replay and audit event responsibilities remain outside the case repository;
- confirm missing or failing injected dependency returns a fail-closed envelope or bounded error;
- confirm transaction ownership is deferred to a separate transaction-boundary decision task.

## Acceptance Criteria

- Only this Task1203 document is created.
- No source, test, runtime, package, migration, admin, provider, route, controller, app-service, smoke, design, or guardrail files are modified.
- No staging occurs.
- No commit occurs.
- No DB command is run.
- Cached diff remains empty.
- The document recommends a bounded next implementation path.
- Existing 8 tracked dirty legacy files remain untouched except read-only inspection authorized by PM.
- Existing 907 untracked files remain untouched.

## Completion Notes

- Source/runtime modified: no.
- DB commands executed: no.
- Migration dry-run/apply executed: no.
- Additional staging performed: no.
- Commit performed: no.
- Cleanup/reset/stash/revert performed: no.
