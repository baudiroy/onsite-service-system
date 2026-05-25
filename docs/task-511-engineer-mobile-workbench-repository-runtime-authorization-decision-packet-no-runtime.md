# Task 511 - Engineer Mobile Workbench Repository Runtime Authorization Decision Packet

## Branch Status

Task511 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and authorization-decision-packet-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Task511 itself does not approve runtime.

Task511 itself does not approve DB access.

Task511 itself does not approve migration.

Task511 itself does not approve repository implementation.

Task511 is not a schema approval.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task511 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-502-engineer-mobile-workbench-db-repository-design-branch-entry-no-migration.md`
- `docs/task-503-engineer-mobile-workbench-engineer-profile-repository-contract-proposal-no-runtime.md`
- `docs/task-504-engineer-mobile-workbench-organization-scope-repository-contract-proposal-no-runtime.md`
- `docs/task-505-engineer-mobile-workbench-assignment-lookup-repository-contract-proposal-no-runtime.md`
- `docs/task-506-engineer-mobile-workbench-appointment-repository-contract-proposal-no-runtime.md`
- `docs/task-507-engineer-mobile-workbench-completion-submission-persistence-design-no-migration.md`
- `docs/task-508-engineer-mobile-workbench-repository-contract-integration-map-no-runtime.md`
- `docs/task-509-engineer-mobile-workbench-assignment-appointment-state-readiness-review-no-runtime.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/projections/EngineerMobileWorkbenchProjection.js`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`
- `src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator.js`
- `src/repositories/`

Task511 does not rename, create, patch, or normalize those references.

## Decision Packet Purpose

Task511 reviews whether Task502 through Task510 are enough to start a repository runtime implementation branch.

Purpose:

- determine which repositories, if any, are ready for future runtime work.
- identify repositories that remain blocked by schema, migration, fixture, audit, or permission gaps.
- prevent DB-backed repository implementation before schema inspection.
- prevent repository runtime from bypassing resolver / guard / projection / boundary layers.
- define guardrails for any later runtime branch.

This task does not implement runtime.

## Repository Readiness Matrix

| Repository | Contract source task | Intended responsibility | Current design readiness | DB schema dependency | Migration dependency | Test fixture dependency | Permission / organization scope dependency | Audit dependency | Runtime risk | Authorization recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `EngineerProfileRepository` | Task503 | resolve linked active engineer profile | contract ready | engineer profile / user linkage unknown | unknown | needed before runtime | authenticated platform user and organization scope | suspicious lookup audit later | identity leakage / cross-profile access | AUTHORIZED AFTER SCHEMA INSPECTION |
| `EngineerWorkbenchOrganizationScopeRepository` | Task504 | resolve valid organization scope | contract ready | organization status / scope fields unknown | unknown | needed before runtime | server-side identity, no client org override | cross-scope failures later | tenant leakage / plan reason leak | AUTHORIZED AFTER SCHEMA INSPECTION |
| `EngineerAssignmentRepository` | Task505 | verify engineer assignment | contract ready | assignment model unknown | unknown | needed before runtime | engineer profile + organization scope | denied assignment audit later | cross-engineer / cross-org access | AUTHORIZED AFTER SCHEMA INSPECTION |
| `EngineerWorkbenchAppointmentRepository` | Task506 | appointment detail / operation eligibility read | contract ready | appointment / dispatch visit model unknown | unknown | needed before runtime | assignment verification required first | operation-deny audit later | lookup by task id alone / PII overexposure | AUTHORIZED AFTER SCHEMA INSPECTION |
| `EngineerWorkbenchCompletionSubmissionRepository` | Task507 / Task510 | persist source-data only | design partial | likely needs new dedicated source-data table | likely requires future migration decision | needed before runtime | identity + org + assignment + eligibility + validation | source-data write audit later | duplicate submissions / FSR confusion | AUTHORIZED AFTER MIGRATION DECISION |

No repository is approved for runtime implementation by Task511.

## Runtime Prerequisite Checklist

| Prerequisite | Status |
| --- | --- |
| actual auth/session context source confirmed | partial |
| engineer profile table / linkage confirmed | blocked / future task required |
| organization table / status / scope confirmed | blocked / future task required |
| assignment model confirmed | blocked / future task required |
| appointment / dispatch visit model confirmed | blocked / future task required |
| completion submission source-data model decision confirmed | partial; Task510 recommends direction but no schema approval |
| migration decision packet completed | blocked / future task required |
| repository fixture plan completed | blocked / future task required |
| organization isolation test plan completed | blocked / future task required |
| safe-deny test plan completed | blocked / future task required |
| forbidden-field validation test plan completed | partial; design exists, runtime tests pending |
| audit / evidence logging strategy confirmed | partial / future task required |
| no provider / survey / billing trigger path confirmed | ready at design level, runtime tests pending |
| no AI approval path confirmed | ready at design level, runtime tests pending |

## Runtime Authorization Options

### Option A - Continue Docs-only Until Migration Decision

Description:

- Continue with docs-only readiness, fixture planning, and migration decision packets before runtime.

Benefits:

- lowest risk.
- preserves no-DB/no-migration pause.
- avoids implementing against unknown schema.
- allows test fixture and safe-deny plan before runtime.

Risks:

- delays usable runtime.
- may create more design documents before code.

Recommended when:

- schema is unknown.
- migration decision is not complete.
- repository fixtures and safe-deny tests are not planned.

Impact on current skeleton:

- no change; endpoints remain `501 Not Implemented`.

### Option B - Limited No-DB Repository Interface Skeleton

Description:

- Future task may add repository interface / placeholder only, without DB calls.

Benefits:

- can make boundaries explicit in code.
- can prepare dependency wiring without sensitive DB behavior.

Risks:

- can create false impression of runtime readiness.
- may become churn if schema later differs.
- still needs exact allowed files and tests if implemented.

Exact required guardrails if later approved:

- no DB import.
- no SQL.
- no persistence.
- no route behavior changes.
- endpoints must remain safe skeleton / 501 unless explicitly scoped.

Why this task does not implement it:

- Task511 explicitly forbids adding repository interface skeleton.

### Option C - DB-backed Repository Implementation After Schema Inspection

Description:

- Implement read-only DB-backed identity / organization / assignment / appointment repositories after schema inspection.

Benefits:

- starts real runtime path.
- can validate organization isolation and assignment checks.

Risks:

- high risk without exact schema, fixture plan, and safe-deny tests.
- can accidentally leak resources or personal data.
- may bypass existing skeleton boundaries if rushed.

Required preconditions:

- schema inspection.
- exact allowed files.
- test fixture plan.
- organization isolation tests.
- safe-deny tests.
- no provider / survey / billing / AI trigger checks.

Why this task does not implement it:

- DB schema is not inspected for this branch and runtime is not approved.

### Option D - Completion Submission Repository After Migration Decision

Description:

- Implement completion submission source-data persistence after a migration decision and schema approval.

Benefits:

- aligns with Task510 dedicated source-data table recommendation.
- supports idempotency and review workflow.

Risks:

- requires new schema or confirmed existing schema.
- can accidentally be treated as formal Field Service Report if guardrails fail.
- persistence and idempotency bugs can create duplicate source-data.

Required preconditions:

- migration decision packet.
- no-apply / apply approval as appropriate.
- repository contract.
- fixture and idempotency tests.
- audit / evidence strategy.

Relationship to Task510 recommendation:

- Task510 recommends a dedicated source-data table, but does not approve migration.

Why this task does not implement it:

- no migration, schema, repository, or runtime approval exists.

## Recommended Authorization Conclusion

DO NOT AUTHORIZE REPOSITORY RUNTIME YET.

Task511 itself does not approve runtime.

Task511 itself does not approve DB access.

Task511 itself does not approve migration.

Task511 itself does not approve repository implementation.

Any future runtime task still needs exact allowed files and separate PM approval.

Recommended next branch:

- continue with docs-only migration decision / fixture planning before runtime.

## Required Runtime Guardrails If Later Approved

If a future task authorizes repository runtime, it must follow these guardrails:

- every repository method must be organization-scoped.
- no global lookup.
- no client-selected organization.
- no client-selected engineerProfileId.
- no appointment lookup by taskId alone.
- no cross-organization fallback.
- no cross-engineer fallback.
- generic safe-deny for non-enumeration.
- projection must filter sensitive data.
- completion submission remains source-data.
- formal Field Service Report remains separate workflow.
- one Case ultimately has one formal Field Service Report.
- `finalAppointmentId` remains system-owned.
- no survey / provider / billing / settlement / AI approval trigger.
- photos / signatures / attachments use object storage references only.
- no raw binary in DB.

## Runtime Forbidden Shortcuts

Future runtime branch must not use these shortcuts:

- controller directly calling DB.
- resolver bypassing auth/session boundary.
- guard trusting client `organizationId`.
- projection fetching hidden data directly.
- appointment repository returning internal notes or billing data.
- completion submission repository creating formal Field Service Report.
- completion submission changing Case status.
- completion submission triggering provider / survey / billing.
- repository using LINE user id as global identity.
- repository returning different errors that enumerate existence.
- storing AI raw payload as official result.

## Open Blockers

Current blockers / unknowns:

- actual DB schema not inspected for this branch.
- no migration decision for completion submissions.
- no repository test fixture plan.
- no DB-backed auth/session bridge approved.
- no assignment schema confirmation.
- no appointment / dispatch visit schema confirmation.
- no audit runtime strategy.
- no object storage metadata convention confirmed.
- no idempotency persistence convention confirmed.
- no repository runtime allowed files approved.

## Future Sequencing

Future tasks, proposal only:

- Task512: Migration Decision Packet / No Apply.
- Task513: Repository Test Fixture Planning / No Runtime.
- Task514: Appointment State Transition Runtime Decision Packet / No Runtime.
- Task515: Completion Submission Repository Contract Proposal / No Runtime.
- Task516: Repository Runtime Limited Scope Proposal / No Runtime.

Task511 does not execute these tasks.

## Non-goals

Task511 does not:

- modify `src/`.
- modify `admin/src/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository classes.
- add repository interfaces.
- add service classes.
- add models.
- add SQL.
- add migrations.
- modify Migration020.
- execute DB / DDL / psql / migration / dry-run / apply.
- add or modify tests / fixtures / smoke tests.
- execute test / lint / smoke / browser / API commands.
- modify `package.json` or lock files.
- call LINE / SMS / Email / App providers.
- call AI / RAG / vector DB.
- use real personal data, token, secret, or `DATABASE_URL`.
- modify inventory docs.
- implement repository runtime.
- implement completion persistence runtime.
- implement appointment state transition runtime.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.
- turn the Task511 conclusion into current runtime approval.

## Verification Boundary

Task511 static verification should confirm:

- `git diff --check docs/task-511-engineer-mobile-workbench-repository-runtime-authorization-decision-packet-no-runtime.md` passes.
- Task511 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task511.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no database, no migration, no provider, and no AI runtime.
- this document explicitly states `Task511 itself does not approve runtime`.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task511.
