# Task1883A Customer-facing Report Route Safe-deny Status Semantics / No DB

Status: completed locally, pending PM acceptance.

## Task1883 Observation Summary

- Approved target: `https://onsite-service-api.zeabur.app`
- `/healthz` returned HTTP 200.
- `GET /customer-access/smoke_case/service-report/smoke_report` returned HTTP 404 with an application-level generic safe-deny JSON envelope:
  - `status=deny`
  - `messageKey=customerAccess.unavailable`
  - `customerVisible=false`
  - `data=null`
  - `error.messageKey=customerAccess.unavailable`
- Sanitized response checks found no secrets, raw DB rows, raw Case, raw Appointment, raw Completion Report / FSR internals, `finalAppointmentId`, internal notes, provider payloads, raw phone/address, billing internals, or organization-internal fields.

## Chosen Status Semantics

Chosen option: **A. Preserve 404 stealth safe-deny for `customerAccess.unavailable`.**

The customer-facing report route should keep returning HTTP 404 for unauthenticated, resolver-denied, unavailable, unpublished, missing context, and not-found customer access states when the response body is the generic safe-deny envelope.

## Reasoning

- Existing base customer access route behavior maps deny envelopes to HTTP 404 in `statusCodeForEnvelope`.
- Existing customer-facing report route uses `writeSafeDeny` with HTTP 404 and the same `customerAccess.unavailable` envelope.
- Existing customer access tests repeatedly assert generic safe-deny 404 for unavailable, disabled, throwing, empty, or denied customer access paths.
- The 404 is intentionally stealthy: it avoids revealing whether a Case, customer, report, organization, identity link, publication, or route-backed resource exists.
- Task1883 observed app-level safe-deny JSON, not a raw missing-route response. PM accepted that smoke with this semantics follow-up.

## Distinguishing App-level 404 Safe-deny From Missing Route

An app-level 404 safe-deny is expected to return JSON with all of these properties:

- `status=deny`
- `messageKey=customerAccess.unavailable`
- `customerVisible=false`
- `data=null`
- `error.messageKey=customerAccess.unavailable`
- No raw internal data, secrets, stack traces, raw SQL, raw DB rows, or provider payloads

A deployment missing-route 404 should not be treated as accepted merely because the HTTP status is 404. It must be distinguished by the response body shape. If the body is not the customer access safe-deny envelope, treat it as deployment/routing investigation, not accepted stealth safe-deny.

## Tests Added

- Added route-level coverage that explicitly locks application-level HTTP 404 stealth safe-deny for:
  - base customer access route unavailable response
  - customer-facing service report route resolver-denied response
- The test also asserts:
  - registered route paths exist
  - response body is the generic customer access safe-deny envelope
  - projection DB query is not called when resolver gate denies
  - forbidden raw/sensitive data is not exposed

## Remaining Gates Before Authenticated Publication Smoke

- Explicit PM/user approval for authenticated allow-path smoke.
- Explicit target and fixture/seed/data plan.
- Separate approval before DB, SQL, migration, seed, or production/shared data action.
- Separate approval before provider sending, LINE/SMS/email/app push, AI/RAG, or billing execution.

## Confirmations

- No runtime source behavior change.
- No DB, SQL, migration, or seed command.
- No smoke or authenticated publication test.
- No Zeabur env change or manual deploy/redeploy.
- No provider, billing, AI/RAG, LINE/SMS/email/app push, or webhook execution.
- No secrets printed.
- No Completion Report / FSR creation, approval, publish, revoke, or mutation.
- No `finalAppointmentId` mutation.
- No held historical untracked docs touched.
