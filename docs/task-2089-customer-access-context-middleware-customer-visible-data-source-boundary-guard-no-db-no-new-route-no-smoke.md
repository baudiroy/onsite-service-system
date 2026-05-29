# Task2089 - Customer Access Context Middleware customerVisibleData Source Boundary Guard

## Scope

- Customer Access context middleware `customerVisibleData` source boundary only.
- No DB, no migration, no route creation, no route mount change, no smoke, no listener, no Zeabur/env inspection, no provider, no admin, no AI/RAG, no billing, no package changes.
- The 7 held historical docs remain untracked and untouched.

## Approved Source

The only approved middleware source location for `customerVisibleData` is:

- `customerAccessContextInput.customerVisibleData`

After that source is selected, Task2088 deep allowlist rules still apply:

- `customerVisibleData`: `serviceReport`
- `customerVisibleData.serviceReport`: `caseNo`, `finalAppointmentId`, `publicReportId`, `status`, `summary`

## Alias And Raw Source Behavior

If customer-visible-looking data exists only in aliases or raw request locations, middleware output emits an empty safe `customerVisibleData` object.

Denied aliases include `customerData`, `visibleData`, `publicData`, `publicCustomerData`, `customer_visible_data`, `customer_visible`, `report`, `serviceReport`, `data.serviceReport`, `payload.customerVisibleData`, `context.customerVisibleData`, `auth.customerVisibleData`, `access.customerVisibleData`, and `channel.customerVisibleData`.

Denied raw request locations include `req.body`, `req.query`, `req.headers`, `req.cookies`, `req.params`, `req.auth`, `req.access`, `req.channel`, `req.user`, `req.session`, `req.locals`, `req.context`, request aliases, and arbitrary top-level request fields.

The middleware does not merge customer-visible data from multiple sources and does not allow raw request aliases to override the approved source.

## Malformed Source Behavior

Missing approved source, non-plain approved source, throwing getters, `Date`, `Error`, Buffer-like, thenable, class, function, and malformed values produce the current safe convention: empty `customerVisibleData` or omission of unsafe nested approved fields.

Raw malformed values do not leak into downstream context or response JSON.

## Regression Boundaries

- Task2087 top-level context sections remain `params`, `auth`, `channel`, `access`, and `customerVisibleData`.
- Task2088 deep allowlist remains `serviceReport` with `caseNo`, `finalAppointmentId`, `publicReportId`, `status`, and `summary`.
- `GET /customer-access/:caseId` behavior remains compatible with Task2080 through Task2086.
- `GET /customer-access/:caseId/service-report/:reportId` remains compatible with existing service-report projection context handling.
- No route path, DB/query, facade/controller approved-source, projection, route registration, smoke, provider, admin, AI/RAG, billing, or package behavior is changed.

## Verification

- Targeted Customer Access middleware and static tests cover approved-source-only behavior, alias denial, raw request source denial, no raw merge/override, malformed source handling, and regression boundaries.
- `git diff --check` remains required before commit.
