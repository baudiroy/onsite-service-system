# Task2304 Customer Access Resolver Decision Helper Runtime Wiring

## Summary

Task2304 wires the existing pure Customer Access resolver decision helper into the narrowest existing service-report decision boundary.

Selected boundary:

- `src/customerAccess/customerServiceReportProjectionHandler.js`
- exact function: `safeHttpEnvelopeFromServiceResult(serviceResult, customerAccessContext)`

This boundary already has the trusted `customerAccessContext` from middleware and the projection lookup result returned by the service-report projection service before customer-facing response shaping.

## Runtime Behavior

The handler now uses:

- `buildCustomerAccessResolverDecision()` to normalize trusted customer access context plus the allowed service-report projection before the safe report envelope presenter shapes `data.serviceReport`.
- `buildCustomerAccessResolverDenyDecision()` to keep generic resolver safe-deny message-key semantics aligned with the existing customer-facing unavailable response.

Allowed service-report access still returns the existing compatible response shape:

- `status`
- `messageKey`
- `customerVisible`
- `data.serviceReport`

Denied, missing, malformed, conflicting, cross-scope, or unavailable data still fails closed with generic `customerAccess.unavailable` semantics and no existence disclosure.

## Safety Behavior

- Raw body, query, header, cookie, session, user, provider, debug, and env containers are not trusted as customer access context.
- Raw client-provided `organizationId`, `caseId`, `reportId`, `finalAppointmentId`, `appointmentId`, `completionReportId`, or `fieldServiceReportId` cannot authorize access.
- Safe-deny does not reveal whether Case/report data exists.
- Raw denial reason details are not exposed.
- Raw Case, Appointment, Completion Report, and Field Service Report objects are not exposed.
- DB/repository rows, audit internals, provider/providerPayload, AI/RAG/OpenAI/vector data, billing/settlement/payment/invoice data, debug/internal/raw SQL/token/password/secret fields are not exposed.
- Customer private/contact/address/fullAddress/photo/signature fields are not leaked beyond the approved projection contract.
- Input context, projection, and service result objects are not mutated.

## Non-Expansion Confirmation

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

## Verification

Task2304 verification uses focused and adjacent tests only:

- `node --test tests/customerAccess/customerAccessResolverDecisionHelperWiring.unit.test.js`
- `node --test tests/customerAccess/customerAccessResolverDecisionHelper.unit.test.js`
- `node --test tests/customerAccess/customerAccessResolverDecisionHelperBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessContextSourceBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js`
- `node --test tests/customerAccess/customerServiceReportSafeEnvelopePresenterWiring.unit.test.js`
- `node --test tests/customerAccess/customerServiceReportSafeEnvelopePresenterWiringBoundary.static.test.js`
- `node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js`
- Adjacent resolver unit tests when present.
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
