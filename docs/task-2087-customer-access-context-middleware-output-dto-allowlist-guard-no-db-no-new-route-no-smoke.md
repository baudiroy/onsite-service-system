# Task2087 - Customer Access Context Middleware Output DTO Allowlist Guard

## Scope

- Customer Access context middleware output boundary only.
- No DB, no migration, no route creation, no route mount change, no smoke, no listener, no Zeabur/env inspection, no provider, no admin, no AI/RAG, no billing, no package changes.
- The 7 held historical docs remain untracked and untouched.

## Middleware Output DTO

The downstream `customerAccessContext` is rebuilt as a plain sanitized object with exactly these top-level sections:

- `params`
- `auth`
- `channel`
- `access`
- `customerVisibleData`

Nested emitted keys are:

- `params`: `caseId`
- `auth`: `organizationId`, `customerId`, `customerIdentityVerified`
- `channel`: no nested identity keys are emitted
- `access`: `organizationScopeMatched`, `caseLinkedToCustomer`, `publicationAllowed`, `customerVisiblePolicyPassed`
- `customerVisibleData`: sanitized customer-visible data with forbidden raw/private fields removed recursively

## Behavior

- Route params snapshot behavior is preserved. If original route params are present, the middleware keeps the sanitized route `caseId` in `req.customerAccessRouteParams` and `req.params`.
- The middleware no longer merges existing raw `req.auth`, `req.channel`, or `req.access` containers into downstream request fields.
- Raw request-like containers are not copied into `customerAccessContext`.
- Sensitive identity fields are not emitted from middleware output, including phone/address raw values, LINE identity values, tokens, authorization headers, cookies, and session secrets.
- Policy output is minimized to the existing safe booleans only:
  - `organizationScopeMatched`
  - `customerIdentityVerified`
  - `caseLinkedToCustomer`
  - `publicationAllowed`
  - `customerVisiblePolicyPassed`
- Raw policy results, deny reasons, rule lists, entitlement details, org graph details, provider/subcontractor details, and debug traces are not emitted.
- Malformed or throwing middleware input fails closed into the existing sanitized unavailable path without leaking raw error values.

## Regression Boundaries

- `GET /customer-access/:caseId` behavior remains compatible with Task2080 through Task2086.
- `GET /customer-access/:caseId/service-report/:reportId` remains compatible with existing service-report projection context handling.
- No service-report projection contract changes from Task2058 through Task2070.
- No route registration/mount contract changes from Task2072 through Task2079.
- No facade/controller approved-source behavior changes.

## Verification

- Targeted Customer Access middleware, adapter, controller, mounted route, service-report handler, and static tests cover the output allowlist and regression boundaries.
- `git diff --check` remains required before commit.
