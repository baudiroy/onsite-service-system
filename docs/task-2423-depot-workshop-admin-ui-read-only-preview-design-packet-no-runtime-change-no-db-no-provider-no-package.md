# Task2423 Depot Workshop Admin UI Read-Only Preview Design Packet

## Scope

Task2423 records a design packet for a future Depot / Workshop admin read-only preview UI.

This is docs/static-only. It does not implement UI, add frontend source behavior, add API client code, add routes/API, change runtime/source behavior, execute DB, add packages, enable route write scope, change route response source, change route wiring, change route path or mount, wire helper/service methods into routes, change permissions, change services, create controllers, change repository adapters, wire DB adapters, run DB commands, execute SQL, connect to a real DB, change migrations, perform migration dry-run/apply, inspect `DATABASE_URL`, Zeabur, env, or secrets, start servers, run smoke tests, probe endpoints, deploy, send providers, change auth/session middleware, change AI/RAG behavior, change billing behavior, change formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Current Admin / Frontend State

Current accepted state from Task2422:

- `admin/` exists
- `admin/src/` exists
- no dedicated Depot / Workshop admin UI page exists
- no dedicated Depot / Workshop admin API client exists
- no frontend use of `/api/v1/depot/repairs/:depotIntakeId/assignment-intent` exists
- no frontend use of `writePreparedAssignmentIntent` exists
- current admin frontend has general cases, dispatch/appointments, field service reports, billing, audit logs, customers, and dispatch unit management surfaces

Existing admin conventions to preserve in a future implementation:

- route selection is currently centralized in `admin/src/App.tsx`
- menu entries are configured in `admin/src/config/menu.ts`
- API calls use `admin/src/lib/apiClient.ts`
- case-oriented screens currently live under `admin/src/pages/`
- API modules currently live under `admin/src/api/`

## Future Read-Only Preview Surface

Proposed page/component name as design only:

- `DepotWorkshopAssignmentIntentPreviewPage`
- optional child component: `DepotWorkshopAssignmentIntentPreviewPanel`

Proposed route/menu placement as design only:

- route path: `/depot-workshop/assignment-intent-preview`
- menu label: `Depot / Workshop Preview`
- required permission candidate: `cases.read`
- placement candidate: near existing `cases` and `dispatch-appointments` menu entries

Proposed API client function as design only:

- file candidate: `admin/src/api/depotWorkshop.ts`
- function candidate: `previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`
- backend route candidate, only if separately authorized later: `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

Current backend route status:

- the route is prepare-only
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `writePreparedAssignmentIntent` remains not route-wired
- any future UI must treat this as read-only preview, not persistence

## Allowed UI Data Fields

Future UI may consume only admin-safe presenter fields if separately authorized later:

- `data.depotRepair`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`
- `meta.written: false`
- `writeRequired: false`
- safe `requestId`

The UI should display these as read-only summaries:

- assignment intent preview
- repair order draft summary
- transition plan summary
- internal audit intent preview
- customer projection preview
- write-scope disabled state / blocker display

## Forbidden UI Fields And Behaviors

Future UI must not include:

- full internal helper-derived service objects
- enabled route write action button
- provider sending
- DB/admin migration status control
- billing/payment/invoice controls
- formal Field Service Report / Completion Report creation
- formal Field Service Report / Completion Report approval
- formal Field Service Report / Completion Report publication
- formal Field Service Report / Completion Report finalization
- `finalAppointmentId` display
- `finalAppointmentId` mutation
- raw customer private/contact/address/signature/photo fields
- SQL/stack/token/password/secret/debug payload display
- provider payload display
- billing payload display
- AI/RAG payload display

## Future Implementation Prerequisites

Before any implementation, a separate exact PM task must authorize:

- UI implementation
- API client route usage for read-only preview only
- exact request payload shape
- exact response presenter field mapping
- permission and menu placement
- no package additions unless separately authorized

For any write UI, the following remain blockers:

- route write scope and DB readiness remain blockers for any write UI
- route write scope must be separately authorized
- DB dry-run or equivalent safe verification must be complete
- repository adapter verification beyond fake-client-only coverage must be complete
- provider sending must remain separately authorized
- formal report behavior must remain separately authorized
- `finalAppointmentId` mutation must remain forbidden unless separately authorized by exact PM task

## Recommended Next Bounded UI Task

Recommended next bounded task: admin UI read-only preview static guard / design portfolio.

Why:

- the design boundary is now defined but not yet portfolio-frozen
- no admin source implementation exists yet
- no dedicated API client exists yet
- route write scope and DB readiness remain blockers
- a portfolio guard can freeze UI field, permission, route, and non-authorization boundaries before any implementation or API client design work

Do not recommend implementation until the design boundary is complete, safe, and separately authorized.

## Static Guard Coverage

`tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesign.static.test.js` verifies:

- Task2422 inventory exists
- Task2423 design packet exists
- no admin UI implementation files are added by Task2423
- no admin API client implementation is added by Task2423
- route write scope remains blocked
- `writePreparedAssignmentIntent` remains not route-wired
- presenter/admin-safe response boundary remains visible
- forbidden UI fields/behaviors are documented
- no package/runtime/DB/provider/billing/AI/formal-report/`finalAppointmentId` authorization is introduced

## Non-Authorization

Task2423 does not authorize:

- runtime/source behavior changes
- admin UI implementation
- frontend source implementation
- API client implementation
- package or package-lock changes
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper/service route wiring
- permission changes
- service behavior changes
- controller creation
- repository adapter changes
- DB adapter runtime wiring
- DB commands
- SQL execution against any DB
- real DB connection
- migration changes
- migration dry-run/apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- server/listener startup
- smoke test execution
- endpoint probes
- shared runtime
- deploy
- staging/prod traffic
- `/healthz`
- provider sending
- auth/session middleware changes
- permission model changes, role expansion, or organization isolation source changes
- AI/RAG/OpenAI/vector DB runtime behavior
- billing/settlement/payment/invoice behavior
- Customer Access runtime behavior changes
- Engineer Mobile runtime behavior changes
- Repair Intake runtime behavior changes
- formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior
- `finalAppointmentId` mutation path

## Held Docs

The 7 held historical docs remain outside Task2423 scope and must stay untracked, unstaged, and untouched.
