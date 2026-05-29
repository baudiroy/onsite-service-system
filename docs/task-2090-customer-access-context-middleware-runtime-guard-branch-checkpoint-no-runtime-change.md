# Task2090 - Customer Access Context Middleware Runtime Guard Branch Checkpoint

## Scope

- Docs-only checkpoint for accepted Task2087 through Task2089.
- No runtime code, test code, package, route, mount, DB, migration, SQL, smoke, Zeabur/env, listener, provider, admin, AI/RAG, or billing changes.
- The 7 held historical docs remain untracked and untouched.

## Accepted Task Summary

### Task2087 - Context Middleware Output DTO Allowlist

- The downstream `customerAccessContext` top-level sections are:
  - `params`
  - `auth`
  - `channel`
  - `access`
  - `customerVisibleData`
- Nested context keys are:
  - `params.caseId`
  - `auth.organizationId`
  - `auth.customerId`
  - `auth.customerIdentityVerified`
  - `channel = {}`
  - `access.organizationScopeMatched`
  - `access.caseLinkedToCustomer`
  - `access.publicationAllowed`
  - `access.customerVisiblePolicyPassed`
- Raw request containers are not copied downstream, including `req`, `request`, `headers`, `rawHeaders`, `body`, `rawBody`, `query`, `cookies`, `session`, `user`, `socket`, `connection`, provider payloads, or env data.
- Phone, address, LINE identity, token, authorization, cookie, and session-secret values are not emitted.
- Raw policy results, rule lists, deny reasons, entitlement details, org graph, provider/subcontractor details, and debug traces are not emitted.

### Task2088 - customerVisibleData Deep Allowlist

- Allowed `customerVisibleData` keys:
  - `serviceReport`
- Allowed `customerVisibleData.serviceReport` keys:
  - `caseNo`
  - `finalAppointmentId`
  - `publicReportId`
  - `status`
  - `summary`
- Unknown top-level and nested `customerVisibleData` keys are denied.
- Raw identity/contact/internal/provider/AI/policy/debug/private fields are denied.
- Malformed `customerVisibleData` source values produce safe empty `{}` or omit unsafe nested approved fields according to the current safe convention.

### Task2089 - customerVisibleData Source Boundary

- Approved `customerVisibleData` source location:
  - `customerAccessContextInput.customerVisibleData`
- There is no alias fallback from `customerData`, `visibleData`, `publicData`, `publicCustomerData`, `customer_visible_data`, `customer_visible`, `report`, `serviceReport`, `data.serviceReport`, `payload.customerVisibleData`, `context.customerVisibleData`, `auth.customerVisibleData`, `access.customerVisibleData`, or `channel.customerVisibleData`.
- There is no raw request source from `body`, `query`, `headers`, `cookies`, `params`, `user`, `session`, `locals`, `context`, or arbitrary top-level request fields.
- Raw aliases cannot merge with or override the approved source.
- Missing or malformed approved source yields safe empty `customerVisibleData` `{}`.

## Current Accepted Customer Access Context Contract

### Top-Level Sections

- `params`
- `auth`
- `channel`
- `access`
- `customerVisibleData`

### Nested Keys

- `params.caseId`
- `auth.organizationId`
- `auth.customerId`
- `auth.customerIdentityVerified`
- `channel = {}`
- `access.organizationScopeMatched`
- `access.caseLinkedToCustomer`
- `access.publicationAllowed`
- `access.customerVisiblePolicyPassed`
- `customerVisibleData.serviceReport.caseNo`
- `customerVisibleData.serviceReport.finalAppointmentId`
- `customerVisibleData.serviceReport.publicReportId`
- `customerVisibleData.serviceReport.status`
- `customerVisibleData.serviceReport.summary`

### Approved customerVisibleData Source

- `customerAccessContextInput.customerVisibleData`

### Non-Leakage Boundary

The context middleware output must not expose:

- raw `req` / `request` / `headers` / `rawHeaders` / `body` / `rawBody` / `query` / params object / `cookies` / `socket` / `connection` / `ip` / `user` / `session` / raw auth object
- raw phone, address, email, LINE, or customer identity beyond approved `auth.organizationId` and `auth.customerId`
- tokens, authorization headers, cookies, or session secrets
- provider payloads, raw payloads, debug, stack, or SQL
- internal, private, or admin-only fields
- raw policy result, deny reason, rule list, entitlement details, org graph, service provider, or subcontractor details
- AI draft/generated summary unless explicitly approved in a future design

## Regression Boundaries

- Do not change service-report projection contracts from Task2058 through Task2070.
- Do not change route registration/mount contracts from Task2072 through Task2079.
- Do not change case overview contracts from Task2080 through Task2086.
- Do not change route paths or add new routes.
- Do not introduce DB, migration, smoke, global mount, provider, admin, AI/RAG, billing, or package work.

## Verification

- Run `git diff --check -- docs/task-2090-customer-access-context-middleware-runtime-guard-branch-checkpoint-no-runtime-change.md`.
- Run `git status --short --branch`.
- Node tests are not required for this checkpoint unless source or test files change.
