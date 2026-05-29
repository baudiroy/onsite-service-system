# Task2098 - Customer Access Mounted Route Runtime Guard Final Handoff

## Branch Status

- Customer Access mounted route runtime guard branch is complete and checkpointed.
- No real smoke was executed.
- No server/listener, network, DB, Zeabur/env, migration, or SQL work was executed.
- The branch is ready to hand off to the next bounded runtime branch after PM authorization.
- The 7 held historical docs remain untracked and untouched.

## Final Mounted Route Contracts

### Public Routes

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

No other public Customer Access route is accepted by this branch.

### Internal Test Route

The internal test route remains separate from public route registration:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

### Registration Summary

Successful registration remains:

```json
{
  "registered": true,
  "routes": [
    {
      "method": "GET",
      "path": "/customer-access/:caseId"
    },
    {
      "method": "GET",
      "path": "/customer-access/:caseId/service-report/:reportId"
    }
  ]
}
```

Failure summaries remain sanitized:

```json
{
  "registered": false,
  "messageKey": "customerAccess.unavailable",
  "customerVisible": false,
  "reasonCode": "mount_target_invalid"
}
```

Accepted failure `reasonCode` values:

- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

## Final Synthetic Mounted Route Behavior

- Synthetic mounted route tests cover both accepted routes.
- Accepted routes dispatch only for `GET`.
- Unsupported methods `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, and `HEAD` do not dispatch.
- Near-match, trailing-slash, extra-segment, internal, and alias-style paths do not dispatch.
- `caseId` and `reportId` are path-param only.
- Query/body/header/cookie aliases cannot supply or override identifiers.
- Missing or malformed identifiers return HTTP `404` sanitized unavailable.
- Service-deny, not-found, and query-failure paths return HTTP `404` sanitized unavailable.
- Unmatched method/path cases return the current synthetic unmatched HTTP `404` sanitized unavailable convention.
- Existence or non-existence details for cases and reports are not exposed.

## DTO And Response Contracts

### Case Overview Allow Response

Top-level keys:

- `status`
- `messageKey`
- `customerVisible`
- `data`

Nested data:

- `data.serviceReport`

Allowed `serviceReport` keys:

- `caseNo`
- `finalAppointmentId`
- `publicReportId`
- `status`
- `summary`

### Service-Report Allow Response

Allowed `serviceReport` keys:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

Allowed public attachment item keys:

- `attachmentId`
- `label`
- `mimeType`

### Safe-Deny Envelope

Unavailable responses use:

- HTTP `404`
- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

## Narrow Runtime Source Correction

Task2093 made one narrow correction in `src/routes/customerAccessRoutes.js`:

- A service-report route middleware wrapper snapshots route params before existing context middleware runs.
- After existing context middleware completes, the wrapper restores only `reportId` onto `req.params`.
- This preserves `:reportId` for the projection handler.
- This does not change the `customerAccessContext` contract.
- `customerAccessContext.params` remains `caseId`-only for params/context purposes.
- No new route was added.
- No service-report projection behavior changed beyond intended route-param delivery.

## Non-Leakage Boundaries

Mounted route runtime guards preserve these non-leakage boundaries:

- no raw `req` or `request`
- no headers, rawHeaders, body, rawBody, query, params object, cookies, socket, connection, or ip
- no user, session, auth, channel, or access raw containers
- no tokens or authorization values
- no phone, address, email, or LINE raw identity values
- no provider payloads or raw payloads
- no debug, stack, or SQL
- no internal, private, or admin-only fields
- no DB rows or query metadata
- no handler functions, raw router, raw dbClient, projectionService source, or facade function source in registration summaries
- no partial routes in failure summaries

## Next Runtime Branch Candidates

These are candidates only, not authorization:

- Customer Access dependency/audit logging boundary
- Customer Access real repository adapter preparation
- Customer Access OpenAPI/contract test preparation
- Customer Access production mount readiness gate
- Engineer Mobile next runtime hardening branch

## Handoff Notes

- Start the next branch only after explicit PM authorization.
- Keep the 7 held historical docs untracked and untouched.
- Preserve the no-real-smoke, no-server/listener, no-network, no-DB, and no-Zeabur/env boundary unless PM explicitly changes scope.
- Preserve Customer Access route, context, adapter, case overview, and service-report projection contracts listed above unless PM explicitly authorizes a bounded change.

## Verification

- Run `git diff --check -- docs/task-2098-customer-access-mounted-route-runtime-guard-final-handoff-no-runtime-change.md`.
- Run `git status --short --branch`.
- Node tests are not required for this docs-only handoff unless source or test files change.
