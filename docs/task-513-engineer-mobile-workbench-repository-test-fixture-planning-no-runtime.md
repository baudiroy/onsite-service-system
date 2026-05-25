# Task 513 - Engineer Mobile Workbench Repository Test Fixture Planning

## Branch Status

Task513 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and test-fixture-planning-only.

There is no runtime, no repository implementation, no service implementation, no SQL, no DB command, no DDL, no migration, no migration dry-run, no migration apply, no test file creation, no fixture file creation, no test execution, no provider sending, and no AI/RAG/vector database.

Task513 does not approve repository runtime.

Task513 does not approve DB access.

Task513 does not approve migration.

Task513 does not approve fixture or test file creation.

Current Engineer Mobile Workbench runtime remains skeleton-only and current endpoints still return `501 Not Implemented`.

## Reference Handling

Task513 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-508-engineer-mobile-workbench-repository-contract-integration-map-no-runtime.md`
- `docs/task-509-engineer-mobile-workbench-assignment-appointment-state-readiness-review-no-runtime.md`
- `docs/task-510-engineer-mobile-workbench-completion-submission-data-model-decision-packet-no-migration.md`
- `docs/task-511-engineer-mobile-workbench-repository-runtime-authorization-decision-packet-no-runtime.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`

Task513 does not create, rename, patch, normalize, or execute those references.

## Planning Purpose

This document plans future synthetic fixtures and test cases needed if an Engineer Mobile Workbench repository runtime branch is later approved.

Purpose:

- plan future repository runtime synthetic fixtures.
- plan organization isolation scenarios.
- plan assignment verification scenarios.
- plan appointment visibility scenarios.
- plan safe-deny scenarios.
- plan completion submission source-data scenarios.
- avoid future tests using real personal data, real LINE ids, real addresses, real tokens, real provider payloads, or real `DATABASE_URL`.
- provide preparation material for future repository runtime, schema inspection, and migration decision tasks.

This document does not authorize adding fixture code, adding test code, executing tests, inspecting DB schema, or implementing repository runtime.

## Fixture Principles

Future fixtures must follow these principles:

- fixtures must be synthetic-only.
- no real customer personal data.
- no real engineer personal data.
- no real phone number.
- no real address.
- no real LINE user id.
- no token, secret, access token, channel secret, webhook secret, binding token, or `DATABASE_URL`.
- no provider payload.
- no AI raw payload.
- no billing / settlement internal data.
- no raw file, raw photo, or raw signature binary.
- organization isolation must be represented explicitly.
- cross-organization data must be impossible to accidentally pass as valid.
- fixture ids should be stable fake ids, not production-like secrets.
- sensitive fields should be masked, synthetic, or omitted unless explicitly needed for a safe-deny assertion.

## Fixture Entity Map

| Entity | Purpose | Minimum fields proposal | Sensitive fields forbidden | Organization scope requirement | Relationship to other entities | Needed for Phase 1 repository tests? |
| --- | --- | --- | --- | --- | --- | --- |
| organizations | model tenant boundaries and active/inactive scope | fake id, status, display label | real tenant name, billing data, secrets | required | owns users, engineer profiles, cases, assignments, appointments | yes |
| platform users | model authenticated identities | fake user id, role label, active flag | real email, real phone, real password hash | via membership / server-side context | linked to engineer profile and organization scope | yes |
| engineer profiles | represent field engineer identity | fake engineer profile id, user link, active flag | real name, phone, address, payroll data | required | linked to platform user and assignments | yes |
| engineer profile linkage | verify user-to-engineer relationship | fake user id, fake engineer profile id, link status | real identity provider ids | required | bridges auth session to engineer profile | yes |
| assignments | verify task ownership | fake assignment id, appointment id, engineer profile id, status | internal scheduling notes | required | links engineer to appointment / dispatch visit | yes |
| appointments | verify visible task and operation state | fake appointment id, case id, appointment status, visit result placeholder, scheduled window | real customer address, real contact data, internal note | required | belongs to case and may have assignment | yes |
| dispatch visits | preserve optional visit-layer distinction | fake visit id, appointment id, state | real route details, internal dispatch comments | required if model exists | may link appointment to visit-level workflow | optional / schema dependent |
| cases | preserve one Case / one formal report invariant | fake case id, status, product category placeholder | real customer problem text, phone, address | required | owns appointments and future formal report | yes |
| completion submissions source-data | future source-data persistence | fake submission id, case id, appointment id, engineer profile id, lifecycle status, metadata refs | raw binary, formal approval decision, AI raw payload | required | source-data only, separate from formal FSR | yes, after migration decision |
| object storage refs metadata | represent future photo/signature refs safely | fake object ref id, media type, checksum placeholder, relation target | raw file bytes, signed URL, real storage path with secrets | required | linked from completion submission as metadata only | yes, proposal only |
| forbidden payload examples | assert client cannot pass authority fields | fake payload key names and harmless fake values | real ids, real personal data, provider payload | required where relevant | used for validator / boundary safe-deny cases | yes |
| safe-deny cases | assert non-leaking failure behavior | scenario id, internal reason label, expected external style | real resource ids or personal data | required | spans auth, org scope, assignment, appointment, payload | yes |

## Positive Test Scenario Planning

These are future test scenarios only. Task513 does not create tests.

| Scenario | Fixture setup needed | Expected safe output | Forbidden output | Repository contracts involved | Future test type |
| --- | --- | --- | --- | --- | --- |
| authenticated engineer can resolve own profile | active platform user linked to active engineer profile | minimal engineer identity DTO | real phone, full profile internals, cross-org memberships | `EngineerProfileRepository` | unit / repository |
| engineer profile resolves organization scope | active engineer profile in active organization | server-side organization scope context | client-selected organization override reason | `EngineerProfileRepository`, `EngineerWorkbenchOrganizationScopeRepository` | unit / repository |
| engineer can list only own assigned tasks | org A engineer with own assignment plus unrelated org/engineer tasks | assigned task summary allow-list | other engineer tasks, other org tasks, full customer PII | `EngineerAssignmentRepository`, `EngineerWorkbenchAppointmentRepository`, projection | repository / integration |
| engineer can view own assigned appointment detail | visible assigned appointment | appointment detail allow-list | internal note, audit log, billing data, raw LINE identity | assignment + appointment repositories, projection | repository / integration |
| engineer can check arrived eligibility for assigned visible appointment | assigned appointment in eligible pre-arrival state | eligibility true / reason key | route internals, private scheduling notes | appointment repository | unit / repository |
| engineer can check started eligibility after arrived state proposal | assigned appointment in arrived-like state | eligibility true / reason key | hidden state machine internals | appointment repository | unit / repository |
| engineer can submit completion source-data only after checks | auth, engineer profile, org, assignment, appointment eligibility, valid payload | accepted source-data response proposal | formal FSR, case completed, finalAppointmentId chosen by client | validator, boundary, future submission repository | integration / repository |
| completion submission stores metadata refs only | valid payload with fake photo/signature refs | metadata reference summary | raw file bytes, signed URL, binary signature | boundary, future submission repository | repository |
| completion submission does not create formal FSR | valid source-data submission | source-data lifecycle only | formal report id as created artifact | future submission repository, future FSR workflow guard | integration |
| completion submission does not trigger survey / provider / billing / AI | valid source-data submission | no-send / no-trigger assertion proposal | provider payload, survey intent, billing event, AI approval | boundary, future submission repository | integration / smoke later |

## Negative / Safe-deny Scenario Planning

These are future safe-deny scenarios only. Task513 does not create tests.

| Scenario | Internal reason proposal | External safe-deny style | What must not be leaked | Fixture setup needed | Future assertion focus |
| --- | --- | --- | --- | --- | --- |
| unauthenticated request | missing auth session | generic unauthorized | whether resource exists | no session | 401 / safe envelope |
| authenticated user without engineer profile | no active engineer link | generic forbidden or not available | profile lookup details | user without profile | no engineer internals |
| inactive engineer profile | engineer profile inactive | generic forbidden | inactive reason details if sensitive | inactive profile | no profile state leak beyond safe code |
| organization inactive / suspended / deleted | organization not usable | generic unavailable / forbidden | tenant operational details | inactive org | no plan or suspension detail leak |
| organization mismatch | user/org/resource mismatch | generic not found / forbidden | other org existence | org A user, org B resource | no enumeration |
| appointment assigned to another engineer | assignment mismatch | generic not found / forbidden | assigned engineer identity | two engineers same org | no other engineer PII |
| appointment belongs to another organization | tenant mismatch | generic not found / forbidden | org B appointment existence | org A and org B appointment | cross-org isolation |
| appointment hidden / unconfirmed | appointment not visible to engineer | generic unavailable | hidden scheduling reason | hidden appointment | safe deny |
| appointment cancelled / reassigned | appointment no longer actionable | generic unavailable | reassigned engineer identity | cancelled/reassigned fixture | no PII / no old assignment leak |
| appointment state ineligible for arrived | invalid state transition | safe operation-denied reason key | internal state details | non-eligible state | no mutation |
| appointment state ineligible for started | invalid state transition | safe operation-denied reason key | internal state details | non-arrived state | no mutation |
| completion payload invalid | validator failure | safe validation error keys | raw submitted sensitive values | malformed payload | allowed error shape |
| forbidden client authority fields present | client tries to control server state | safe validation error keys | accepted authority values | payload with forbidden keys | field rejection |
| client tries to pass organizationId | client-selected tenant scope | safe validation error | whether org id exists | forbidden key payload | server-side org only |
| client tries to pass engineerProfileId | client-selected engineer scope | safe validation error | engineer id existence | forbidden key payload | server-side engineer only |
| client tries to pass finalAppointmentId | client tries final marker authority | safe validation error | appointment existence | forbidden key payload | system-owned finalAppointmentId |
| client tries to mark Case completed | client tries formal workflow | safe validation error | case state details | forbidden key payload | no Case mutation |
| client tries to create formal FSR | client tries formal report creation | safe validation error | report state details | forbidden key payload | no FSR creation |
| client tries to include raw binary or provider/AI payload | forbidden sensitive payload | safe validation error | binary, provider, AI content | forbidden payload sample | reject raw/unsafe data |

## Organization Isolation Test Plan

Future organization isolation coverage should include:

- org A engineer cannot see org B appointment.
- org A engineer cannot infer org B appointment exists.
- org A assignment cannot be resolved with org B scope.
- the same fake phone or fake address in different organizations must not collapse identity.
- LINE identity must not be treated as a global identity.
- client-selected organization override must be ignored or rejected.
- repository methods must always receive server-side organization scope.
- safe-deny output must not reveal whether a cross-organization resource exists.
- fixture data must include at least two organizations with overlapping fake labels to catch accidental global matching.

## Completion Submission Fixture Planning

Future completion submission source-data fixtures should cover:

| Fixture scenario | Purpose | Required assertions |
| --- | --- | --- |
| valid minimal completion submission | establish happy path for source-data only | source-data accepted; no formal FSR; no Case completed |
| completion submission with photo metadata refs | ensure metadata refs are accepted without binary | refs stored as metadata proposal; no raw bytes |
| completion submission with signature exception | model no-signature workflow | exception reason/evidence captured; not customer consent |
| completion submission needing review | preserve human review path | status proposal does not mutate appointment or report |
| superseded submission proposal | preserve traceability after resubmission | old source-data remains traceable |
| duplicate `clientRequestId` proposal | weak-network retry dedupe | no duplicate source-data side effect |
| weak network retry proposal | retry-safe behavior | stable idempotency response proposal |
| forbidden raw binary submission | prevent DB/file payload leakage | validation rejects raw file/photo/signature binary |
| forbidden `finalAppointmentId` / `caseCompleted` / `formalFSR` fields | prevent client authority over formal workflow | validation rejects forbidden authority fields |

Required guardrails:

- completion submission is source-data only.
- completion submission is not formal Field Service Report.
- completion submission is not Case completed.
- completion submission does not trigger survey / provider / billing / settlement / AI approval.
- multiple submissions must not create multiple formal Field Service Reports.

## Assertion Strategy

Future assertions should cover:

- exact allowed DTO keys.
- forbidden DTO keys.
- generic safe-deny message shape.
- no resource enumeration.
- no full customer personal data.
- no internal note.
- no audit log.
- no AI raw payload.
- no provider payload.
- no billing / settlement data.
- no raw binary.
- no cross-organization record leakage.
- no Case mutation unless a future task explicitly authorizes it.
- no Appointment mutation unless a future task explicitly authorizes it.
- no Field Service Report mutation unless a future task explicitly authorizes it.
- no formal completion, survey, provider, billing, settlement, or AI approval side effect from source-data submission.

## Test Boundary By Layer

| Layer | Fixture needed? | Unit test needed? | Repository / integration test needed later? | Smoke / API test needed later? | DB needed? | Current Task513 action |
| --- | --- | --- | --- | --- | --- | --- |
| `AuthSessionBoundary` | yes, synthetic request context | yes | no / later auth bridge tests | later | no for unit | plan only |
| `EngineerProfileRepository` | yes, user/profile linkage | yes | yes | later | yes for repository | plan only |
| `EngineerWorkbenchOrganizationScopeRepository` | yes, active/inactive orgs | yes | yes | later | yes for repository | plan only |
| `EngineerAssignmentRepository` | yes, assigned/unassigned tasks | yes | yes | later | yes for repository | plan only |
| `EngineerWorkbenchAppointmentRepository` | yes, appointment states and visibility | yes | yes | later | yes for repository | plan only |
| `EngineerMobileWorkbenchProjection` | yes, source records with sensitive fields | yes | no / with repository data later | later | no for pure projection | plan only |
| `CompletionSubmissionValidator` | yes, valid and forbidden payloads | yes | no | later | no | plan only |
| `CompletionSubmissionBoundary` | yes, validated payload and eligibility context | yes | yes later | later | no for boundary unit | plan only |
| Future `CompletionSubmissionRepository` | yes, source-data lifecycle and idempotency | yes after contract | yes | later | yes after migration decision | plan only |
| Future Field Service Report workflow | yes, formal report invariant scenarios | yes after runtime decision | yes | yes | likely | plan only |

## Runtime / DB Readiness Caveat

Task513 does not approve repository runtime.

Task513 does not approve DB access.

Task513 does not approve migration.

Task513 does not approve fixture file creation.

Task513 does not approve test file creation.

Task513 does not approve test execution.

Future fixture/test implementation requires a separate PM-approved task with exact allowed files.

Repository DB-backed tests require schema inspection / migration decision first.

## Future Sequencing

Future tasks, proposal only:

- Task514: Appointment State Transition Runtime Decision Packet / No Runtime.
- Task515: Completion Submission Repository Contract Proposal / No Runtime.
- Task516: Schema Inspection Planning / No DB Command.
- Task517: Migration Draft Authorization Packet / No Apply.
- Task518: Synthetic Repository Fixture File Touch Plan / No Runtime.

Task513 does not execute these tasks.

## Non-goals

Task513 does not:

- modify `src/`.
- modify `admin/src/`.
- add or modify `fixtures/`.
- add or modify `tests/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository classes.
- add repository interfaces.
- add service classes.
- add models.
- add SQL.
- add migrations.
- modify Migration020.
- execute DB / DDL / psql / migration / dry-run / apply.
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
- write real or suspected-real customer data to docs.

## Fixture / Test Planning Conclusion

Task513 conclusion: READY FOR FUTURE SYNTHETIC FIXTURE FILE TOUCH PLAN — NO RUNTIME.

The fixture plan is ready for future PM review, but no fixture file, test file, DB-backed test, migration, repository runtime, or runtime behavior is approved by this task.

## Verification Boundary

Task513 static verification should confirm:

- `git diff --check docs/task-513-engineer-mobile-workbench-repository-test-fixture-planning-no-runtime.md` passes.
- Task513 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task513.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no migration, no fixture file creation, no test file creation, no test execution, no provider, and no AI runtime.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task513.
