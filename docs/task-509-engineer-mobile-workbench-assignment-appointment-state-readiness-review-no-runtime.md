# Task 509 - Engineer Mobile Workbench Assignment and Appointment State Readiness Review

## Branch Status

Task509 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and readiness-review-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Review Purpose

Task509 reviews whether Task503 through Task508 provide enough design boundary for a later data model decision packet.

Review goals:

- confirm assignment lookup and appointment state eligibility are not mixed together.
- confirm completion submission source-data is not treated as formal Field Service Report.
- confirm operation paths do not become appointment mutation runtime prematurely.
- confirm repository runtime, DB schema, and migration remain unauthorized.
- identify remaining data model decisions before implementation.

Task509 does not authorize runtime, repository implementation, DB schema, migration, or API behavior changes.

## Readiness Checklist

| Area | Status | Supporting reference | Gap / risk | Recommended next action |
| --- | --- | --- | --- | --- |
| authenticated platform user context | partial | Task508 AuthSessionBoundary map | actual auth/session runtime is not implemented | future runtime authorization decision packet |
| engineer profile linkage | ready for next design step | Task503 | actual table/linkage status unknown | include in data model decision packet |
| organization scope | ready for next design step | Task504 | actual organization status/workbench fields unknown | include in data model decision packet |
| assignment verification | ready for next design step | Task505 | assignment table vs appointment field unknown | inspect schema later and decide model |
| appointment detail lookup | ready for next design step | Task506 | appointment/dispatch visit table relationship unknown | include in readiness/schema review |
| appointment operation eligibility | partial | Task497, Task506, Task508 | status enum/lifecycle not frozen | future appointment state transition decision packet |
| completion payload validation | ready for next design step | Task498, Task499 | real validator remains skeleton-only | runtime authorization later |
| completion submission source-data persistence | partial | Task507 | persistence entity and idempotency model undecided | Task510 data model decision packet |
| projection safe DTO visibility | ready for next design step | Task506, Task508 | runtime projection still skeleton-only | runtime authorization later |
| generic safe-deny / non-enumeration | ready for next design step | Task496, Task505, Task506, Task508 | response equivalence tests not implemented | future test fixture planning |

## Assignment vs Appointment State Separation Review

Assignment and appointment state must remain separate.

Rules:

- `EngineerAssignmentRepository` only answers whether the engineer has an assignment relationship to an appointment / dispatch visit.
- `EngineerWorkbenchAppointmentRepository` answers appointment detail and state eligibility after assignment is verified.
- assignment exists does not mean the appointment may be arrived / started / submitted.
- appointment state eligible does not mean Case completed.
- assignment lookup must not create or modify appointment state.
- appointment operation eligibility lookup must not directly mutate state.
- actual appointment state transition runtime still requires a future explicit task.

This separation is ready for the next design step, but not ready for runtime implementation.

## Operation Readiness Map

| Endpoint | Required repository contracts | Required boundary | State mutation later? | DB schema later? | Current readiness | Blockers before runtime | Forbidden shortcuts |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/v1/engineer/mobile-workbench/context` | EngineerProfileRepository, OrganizationScopeRepository | auth boundary, safe projection | no | yes / unknown | partial | real auth, profile linkage, org scope lookup | client-selected organization / engineer |
| `GET /api/v1/engineer/mobile-workbench/tasks` | EngineerProfileRepository, OrganizationScopeRepository, AssignmentRepository | assignment-scoped projection | no | yes / unknown | partial | assignment model and query design | global appointment search, phone/address lookup |
| `GET /api/v1/engineer/mobile-workbench/tasks/:taskId` | EngineerProfileRepository, OrganizationScopeRepository, AssignmentRepository, AppointmentRepository | assignment verification, mobile-safe DTO | no | yes / unknown | partial | appointment/detail schema and projection source | lookup by taskId alone |
| `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/arrived` | EngineerProfileRepository, OrganizationScopeRepository, AssignmentRepository, AppointmentRepository | eligibility guard | yes | yes / unknown | future task required | state transition decision and audit policy | mutating from assignment lookup |
| `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/started` | EngineerProfileRepository, OrganizationScopeRepository, AssignmentRepository, AppointmentRepository | eligibility guard | yes | yes / unknown | future task required | state transition decision and audit policy | mutating from eligibility read |
| `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/completion-submissions` | EngineerProfileRepository, OrganizationScopeRepository, AssignmentRepository, AppointmentRepository, future CompletionSubmissionRepository | payload validator, authority-field boundary | no for formal FSR; maybe source-data write later | yes / unknown | partial | completion source-data model and idempotency | treating submission as formal FSR |

## Appointment State Eligibility Review

Future arrived / started / completion-submission checks need appointment / dispatch visit state facts.

Proposal-only state concepts:

- scheduled / confirmed.
- assigned.
- en route / arrived.
- in progress / started.
- completed by engineer submission.
- waiting parts.
- quote needed.
- customer not available.
- cancelled.
- reassigned.
- no service possible.
- duplicate / superseded appointment.
- hidden / unconfirmed appointment.

Important limits:

- state names are proposal only.
- Task509 does not modify a state machine.
- Task509 does not add enum values.
- Task509 does not add DB fields.
- Task509 does not modify appointment runtime behavior.

The current design is sufficient for a next docs-only decision packet, but not sufficient for runtime state mutation.

## Completion Submission Readiness Review

Completion submission source-data persistence requires these preconditions:

- authenticated platform user.
- active engineer profile.
- valid organization scope.
- verified assignment.
- appointment detail visible.
- operation eligibility checked.
- payload validated.
- client authority fields rejected.
- file / photo / signature references are metadata only.
- idempotency / duplicate handling is designed.
- exception cases have a future admin / supervisor review path.

Completion source-data boundary:

- source-data is not formal Field Service Report.
- multiple completion submissions do not equal multiple formal Field Service Reports.
- formal Field Service Report creation / approval / publishing remains a future workflow.
- completion submission does not trigger survey.
- completion submission does not trigger provider sending.
- completion submission does not trigger billing / settlement.
- completion submission does not trigger AI approval.

## Data Model Decision Readiness

| Question | Current status | Decision note |
| --- | --- | --- |
| engineer profile table exists? | unknown | must inspect DB schema later |
| user to engineer linkage exists? | unknown | must inspect DB schema later |
| organization status / workbench enabled fields exist? | unknown | requires schema inspection and possible decision packet |
| assignment independent table vs appointment field? | unknown | requires data model decision later |
| appointment and dispatch visit same or separate tables? | unknown | must inspect schema later |
| appointment status / dispatch visit status current fields? | unknown | must inspect schema later |
| completion submission source-data needs a new table? | unknown | likely requires Task510 decision packet |
| idempotency key needs a new field? | unknown | likely requires Task510 decision packet |
| object storage refs representation? | unknown | requires future file/object storage design alignment |
| soft delete / audit / created_by / updated_by strategy? | unknown | requires data model decision later |
| organization_id index needs? | unknown | requires schema inspection and migration decision later |
| cross-organization contractor engineer Phase 1 support? | not needed for Phase 1 unless PM expands scope | keep Phase 1 single resolved organization unless later decided |

Task509 does not decide table names, fields, indexes, enums, or migration schema.

## Risk Register

| Risk | Impact | Current mitigation from Task503-508 | Remaining gap | Future action |
| --- | --- | --- | --- | --- |
| assignment and appointment state are mixed | engineer could perform operations just because assigned | Task505 and Task506 separate assignment vs eligibility | runtime guard not implemented | state readiness / runtime decision packet |
| engineer can see another engineer's appointment | privacy and operational leakage | Task505 requires engineerProfileId + organization scope | repository not implemented | future assignment tests |
| client-supplied organization / engineerProfileId trusted | cross-tenant or cross-engineer access | Task503-505 reject client authority | real auth not implemented | runtime authorization packet |
| appointment lookup by taskId alone | resource enumeration | Task506 and Task508 forbid direct lookup | runtime not implemented | future safe-deny tests |
| completion submission treated as formal FSR | breaks one Case / one formal report | Task507 defines source-data only | persistence not implemented | data model decision packet |
| multiple submissions create multiple formal FSRs | violates core invariant | Task507 and Task508 preserve FSR separation | formal workflow not designed here | future formal FSR workflow decision |
| operation eligibility lookup mutates state | hidden runtime side effects | Task506 and Task508 define read-only eligibility | state transition runtime not scoped | Task514 decision packet |
| customer PII overexposed | privacy and security risk | Task506/508 mobile-safe DTO visibility boundary | projection runtime not implemented | projection tests and masking policy |
| provider / survey / billing trigger accidentally wired | duplicate or premature external effects | Task497/507/508 explicitly forbid triggers | runtime integration not implemented | future no-send tests |
| AI normalized draft treated as official result | AI auto-decision risk | Task507 keeps AI output draft/human-confirmed | AI not implemented | AI governance and review workflow |
| future migration implemented without decision packet | schema drift / unsafe DDL | Task502-509 keep no-migration boundary | migration packet pending | Task510/512 before schema changes |

## Readiness Conclusion

READY FOR NEXT DESIGN STEP.

This means only:

- the branch may proceed to another docs-only design / decision packet.
- Task503 through Task508 provide enough conceptual separation to discuss data model decisions.

This does not mean:

- runtime approval.
- repository implementation approval.
- DB / migration approval.
- test fixture implementation approval.
- API behavior change approval.
- appointment state mutation approval.
- completion persistence approval.

Recommended next action:

- proceed to `Task510: Completion Submission Data Model Decision Packet / No Migration`, still docs-only.

## Future Sequencing

Future tasks, proposal only:

- Task510: Completion Submission Data Model Decision Packet / No Migration.
- Task511: Repository Runtime Authorization Decision Packet / No Runtime.
- Task512: Migration Decision Packet / No Apply.
- Task513: Repository Test Fixture Planning / No Runtime.
- Task514: Appointment State Transition Runtime Decision Packet / No Runtime.

Task509 does not execute these tasks.

## Non-goals

Task509 does not:

- modify `src/`.
- modify `admin/src/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository classes.
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
- implement assignment permission runtime.
- implement appointment visibility runtime.
- implement appointment state transition runtime.
- implement completion persistence runtime.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.
- decide formal table names, fields, indexes, enums, or migration schema.

## Verification Boundary

Task509 static verification should confirm:

- `git diff --check docs/task-509-engineer-mobile-workbench-assignment-appointment-state-readiness-review-no-runtime.md` passes.
- Task509 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task509.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no database, no migration, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task509.
