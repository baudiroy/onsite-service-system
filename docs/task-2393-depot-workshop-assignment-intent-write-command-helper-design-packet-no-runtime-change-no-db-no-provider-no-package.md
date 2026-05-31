# Task2393 Depot Workshop Assignment Intent Write Command Helper Design Packet

## Scope

Task2393 defines the design for a future pure Depot / Workshop assignment-intent write command/helper.

This is a docs/static-only design packet. It does not implement the helper, enable route write scope, change runtime/source behavior, add repository/DB behavior, create migrations, send providers, add packages, run smoke tests, start servers, inspect env/secrets, deploy, or touch staging/prod traffic.

## Current Boundary

The current accepted boundary remains:

- route path remains `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- permission remains `depot.repair.prepare`
- route remains prepare-only
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `WorkshopAssignmentService.prepareAssignmentIntent` remains the accepted prepare boundary
- service returns `written: false`
- `assignmentIntent.writeRequired` remains `false`
- presenter remains wired through `successBody(result, req = {})`
- presenter exposes only admin-safe allowlisted summaries under `data.depotRepair`

## Future Helper Identity

Suggested future helper:

- helper name: `buildDepotWorkshopAssignmentIntentWriteCommand(input)`
- future file: `src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js`
- exact write action name: `depot_workshop.assignment_intent.write`

Task2393 does not add this file and does not implement this helper.

## Accepted Future Input

The future helper should accept a prepared assignment intent produced by the accepted prepare boundary, plus trusted execution scope.

Accepted prepared intent source:

- `WorkshopAssignmentService.prepareAssignmentIntent` result with `ok: true`
- `assignmentIntent` that remains prepare-only before the write command is built
- presenter-compatible fields only

Trusted scope requirements:

- `organizationId`
- `caseId`
- `depotIntakeId` or `repairOrderId`
- actor/permission context
- `brandId` scope when present
- `serviceProviderId` scope when present
- `subcontractorOrganizationId` and explicit subcontractor assignment scope when present
- `requestId` or equivalent correlation id when available

The helper must not accept raw request bodies, raw DB rows, provider payloads, env/secrets, SQL, stack traces, raw customer contact/address/signature/photo/private fields, billing payloads, AI/RAG payloads, formal report payloads, or final appointment payloads.

## Required Future Validation

The future helper must fail closed unless all relevant checks pass:

- missing trusted organization/case/source fails closed
- malformed prepared intent fails closed
- missing permission/write authorization fails closed
- subcontractor scope mismatch fails closed
- invalid transition fails closed
- forbidden fields fail closed or are stripped before command output
- organization, tenant, brand, service-provider, and subcontractor scope are enforced before command output
- transition validation uses the accepted repair order transition policy
- audit intent handling uses the accepted audit helper
- customer projection handling uses the accepted projection helper and remains allowlisted
- presenter compatibility is preserved for any command preview or response handoff

## Future Command Output Shape

The future helper should return a safe command envelope only:

- `ok`
- `status`
- `reasonCode`
- `action`
- `command`
- `auditIntent`
- `customerProjectionPreview` if safe

The command envelope must not include:

- DB persistence result
- repository write result
- provider payload
- raw customer contact/address/signature/photo/private fields
- formal Field Service Report / Completion Report creation, approval, publication, or finalization payload
- `finalAppointmentId` mutation payload
- billing, settlement, payment, or invoice payload
- AI/RAG/OpenAI/vector payload
- SQL, stack, token, password, secret, or debug payload

## Future Helper Behavior

The future helper should be pure and deterministic:

- no route write-scope enablement
- no DB/repository persistence
- no migration behavior
- no provider sending
- no package or package-lock changes
- no runtime/server/smoke behavior
- no official business write by itself

The helper may only prepare a future command envelope for later separately authorized persistence work.

## Explicit Non-Authorization

Task2393 explicitly forbids:

- route write scope enablement by this task
- helper implementation by this task
- DB/repository persistence
- migration creation or execution
- provider sending
- formal Field Service Report / Completion Report creation, approval, publication, or finalization
- `finalAppointmentId` mutation
- billing/settlement/payment/invoice behavior
- AI/RAG scope expansion
- admin UI behavior
- smoke/staging/prod rollout

## Recommended Next Bounded Task

Recommended next bounded task: pure write command helper implementation with unit/static tests.

Why: the design now defines the future helper name, file, action, input scope, fail-closed rules, output envelope, and non-authorization boundaries. A pure helper implementation can prove command shaping without enabling route writes, DB persistence, provider sending, packages, or formal report/final appointment behavior.

Repository/migration authorization should remain separate and should follow only after the pure helper implementation is accepted.

## Static Guard Coverage

Task2393 adds:

- `tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandHelperDesign.static.test.js`

The static guard reads source/doc/test files only and asserts:

- Task2392 authorization packet exists
- current route write denial marker remains visible
- current route remains prepare-only
- Task2393 names one future helper, file, and action
- Task2393 recommends exactly one next bounded task
- no helper implementation is added by Task2393
- no route/source behavior is changed by Task2393
- no DB/provider/package/formal-report authorization is introduced

## Non-Authorization

Task2393 does not authorize:

- runtime/source behavior changes
- helper implementation
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring changes
- permission changes
- service behavior changes
- controller creation
- repository implementation
- new DB behavior
- DB commands
- SQL execution
- real DB connection
- migration creation
- migration dry-run or apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- server/listener startup
- smoke test execution
- endpoint probes
- shared runtime
- deploy
- staging/prod traffic
- `/healthz`
- provider sending
- package or package-lock changes
- auth/session middleware changes
- permission model changes, role expansion, or organization isolation source changes
- AI/RAG/OpenAI/vector DB runtime behavior
- admin frontend behavior
- billing/settlement/payment/invoice behavior
- Customer Access runtime behavior changes
- Engineer Mobile runtime behavior changes
- Repair Intake runtime behavior changes
- formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior
- `finalAppointmentId` mutation path

## Held Docs

The 7 held historical docs remain outside Task2393 scope and must stay untracked, unstaged, and untouched.
