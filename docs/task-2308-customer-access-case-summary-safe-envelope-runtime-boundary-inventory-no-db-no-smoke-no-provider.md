# Task2308 Customer Access Case Summary Safe Envelope Runtime Boundary Inventory

Status: inventory only

This task inspects the existing Customer Access case-level response/runtime boundary after closing the service-report safe envelope / resolver decision runtime wiring branch. It is docs + static source-reading inventory only and does not authorize runtime, source behavior, DB, provider, smoke, package, migration, or route changes.

Current accepted base:

- `ad900f6b12b49e619c855d482517bd4a46d9e78c`

## Inventory Result

A case-level Customer Access runtime response boundary exists.

Current public route:

- `GET /customer-access/:caseId`

Current route registration:

- `src/routes/customerAccessRoutes.js`
- route constant: `CUSTOMER_ACCESS_ROUTE_PATH = '/customer-access/:caseId'`
- registered with `customerAccessContextMiddleware` before `handleCustomerAccessRequest`

Current controller boundary:

- `src/controllers/customerAccessController.js`
- `buildCustomerAccessOverviewInput(req)`
- `buildCustomerAccessControllerResponseWithOptions(req, options)`
- `safeEnvelopeFromFacadeResult(facadeResult)`
- `safeAllowEnvelopeFromFacadeResult(facadeResult)`
- `handleCustomerAccessRequest(req, res, options)`

Recommended exact candidate source boundary for the next bounded runtime task:

- `src/controllers/customerAccessController.js`
- `safeEnvelopeFromFacadeResult(facadeResult)`
- `safeAllowEnvelopeFromFacadeResult(facadeResult)`

This is the narrowest current case-level response-shaping boundary before the HTTP response is returned.

## Current Response Shape

The current case-level response shape is:

- `status`
- `messageKey`
- `customerVisible`
- `data.serviceReport`

Current case overview `data.serviceReport` fields are shaped from:

- `caseNo`
- `finalAppointmentId`
- `publicReportId`
- `status`
- `summary`

Current allow message key:

- `customerAccess.available`

Current generic deny message key:

- `customerAccess.unavailable`

## Current Safe-Deny Behavior

Safe-deny behavior is visible in:

- `src/controllers/customerAccessController.js`
- `src/customerAccess/customerAccessService.js`
- `src/customerAccess/customerAccessResponseEnvelope.js`
- `src/customerAccess/customerAccessResolver.js`

Missing, malformed, mismatched, denied, or unsafe inputs are converted to generic unavailable responses. The route/controller path does not need DB, provider, smoke, server/listener, package, or migration changes to identify this boundary.

## Helper Reuse Decision

The existing service-report safe envelope presenter is not directly reusable for the current case-level summary shape because it is built around service-report fields such as:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

The existing resolver decision helper is also service-report projection oriented and expects a projection shape that does not match the current case overview fields.

Therefore, a new pure case summary envelope helper is needed first before any future runtime wiring into the case-level response boundary.

## Static Guard Added

Task2308 adds:

- `tests/customerAccess/customerAccessCaseSummaryBoundaryInventory.static.test.js`

The guard reads source/test/doc files only and verifies:

- candidate files exist
- `GET /customer-access/:caseId` route markers are present
- `handleCustomerAccessRequest` is the route handler
- current controller response boundary markers are present
- current response shape markers are visible
- generic safe-deny markers remain visible
- known response construction does not directly spread raw object containers
- known case-level boundary path has no direct DB, provider, AI/RAG, billing, env, server/listener, smoke, or migration dependencies

## Non-Expansion Confirmation

No runtime/source behavior changed.
No Customer Access route/API/DTO/projection/resolver behavior changed.
No additional safe envelope helper runtime wiring was added.
No additional resolver decision helper runtime wiring was added.
No new route path or mount was added.
No app, server, listener, shared runtime, smoke, endpoint probe, deploy, staging, production, or `/healthz` behavior changed.
No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, or env inspection was performed.
No repository implementation behavior changed.
No audit persistence behavior changed.
No provider sending behavior was added for LINE, SMS, email, app push, or webhook.
No auth/session, rate limit, payload-size/body-parser, permission model, role, or organization isolation source behavior changed.
No AI/RAG/OpenAI/vector DB behavior was added.
No admin frontend, billing, settlement, payment, invoice, Repair Intake, Engineer Mobile, package, or package-lock behavior changed.

The same 7 held historical docs remain untracked and untouched.

## Non-Authorized Candidate Next Task

The next bounded runtime work should not wire an existing service-report helper directly into the case-level boundary.

Recommended next exact task candidate, still non-authorized:

- Create a pure Customer Access case summary safe envelope helper and focused unit/static tests, with no route, DB, provider, smoke, package, or runtime wiring.

Possible later runtime wiring candidate after that helper exists, still non-authorized:

- Wire the pure case summary safe envelope helper into `src/controllers/customerAccessController.js` at `safeEnvelopeFromFacadeResult(facadeResult)` / `safeAllowEnvelopeFromFacadeResult(facadeResult)`.

## Verification

Task2308 verification:

- `node --test tests/customerAccess/customerAccessCaseSummaryBoundaryInventory.static.test.js`
- `node --test tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js`
- `node --test tests/customerAccess/customerAccessContextSourceBoundary.static.test.js`
- `node --test tests/customerAccess/customerFacingProjectionAllowlist.static.test.js`
- `node --test tests/customerAccess/customerAccessProductionMountBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
