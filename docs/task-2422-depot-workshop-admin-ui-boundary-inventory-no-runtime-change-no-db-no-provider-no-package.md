# Task2422 Depot Workshop Admin UI Boundary Inventory

## Scope

Task2422 records a source-reading boundary inventory for future Depot / Workshop admin UI work.

This is docs/static-only. It does not implement UI, add frontend source behavior, add API clients, enable route write scope, change runtime/source behavior, change route response source, change route wiring, change route path or mount, wire helper/service methods into routes, change permissions, change services, create controllers, change repository adapters, wire DB adapters, run DB commands, execute SQL, connect to a real DB, change migrations, perform migration dry-run/apply, inspect `DATABASE_URL`, Zeabur, env, or secrets, start servers, run smoke tests, probe endpoints, deploy, send providers, change packages, change auth/session middleware, change AI/RAG behavior, change billing behavior, change formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Admin / Frontend Inventory

`admin/` exists.

`admin/src/` exists.

Current admin frontend source includes:

- `admin/src/App.tsx`
- `admin/src/config/menu.ts`
- `admin/src/lib/apiClient.ts`
- `admin/src/api/cases.ts`
- `admin/src/api/caseDispatch.ts`
- `admin/src/api/fieldServiceReports.ts`
- `admin/src/api/billing.ts`
- `admin/src/pages/CaseManagementPage.tsx`
- `admin/src/pages/DashboardPage.tsx`
- `admin/src/pages/DispatchUnitAdminPage.tsx`
- `admin/src/pages/AuditLogPage.tsx`

Existing related surfaces are general platform/admin surfaces:

- cases
- appointments / dispatch
- field service reports
- billing
- audit logs
- customers

Current absence confirmed:

- no dedicated Depot / Workshop admin page was found in `admin/src/`
- no dedicated Depot / Workshop API client was found in `admin/src/api/`
- no admin frontend usage of `/api/v1/depot/repairs/:depotIntakeId/assignment-intent` was found
- no admin frontend usage of `writePreparedAssignmentIntent` was found
- no admin frontend route/menu entry for Depot / Workshop repair order or assignment-intent workflows was found
- no frontend write-scope action for Depot / Workshop assignment intent or repair order was found

## Current Backend Boundary Relevant To UI

Current backend status relevant to future UI:

- route remains `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- route remains prepare-only
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `prepareAssignmentIntent` remains the route path's service behavior
- `writePreparedAssignmentIntent` exists but remains not route-wired
- route response presenter / admin-safe response boundary remains visible
- migration 028 exists but has not been dry-run or applied
- DB work remains paused
- SQL repository adapter is fake-client tested only
- fake-chain verification used fake `dbClient` only
- real DB execution remains unauthorized

## UI Safety Boundaries

Future UI must preserve these boundaries:

- UI must not imply route write scope while route write scope remains blocked
- UI must not expose full internal helper-derived service objects
- UI must consume only admin-safe presenter fields if future UI is built
- UI must not expose formal Field Service Report / Completion Report mutation
- UI must not expose or mutate `finalAppointmentId`
- UI must not expose raw customer private/contact/address/signature/photo fields
- UI must not expose provider, billing, AI, debug, SQL, or secret payloads
- UI must not present fake-chain or fake DB evidence as real persistence
- UI must display write-scope blockers instead of write action affordances until separate PM authorization exists

## Non-Authorized Future UI Surfaces

The following are possible future UI surfaces only. Task2422 does not authorize implementation:

- read-only assignment-intent preview panel
- admin-safe repair order summary card
- internal audit intent preview
- customer projection preview
- write-scope disabled state / blocker display
- future write action button only after route write scope and DB readiness are separately authorized

## Recommended Next Bounded UI Task

Recommended next bounded task: admin UI read-only preview design packet.

Why:

- `admin/src/` already exists
- general case/dispatch/service-report/billing admin surfaces already exist
- no dedicated Depot / Workshop admin UI/API client exists yet
- the safest next UI step is a design packet for a read-only preview, not implementation
- route write scope, DB dry-run, repository DB verification, provider sending, billing, and formal report behavior remain blocked or separately authorized only

Do not recommend UI implementation yet.

## Static Guard Coverage

`tests/depotWorkshop/depotWorkshopAdminUiBoundaryInventory.static.test.js` verifies:

- Task2422 inventory doc exists
- `admin/` and `admin/src/` exist
- no dedicated Depot / Workshop admin UI or API client is present
- current route write scope remains blocked
- `writePreparedAssignmentIntent` remains not route-wired
- route response presenter / admin-safe response boundary remains visible
- migration 028 DB dry-run pause remains visible
- no admin UI implementation is added by Task2422
- no package dependency is added or authorized by Task2422
- no route/API/controller/DB/provider/billing/AI/formal-report/`finalAppointmentId` authorization is introduced

## Non-Authorization

Task2422 does not authorize:

- runtime/source behavior changes
- admin UI implementation
- frontend source implementation
- API client implementation
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
- package or package-lock changes
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

The 7 held historical docs remain outside Task2422 scope and must stay untracked, unstaged, and untouched.
