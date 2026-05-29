# Task2092 - Customer Access HTTP Context Adapter Runtime Guard Checkpoint

## Scope

- Docs-only checkpoint for accepted Task2091.
- No runtime code, test code, package, route, mount, DB, migration, SQL, smoke, Zeabur/env, listener, provider, admin, AI/RAG, or billing changes.
- The 7 held historical docs remain untracked and untouched.

## Accepted Task2091 Summary

The Customer Access HTTP context adapter boundary now accepts only the narrow case overview DTO shape:

- `caseId`
- `customerAccessContext`

The adapter does not accept raw HTTP-like or request-like sources as approved input sources, including `params`, `query`, `body`, `headers`, `cookies`, `request`, `req`, `user`, `session`, `auth`, `channel`, or `access` aliases.

`customerAccessContext.params.caseId` must match the top-level `caseId`. Missing, malformed, non-plain, or mismatched adapter input fails closed before raw aliases can influence the mapped request-like facade input.

Malformed inputs fail closed, including:

- missing or null input
- non-plain input
- arrays
- strings, numbers, and booleans
- `Date`
- `Error`
- Buffer-like values
- thenables
- functions
- class instances
- malformed or mismatched `customerAccessContext`

For invalid case overview requests, the controller boundary still prevents facade invocation. For malformed adapter input, the adapter returns a safe deny-oriented request-like input with all identifiers omitted and all authorization booleans false.

## Safe-Deny Envelope Contract

The customer-facing unavailable envelope remains:

- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

Raw context, headers, tokens, cookies, request containers, errors, stacks, debug payloads, provider payloads, internal fields, private fields, and admin-only fields must not leak into adapter output or customer-facing deny/unavailable responses.

## customerVisibleData Boundary

The adapter preserves the Customer Access `customerVisibleData` deep allowlist:

- `customerVisibleData.serviceReport.caseNo`
- `customerVisibleData.serviceReport.finalAppointmentId`
- `customerVisibleData.serviceReport.publicReportId`
- `customerVisibleData.serviceReport.status`
- `customerVisibleData.serviceReport.summary`

Unknown top-level or nested customer-visible keys are denied. Malformed approved values are omitted safely.

The adapter does not merge or override from aliases such as:

- `customerData`
- `visibleData`
- `publicData`
- `report`
- `serviceReport`
- `data`
- `payload`
- `auth.customerVisibleData`
- `access.customerVisibleData`
- `channel.customerVisibleData`

## Regression Boundaries

- Do not change context middleware contracts from Task2087 through Task2090.
- Do not change case overview contracts from Task2080 through Task2086.
- Do not change service-report projection contracts from Task2058 through Task2070.
- Do not change route registration and mount contracts from Task2072 through Task2079.
- Do not change route paths or add new routes.
- Do not introduce DB, migration, SQL, smoke, global mount, provider, admin, AI/RAG, billing, package, Zeabur/env, listener, app/server, or public route work.

## Verification

- Run `git diff --check -- docs/task-2092-customer-access-http-context-adapter-runtime-guard-checkpoint-no-runtime-change.md`.
- Run `git status --short --branch`.
- Node tests are not required for this docs-only checkpoint unless source or test files change.
