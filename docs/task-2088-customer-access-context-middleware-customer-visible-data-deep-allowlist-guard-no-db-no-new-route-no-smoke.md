# Task2088 - Customer Access Context Middleware customerVisibleData Deep Allowlist Guard

## Scope

- Customer Access context middleware `customerVisibleData` boundary only.
- No DB, no migration, no route creation, no route mount change, no smoke, no listener, no Zeabur/env inspection, no provider, no admin, no AI/RAG, no billing, no package changes.
- The 7 held historical docs remain untracked and untouched.

## Deep Allowlist

Final allowed `customerVisibleData` keys are:

- `serviceReport`

Final allowed `customerVisibleData.serviceReport` keys are:

- `caseNo`
- `finalAppointmentId`
- `publicReportId`
- `status`
- `summary`

Unknown top-level `customerVisibleData` keys and unknown nested `serviceReport` keys are omitted even when they do not match a forbidden pattern.

## Malformed Source Behavior

Malformed or non-plain `customerVisibleData` source values produce an empty safe object:

- `null`
- array
- string
- number
- boolean
- `Date`
- `Error`
- Buffer-like
- thenable
- function
- class instance
- non-plain object

Malformed or unsafe approved nested values are omitted. This includes object, array, `Error`, `Date`, Buffer-like, thenable, function, class instance, SQL-looking string, token/header-looking string, and stack-like string values.

## Deny Boundary

`customerVisibleData` does not emit raw identity/contact fields, internal/provider/AI/debug fields, policy details, arbitrary customer fields, or private/admin-only fields.

Examples of denied fields include phone/address/email/LINE identity, customerId, token/authorization/cookie/session data, internal notes, engineer notes, diagnosis/completion notes, private report body, AI draft/generated summary, provider/raw payloads, debug, stack, SQL, policy results, deny reasons, rule lists, entitlement details, org graph data, service provider data, and subcontractor details.

## Regression Boundaries

- Task2087 top-level context sections remain `params`, `auth`, `channel`, `access`, and `customerVisibleData`.
- `GET /customer-access/:caseId` behavior remains compatible with Task2080 through Task2086.
- `GET /customer-access/:caseId/service-report/:reportId` remains compatible with existing service-report projection context handling.
- No route path, DB/query, facade/controller approved-source, projection, route registration, smoke, provider, admin, AI/RAG, billing, or package behavior is changed.

## Verification

- Targeted Customer Access middleware and static tests cover the deep allowlist, unknown-key denial, sensitive identity denial, internal/provider/AI/policy denial, malformed source handling, and regression boundaries.
- `git diff --check` remains required before commit.
