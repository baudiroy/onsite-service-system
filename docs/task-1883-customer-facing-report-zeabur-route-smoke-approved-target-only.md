# Task1883 Customer-facing Report Zeabur Route Smoke / Approved Target Only

Status: completed locally, pending PM acceptance.

## Approved Target

- Base URL: `https://onsite-service-api.zeabur.app`
- Scope: public safe-deny smoke only.
- This was not an authenticated customer-visible publication smoke.

## Probes Run

1. `GET https://onsite-service-api.zeabur.app/healthz`
2. `GET https://onsite-service-api.zeabur.app/customer-access/smoke_case/service-report/smoke_report`
3. Same unauthenticated report route retry.
4. Same unauthenticated report route retry after a short wait.

## Results

| Probe | HTTP status | Reachable | Sanitized response summary |
| --- | ---: | --- | --- |
| `/healthz` | 200 | yes | JSON with top-level keys `ok`, `requestId`, `service`, `timestamp`; no forbidden markers detected. |
| report route initial | 404 | yes | JSON generic safe-deny envelope: `status=deny`, `messageKey=customerAccess.unavailable`, `customerVisible=false`, `data=null`; no forbidden markers detected. |
| report route retry 1 | 404 | yes | Same JSON generic safe-deny envelope; no forbidden markers detected. |
| report route retry 2 | 404 | yes | Same JSON generic safe-deny envelope; no forbidden markers detected. |

## Route Reachability And Safe-deny

- `/healthz` returned 200.
- The unauthenticated customer-facing report route returned HTTP 404 with the application generic safe-deny JSON envelope.
- The route response body shape indicates app-level safe-deny behavior, not raw internal data exposure.
- Because the HTTP status remains 404, PM should decide whether the current app-level 404 safe-deny is acceptable for this gate or whether a later task should change unauthenticated route status to 401/403.

## Sensitive/Internal Data Exposure Check

The sanitized response summaries checked for these marker categories and found no hits:

- `DATABASE_URL`
- `JWT_SECRET`
- token/bearer markers
- stack traces
- raw SQL
- raw DB rows
- raw Case
- raw Appointment
- raw Completion Report / FSR internals
- `finalAppointmentId`
- internal notes
- provider payloads
- raw phone/address
- billing internals
- organization-internal fields

## Zeabur Deployment Visibility

- The existing Zeabur service page was inspected only for non-secret visible deployment status.
- The current page showed a `Deployments` section, but the target commit hash `dd8c09e87f83d1b1253edb1c1483666a079f8a18` was not visible in the current view.
- No Zeabur env var page was opened, no env values were inspected, and no deploy/redeploy action was taken.

## Remaining Gates Before Authenticated Publication Smoke

- PM/user approval for any authenticated allow-path smoke target.
- Explicit scoped customer access context or approved fixture/seed plan.
- Separate approval before any DB, migration, seed, or production/shared data action.
- Separate approval before any provider, LINE, AI/RAG, or billing execution.

## Confirmations

- No runtime source changes.
- No DB, SQL, migration, or seed commands.
- No authenticated publication smoke.
- No Zeabur env changes or manual deploy/redeploy.
- No provider, billing, AI/RAG, LINE/SMS/email/app push, or webhook execution.
- No secrets printed.
- No Completion Report / FSR creation, approval, publish, revoke, or mutation.
- No `finalAppointmentId` mutation.
- No held historical untracked docs touched.
