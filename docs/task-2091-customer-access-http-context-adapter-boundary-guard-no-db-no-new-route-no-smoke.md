# Task2091 - Customer Access HTTP Context Adapter Boundary Guard

## Scope

- Customer Access HTTP context adapter boundary only.
- No DB, no migration, no route creation, no route mount change, no smoke, no listener, no Zeabur/env inspection, no provider, no admin, no AI/RAG, no billing, no package changes.
- The 7 held historical docs remain untracked and untouched.

## Adapter Input DTO

The adapter accepts only the narrow case overview DTO shape:

- `caseId`
- `customerAccessContext`

The adapter reads no raw HTTP-style wrapper or alias sources, including `req`, `request`, `params`, `query`, `body`, `headers`, `cookies`, `user`, `session`, `socket`, `connection`, or arbitrary top-level request containers.

`customerAccessContext.params.caseId` must match the top-level `caseId`. Missing, malformed, or mismatched identifiers fail closed before any raw alias can be used.

## Fail-Closed Output

Missing, null, non-plain, array, string, number, boolean, `Date`, `Error`, Buffer-like, thenable, function, class instance, malformed context, and mismatched context inputs produce the safe request-like deny input:

- `organizationId: undefined`
- `caseId: undefined`
- `customerId: undefined`
- `isCustomerIdentityVerified: false`
- `isCaseLinkedToCustomer: false`
- `isPublicationAllowed: false`
- `isCustomerVisiblePolicyPassed: false`
- `organizationScopeMatches: false`
- `channelIdentityPresent: false`
- `scopedChannelIdentityPresent: false`
- `customerVisibleData: {}`

Raw context values, headers, tokens, cookies, request containers, facade errors, malformed values, stacks, SQL-like strings, and debug payloads are not exposed in fail-closed output.

## Valid Output DTO

For valid DTO input, the adapter emits only these request-like facade input keys:

- `organizationId`
- `caseId`
- `customerId`
- `isCustomerIdentityVerified`
- `isCaseLinkedToCustomer`
- `isPublicationAllowed`
- `isCustomerVisiblePolicyPassed`
- `organizationScopeMatches`
- `channelIdentityPresent`
- `scopedChannelIdentityPresent`
- `customerVisibleData`

Boolean policy and identity fields must be exact booleans. Raw nested values do not promote identity, linkage, publication, or policy state.

## customerVisibleData Boundary

The adapter preserves the Customer Access `customerVisibleData` deep allowlist:

- `customerVisibleData.serviceReport.caseNo`
- `customerVisibleData.serviceReport.finalAppointmentId`
- `customerVisibleData.serviceReport.publicReportId`
- `customerVisibleData.serviceReport.status`
- `customerVisibleData.serviceReport.summary`

Unknown top-level or nested customer-visible keys are denied. Malformed approved values are omitted safely, and the adapter does not merge or override from customer-visible aliases such as `customerData`, `visibleData`, `publicData`, `report`, `serviceReport`, `data`, `payload`, `auth.customerVisibleData`, `access.customerVisibleData`, or `channel.customerVisibleData`.

## Regression Boundaries

- Preserve case overview contracts from Task2080 through Task2086.
- Preserve context middleware contracts from Task2087 through Task2090.
- Do not change service-report projection, route registration, global mount, app/server/public routes, DB/query, provider, admin, AI/RAG, billing, package, smoke, or Zeabur/env behavior.

## Verification

- Targeted Customer Access adapter, controller, mounted route, context middleware, and static tests cover the adapter DTO boundary, raw HTTP-like source denial, malformed fail-closed behavior, customer-visible allowlist, no alias merge/override, and existing route/controller regressions.
- `git diff --check` remains required before commit.
