# Task2394 Depot Workshop Assignment Intent Write Command Pure Helper

## Scope

Task2394 adds a pure Depot / Workshop assignment-intent write command helper.

No route wiring. No route write-scope behavior. No route response source change. No service behavior change. No controller creation. No repository implementation. No DB behavior. No provider sending. No package or package-lock changes.

## Added Helper

Added:

- `src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js`

Primary export:

- `buildDepotWorkshopAssignmentIntentWriteCommand(input)`

Action constant:

- `depot_workshop.assignment_intent.write`

The helper is pure and only shapes a future safe command envelope. It does not persist data, call repositories, send providers, approve route writes, start servers, run smoke tests, inspect env/secrets, or change official business state.

## Input Contract

The helper accepts plain object input only.

Accepted input includes a prepared assignment intent from the accepted prepare boundary:

- `assignmentIntent`
- `preparedAssignmentIntent`
- `depotRepair`
- `intent`
- `result.assignmentIntent`

The helper requires trusted scope:

- `organizationId`
- `caseId`
- one source reference: `depotIntakeId` or `repairOrderId`
- `actorId`
- explicit write authorization through `writeAuthorized`, `trustedScope.writeAuthorized`, `permissionContext.canWriteAssignmentIntent`, or the exact write action permission
- brand/service-provider/subcontractor scope when present

The helper does not accept raw body/request/provider/debug/env/DB payloads as trusted context.

## Output Contract

The helper returns a safe command envelope only:

- `ok`
- `status`
- `reasonCode`
- `action`
- `command`
- `auditIntent`
- `customerProjectionPreview`

The command envelope contains the exact action and safe command fields only. It does not include a DB persistence result, repository write result, provider payload, formal report payload, final appointment mutation payload, billing payload, AI/RAG payload, SQL, stack, token, password, secret, or debug payload.

## Validation Behavior

The helper fails closed for:

- non-object input
- missing prepared assignment intent
- forbidden fields
- missing trusted organization/case/source
- missing actor or write authorization
- subcontractor scope mismatch
- invalid transition target
- audit helper failure

Transition targets are validated through the accepted repair order transition policy.

Audit intent is built through the accepted audit helper and remains `internalOnly: true` and `customerVisible: false`.

Customer projection preview is built through the accepted projection helper and remains allowlisted/safe preview only.

## Tests

Added:

- `tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.unit.test.js`
- `tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandBoundary.static.test.js`

The unit tests prove:

- valid prepared assignment intent builds a safe command envelope with the exact action
- missing trusted scope fails closed
- invalid transition fails closed
- missing write permission/authorization fails closed
- subcontractor mismatch fails closed
- malformed prepared intent fails closed
- audit intent is internal-only and sanitized
- customer projection preview is safe allowlisted preview only
- forbidden fields fail closed
- no DB/repository/provider result appears
- no formal Field Service Report / Completion Report / `finalAppointmentId` mutation appears
- input objects are not mutated and output is detached

The static guard proves:

- helper imports only accepted pure helpers
- helper has no DB/repository/provider/route/app/server/env/package imports
- helper is not wired into routes/services/controllers/repositories
- route write scope remains blocked in `src/routes/depotRepair.routes.js`
- helper does not approve, publish, or formalize Field Service Report / Completion Report behavior
- helper does not mutate `finalAppointmentId`
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

Safety statements:

- No DB commands
- No provider sending
- No package or package-lock changes
- No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior
- No `finalAppointmentId` mutation path

## Non-Authorization

Task2394 does not authorize:

- runtime/source behavior changes outside adding the pure helper
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring into existing runtime
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

The 7 held historical docs remain outside Task2394 scope and must stay untracked, unstaged, and untouched.
