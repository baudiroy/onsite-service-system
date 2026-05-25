# Task 508 - Engineer Mobile Workbench Repository Contract Integration Map

## Branch Status

Task508 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no database command, no DDL, no migration, no test execution, no provider sending, and no AI/RAG/vector database.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Integration Purpose

Task508 integrates Task503 through Task507 contract proposals into a single future data-flow map.

Purpose:

- define future runtime wiring order before implementation is authorized.
- confirm responsibility boundaries for each layer.
- prevent resolver / guard / projection / boundary code from bypassing required repository contracts.
- keep identity, organization scope, assignment, appointment detail, projection, validation, and persistence responsibilities separate.
- prepare for a future repository runtime authorization decision packet.

Task508 does not authorize runtime implementation.

## End-to-end Conceptual Flow

Proposal flow only:

1. Request enters an Engineer Mobile Workbench endpoint.
2. `AuthSessionBoundary` resolves authenticated platform user context.
3. `EngineerProfileRepository` resolves linked active engineer profile.
4. `EngineerWorkbenchOrganizationScopeRepository` resolves valid organization scope.
5. `EngineerAssignmentRepository` verifies engineer assignment for list / detail / operation.
6. `EngineerWorkbenchAppointmentRepository` fetches appointment detail / operation eligibility.
7. `EngineerMobileWorkbenchProjection` creates mobile-safe DTO.
8. `CompletionSubmissionValidator` validates completion payload.
9. `CompletionSubmissionBoundary` rejects client authority fields.
10. Future `CompletionSubmissionRepository` persists source-data only.
11. Formal Field Service Report remains a separate future workflow.

This flow is proposal-only and not current runtime behavior.

## Responsibility Matrix

| Layer | Responsibility | Trusted inputs | Untrusted inputs | Allowed output | Forbidden output | May read DB later? | May write DB later? | May mutate Case / Appointment / FSR? | Audit requirement later | Task508 implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AuthSessionBoundary` | Resolve authenticated platform user context | server auth/session context | client identity claims | platform user context | raw credentials, token/secret, unrelated memberships | maybe | no | no | denied / suspicious auth may audit | proposal only, no runtime |
| `EngineerProfileRepository` | Resolve linked active engineer profile | platform user context, organization candidate | client engineer id | minimal engineer identity context | password hash, token/secret, full audit, customer PII | yes | no | no | suspicious profile failures may audit | proposal only, no repository |
| `EngineerWorkbenchOrganizationScopeRepository` | Resolve active organization scope | engineer profile context, server-side org context | client organization override | minimal organization scope context | billing internals, subscription internals, cross-org data | yes | no | no | cross-scope failures may audit | proposal only, no repository |
| `EngineerAssignmentRepository` | Verify engineer assignment to appointment / dispatch visit | engineer profile, organization scope | task id / appointment id from path | minimal assignment context | unrelated assignments, cross-org assignments, full appointment detail | yes | no | no | denied assignment attempts may audit | proposal only, no repository |
| `EngineerWorkbenchAppointmentRepository` | Read appointment detail / operation eligibility after assignment verification | assignment verification, organization scope | appointment status override, client projection expansion | minimal appointment detail / eligibility source | internal notes, audit log, billing/settlement, AI raw payload | yes | no | no | operation deny may audit | proposal only, no repository |
| `EngineerMobileWorkbenchProjection` | Create mobile-safe DTO | validated source data | client-selected fields | minimal task/context DTO | internal note, audit log, AI raw payload, billing/settlement internals | no | no | no | future sensitive projection access may audit | existing skeleton only |
| `CompletionSubmissionValidator` | Validate completion payload shape and forbidden fields | route context, allowed schema | completion body payload | validation result proposal | hidden authority acceptance, raw binary acceptance | no | no | no | invalid / forbidden field attempts may audit | skeleton only / not authoritative runtime |
| `CompletionSubmissionBoundary` | Reject client authority fields and keep completion source-data separate from formal completion | server context, validator output | client finalAppointmentId / status / authority fields | safe boundary result proposal | formal FSR, Case completion, survey trigger | no | no | no | forbidden authority attempts may audit | skeleton only / no persistence |
| Future `CompletionSubmissionRepository` | Persist validated source-data only | identity, organization, assignment, eligibility, validation | raw client authority | source submission record proposal | formal FSR, raw binary, AI raw payload, billing internals | yes | yes, if future task authorizes | no | source-data writes should audit later | not implemented |
| Future Field Service Report workflow | Convert reviewed source-data into formal Case-level report if authorized | backend/system workflow, review decisions | raw engineer client authority | formal report workflow result | multiple formal FSRs per Case, engineer-chosen finalAppointmentId | yes | yes, if future task authorizes | yes, only in future formal workflow | formal completion must audit | separate future workflow |

## Read Path Integration

### `GET /context`

Required prior context:

- authenticated platform user context.

Repository sequence proposal:

1. `AuthSessionBoundary`
2. `EngineerProfileRepository`
3. `EngineerWorkbenchOrganizationScopeRepository`
4. `EngineerMobileWorkbenchProjection`

Projection boundary:

- return minimal workbench context.
- do not expose unrelated organization membership, billing details, subscription internals, raw provider identity, or AI raw payload.

Safe-deny behavior:

- unauthenticated, no engineer profile, inactive organization, or mismatched scope should become generic safe-deny.

Forbidden shortcuts:

- client-selected organization.
- client-selected engineer profile.
- global LINE identity lookup.

### `GET /tasks`

Required prior context:

- authenticated platform user.
- linked active engineer profile.
- valid organization scope.

Repository sequence proposal:

1. `AuthSessionBoundary`
2. `EngineerProfileRepository`
3. `EngineerWorkbenchOrganizationScopeRepository`
4. `EngineerAssignmentRepository.listAssignedAppointmentsForEngineer(...)`
5. `EngineerMobileWorkbenchProjection`

Projection boundary:

- return minimal task schedule, status, and workbench-needed summary only.

Safe-deny behavior:

- unavailable identity / scope should safe-deny.
- no assigned tasks can return an empty safe list without revealing hidden tasks.

Forbidden shortcuts:

- global appointment search.
- customer phone / address search.
- client-selected engineer profile.
- client-selected organization.
- returning internal notes / audit / AI raw payload / billing settlement data.

### `GET /tasks/:taskId`

Required prior context:

- authenticated platform user.
- linked active engineer profile.
- valid organization scope.
- verified assignment relationship.

Repository sequence proposal:

1. `AuthSessionBoundary`
2. `EngineerProfileRepository`
3. `EngineerWorkbenchOrganizationScopeRepository`
4. `EngineerAssignmentRepository.findAssignedAppointmentForEngineer(...)`
5. `EngineerWorkbenchAppointmentRepository.findWorkbenchAppointmentDetail(...)`
6. `EngineerMobileWorkbenchProjection`

Projection boundary:

- return mobile-safe appointment detail only.
- expose minimum necessary address, contact, product, issue, schedule, and operation status.

Safe-deny behavior:

- appointment not found, assigned to another engineer, hidden, or cross-organization should be externally equivalent.

Forbidden shortcuts:

- appointment lookup by task id alone.
- direct appointment detail lookup before assignment verification.
- global appointment search.
- client-selected organization.
- client-selected engineer profile.
- returning internal notes / audit / AI raw payload / billing settlement data.

## Operation Path Integration

### `POST /tasks/:taskId/arrived`

Required checks:

- authenticated platform user.
- linked active engineer profile.
- valid organization scope.
- assignment verification.
- appointment operation eligibility lookup.

Design boundary:

- operation eligibility lookup is read-only in this design.
- actual state mutation remains a future explicit runtime task.
- no formal Field Service Report creation.
- no survey / provider / billing / settlement / AI approval trigger.

### `POST /tasks/:taskId/started`

Required checks:

- authenticated platform user.
- linked active engineer profile.
- valid organization scope.
- assignment verification.
- appointment operation eligibility lookup.

Design boundary:

- start eligibility does not mutate state in Task508.
- actual appointment state transition remains a future explicit runtime task.
- no Case completion or formal Field Service Report workflow.

### `POST /tasks/:taskId/completion-submissions`

Required checks:

- authenticated platform user.
- linked active engineer profile.
- valid organization scope.
- assignment verification.
- appointment operation eligibility lookup.
- completion payload validation.
- client authority field rejection.

Design boundary:

- future persistence remains source-data only.
- formal Field Service Report creation remains a separate future workflow.
- completion submission does not mean Case completed.
- completion submission does not trigger survey.
- completion submission does not trigger provider sending.
- completion submission does not trigger billing / settlement.
- completion submission does not trigger AI approval.

## Guardrail Invariants

Task508 preserves these invariants:

- engineer operations stay at appointment / dispatch visit layer.
- one Case can have multiple appointments / dispatch visits.
- one Case ultimately has only one formal Field Service Report.
- multiple completion submissions do not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission does not mean Case completed.
- completion submission does not trigger survey / provider sending / billing / settlement / AI approval.

## Safe-deny And Non-enumeration Map

| Failure case | Internal reason proposal | External response style proposal | Generic safe-deny? | Internal audit/log later? | Must not leak |
| --- | --- | --- | --- | --- | --- |
| unauthenticated | no valid auth session | generic unauthenticated / denied | yes | maybe | account existence, token details |
| authenticated but no engineer profile | no active linked profile | generic workbench unavailable / denied | yes | maybe | user exists but is not engineer |
| engineer profile inactive | inactive / disabled profile | generic denied | yes | yes if suspicious | profile status details |
| organization unresolved | no safe org scope | generic denied | yes | maybe | available organizations |
| organization inactive / suspended / deleted | org unavailable | generic denied | yes | yes | org exists or plan/status reason |
| organization mismatch | profile and request scope mismatch | generic denied | yes | yes | other organization existence |
| appointment not found | no scoped assignment/detail found | generic not found / denied | yes | maybe | whether id exists |
| appointment assigned to another engineer | assignment mismatch | generic not found / denied | yes | yes if suspicious | assigned engineer identity |
| appointment in another organization | cross-org task id | generic not found / denied | yes | yes | other tenant existence |
| appointment hidden / unconfirmed | not visible to engineer | generic denied | yes | maybe | hidden suggestion or dispatch state |
| appointment state ineligible | terminal / invalid state | safe operation-denied | maybe | maybe | internal transition rules beyond need |
| completion payload invalid | malformed / missing / invalid fields | safe validation error | no, if own form error | maybe | resource existence or internal policy details |
| forbidden client authority fields present | client tried server-owned fields | safe validation / denied | maybe | yes | finalAppointmentId authority, status internals |

External response should avoid resource enumeration and avoid revealing whether Case, appointment, customer, organization, or assignment exists outside the engineer's allowed scope.

## Sensitive Data Visibility Map

Mobile-safe DTO may include:

- minimal task schedule.
- minimal service address.
- minimal on-site contact.
- product summary.
- reported issue summary.
- appointment status relevant to engineer.
- operation eligibility summary.

Mobile-safe DTO must not include:

- internal note.
- audit log.
- AI raw payload.
- provider raw payload.
- billing / settlement internal data.
- customer channel identity internals.
- full customer personal data beyond workbench need.
- hidden appointment suggestions.
- unconfirmed AI dispatch suggestions.
- Field Service Report internal draft details.
- raw photo / signature binary.
- token / secret / `DATABASE_URL`.

## Runtime Readiness Gaps

The following remain unauthorized and unimplemented:

- actual auth/session runtime.
- real engineer identity lookup.
- real organization scope lookup.
- real assignment lookup.
- real appointment projection data.
- appointment state transition runtime.
- completion submission persistence runtime.
- formal Field Service Report workflow.
- DB schema / migration.
- tests / fixtures for repository runtime.
- audit runtime.
- provider sending.
- AI/RAG/vector DB.
- mobile UI / PWA.

## Future Sequencing

Future tasks, proposal only:

- Task509: Assignment and Appointment State Readiness Review / No Runtime.
- Task510: Completion Submission Data Model Decision Packet / No Migration.
- Task511: Repository Runtime Authorization Decision Packet / No Runtime.
- Task512: Migration Decision Packet / No Apply.
- Task513: Repository Test Fixture Planning / No Runtime.

Task508 does not execute these tasks.

## Non-goals

Task508 does not:

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
- implement appointment visibility runtime.
- implement appointment state transition runtime.
- implement completion persistence runtime.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.

## Verification Boundary

Task508 static verification should confirm:

- `git diff --check docs/task-508-engineer-mobile-workbench-repository-contract-integration-map-no-runtime.md` passes.
- Task508 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task508.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no database, no migration, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task508.
