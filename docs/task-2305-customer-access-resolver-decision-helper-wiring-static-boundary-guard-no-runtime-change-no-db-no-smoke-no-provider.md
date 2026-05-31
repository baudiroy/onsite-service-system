# Task2305 Customer Access Resolver Decision Helper Wiring Static Boundary Guard

## Summary

Task2305 adds a static boundary guard only for the Task2304 Customer Access resolver decision helper runtime wiring.

The guard freezes the accepted wiring in:

- `src/customerAccess/customerServiceReportProjectionHandler.js`
- `safeHttpEnvelopeFromServiceResult(serviceResult, customerAccessContext)`
- `resolverDecisionFromServiceResult({ serviceResult, customerAccessContext })`

No runtime/source behavior changed.

## Static Boundary Coverage

The new guard verifies:

- The projection handler imports `buildCustomerAccessResolverDecision()`.
- The projection handler imports `buildCustomerAccessResolverDenyDecision()`.
- The service-report response boundary passes trusted `customerAccessContext` and `serviceResult.data.serviceReport` into `buildCustomerAccessResolverDecision()`.
- Allowed service-report responses proceed through the resolver decision helper before `buildCustomerServiceReportSafeEnvelope()`.
- Deny and unavailable paths preserve generic `customerAccess.unavailable` semantics through `buildCustomerAccessResolverDenyDecision()` or the existing safe-deny envelope.
- If resolver decision denies, lacks projection, or input is malformed/conflicting, the handler returns generic safe-deny.
- The compatible customer-facing response shape remains represented:
  - `status`
  - `messageKey`
  - `customerVisible`
  - `data.serviceReport`

## Safety Coverage

The guard keeps static coverage visible for:

- Raw body, query, header, cookie, session, user, provider, debug, and env containers not authorizing access.
- Raw client-controlled `organizationId`, `caseId`, `reportId`, `finalAppointmentId`, `appointmentId`, `completionReportId`, and `fieldServiceReportId` not authorizing access.
- Safe-deny not revealing Case/report existence.
- Raw denial reason details not being exposed.
- Raw Case, Appointment, Completion Report, and Field Service Report objects not being exposed.
- Raw DB/repository rows not being exposed.
- Audit internals not being exposed.
- Provider/providerPayload data not being exposed.
- AI/RAG/OpenAI/vector data not being exposed.
- Billing/settlement/payment/invoice data not being exposed.
- `finalAppointmentId` not being exposed.
- Customer private/contact/address/fullAddress/photo/signature fields not leaking beyond the approved projection contract.
- Debug/internal/raw SQL/token/password/secret fields not being exposed.

## Static-Only Confirmation

The Task2305 guard reads source, test, and doc files as text only.

It does not import or execute runtime, DB, repository, provider, route, server, listener, env, smoke, migration, AI/RAG, billing, package, or package-lock code.

No route, API, DTO, projection, resolver, Customer Access broader runtime, Engineer Mobile, Repair Intake, DB, migration, SQL, env/Zeabur, provider, AI/RAG, billing, settlement, package, or package-lock behavior changed.

No additional safe envelope helper runtime wiring beyond Task2301 is authorized.
No additional resolver decision helper runtime wiring beyond Task2304 is authorized.

The same 7 held historical docs remain untracked and untouched.

## Verification

Required Task2305 verification:

- `node --test tests/customerAccess/customerAccessResolverDecisionHelperWiringBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessResolverDecisionHelperWiring.unit.test.js`
- `node --test tests/customerAccess/customerAccessResolverDecisionHelper.unit.test.js`
- `node --test tests/customerAccess/customerAccessResolverDecisionHelperBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessContextSourceBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js`
- `node --test tests/customerAccess/customerServiceReportSafeEnvelopePresenterWiring.unit.test.js`
- `node --test tests/customerAccess/customerServiceReportSafeEnvelopePresenterWiringBoundary.static.test.js`
- `node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
