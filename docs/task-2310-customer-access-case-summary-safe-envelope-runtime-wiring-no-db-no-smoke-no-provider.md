# Task2310 Customer Access Case Summary Safe Envelope Runtime Wiring

Status: implemented

This task wires the pure Customer Access case summary safe envelope presenter from Task2309 into the narrow case-level controller response boundary identified in Task2308.

Current accepted base:

- `483370e166fdf7dee519d9d8b3c7ffb8e1c2cadd`

## Runtime Boundary

Selected controller boundary:

- `src/controllers/customerAccessController.js`
- `safeEnvelopeFromFacadeResult(facadeResult)`
- `safeAllowEnvelopeFromFacadeResult(facadeResult)`

The route, mount, facade, resolver, repository, DB, provider, app, and server boundaries were not changed.

## Wiring Result

The controller now imports:

- `buildCustomerAccessCaseSummarySafeEnvelope(input)`
- `buildCustomerAccessCaseSummarySafeDenyEnvelope()`

The allow path shapes the existing case-level `data.serviceReport` compatibility boundary with the Task2309 helper output. The helper receives the existing facade `data.serviceReport` as a case summary projection, removes unsafe/internal fields, and the controller maps the helper `data.caseSummary` back to the current compatible `data.serviceReport` payload boundary.

The deny path delegates generic unavailable shaping to `buildCustomerAccessCaseSummarySafeDenyEnvelope()`.

## Final Safe Case Summary Behavior

Allowed case summary output fields:

- `caseNo`
- `publicReportId`
- `status`
- `summary`

Not emitted:

- `finalAppointmentId`
- raw internal appointment IDs
- raw report IDs other than `publicReportId`
- raw customer private/contact/address/fullAddress/photo/signature fields
- raw Case, Appointment, Completion Report, or Field Service Report objects
- raw DB/repository rows
- audit internals
- provider payloads
- AI/RAG/OpenAI/vector fields
- billing/settlement/payment/invoice fields
- debug/internal/raw SQL/token/password/secret fields

Generic unavailable behavior remains:

- `status: 'deny'`
- `messageKey: 'customerAccess.unavailable'`
- `customerVisible: false`
- `data: null`
- `error.messageKey: 'customerAccess.unavailable'`

## Tests Added

- `tests/customerAccess/customerAccessCaseSummarySafeEnvelopeWiring.unit.test.js`

The wiring tests cover:

- controller source uses the Task2309 helper at the case summary boundary
- allowed case summary access remains compatible through `data.serviceReport`
- safe helper output removes `finalAppointmentId`
- raw/private/system/internal fields do not leak
- missing/malformed/unavailable facade results stay generic safe-deny
- facade result and case summary input objects are not mutated
- handler allow/deny status behavior remains 200/404

## Non-Expansion Confirmation

No new route path or mount was added.
No app, server, listener, repository implementation, DB, SQL, migration, env, Zeabur, provider sending, smoke, endpoint probe, deploy, staging/prod traffic, `/healthz`, auth/session, rate limit, payload-size/body-parser, permission model, AI/RAG/OpenAI/vector DB, admin frontend, billing, Repair Intake, Engineer Mobile, package, or package-lock behavior changed.
The same 7 held historical docs remain untracked and untouched.

## Verification

- `node --test tests/customerAccess/customerAccessCaseSummarySafeEnvelopeWiring.unit.test.js`
- `node --test tests/customerAccess/customerAccessCaseSummarySafeEnvelopePresenter.unit.test.js`
- `node --test tests/customerAccess/customerAccessCaseSummaryBoundaryInventory.static.test.js`
- `node --test tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js`
- `node --test tests/customerAccess/customerAccessContextSourceBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessProductionMountBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessController.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
