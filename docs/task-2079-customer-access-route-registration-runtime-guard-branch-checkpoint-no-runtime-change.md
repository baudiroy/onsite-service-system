# Task2079 Customer Access Route Registration Runtime Guard Branch Checkpoint

## Scope

- Type: docs-only checkpoint / no runtime change.
- Branch baseline: `main` at `8d6f71f446051eb80a16668ec609975bb7b97f6e`.
- Covered accepted tasks: Task2072 through Task2078.
- Purpose: record the completed Customer Access route registration/runtime guard branch before the next runtime branch.

## Accepted Task Summary

### Task2072 Public Report Route Contract Guard

- Accepted public service report route:
  - `GET /customer-access/:caseId/service-report/:reportId`
- Projection identifiers come only from:
  - `request.params.caseId`
  - `request.params.reportId`
- Projection service input DTO keys:
  - `dbClient`
  - `customerAccessContext`
  - `caseId`
  - `reportId`

### Task2073 Internal Test Route Mount Boundary Guard

- Internal test mount remains explicitly injected app/router only.
- Internal test path:
  - `GET /__internal/customer-access/service-reports/:caseId/:reportId`
- Internal mount preserves the Task2072 identifier and service input DTO boundary.
- No global mount, listener startup, DB connection, env read, provider call, or `src/app.js` / `src/server.js` / `public.routes.js` mount path was authorized.

### Task2074 App Adapter Mount Target Contract Guard

- App adapter accepts only an explicitly injected safe plain-object target through `app` or `router`.
- Supported mount API:
  - `get(path, handler)`
- Explicitly not supported:
  - `route().get`
  - `register`
  - listener or global fallback
- Invalid or malformed targets fail closed without route registration.
- Importing the adapter does not register routes, start a listener, or create DB/provider/env dependencies.

### Task2075 App Adapter Registration Result Contract Guard

- Successful app adapter registration result:
  - `{ registered: true, method: 'GET', path }`
- Failed app adapter registration result:
  - `{ registered: false, messageKey: 'customerAccess.unavailable', customerVisible: false, reasonCode }`
- Guarded reason codes:
  - `mount_target_invalid`
  - `db_client_invalid`
  - `route_registration_failed`
- The handler is registered on the injected target but is not returned in the adapter result.
- Registration results must not expose raw mount targets, handlers, route objects, thrown errors, stacks, request-like containers, provider/debug fields, DB/env data, or arbitrary target properties.

### Task2076 Routes Registration Summary Guard

- Successful `registerCustomerAccessRoutes` summary:
  - `{ registered: true, routes: [{ method: 'GET', path: '/customer-access/:caseId' }, { method: 'GET', path: '/customer-access/:caseId/service-report/:reportId' }] }`
- Failed route registration summary:
  - `{ registered: false, messageKey: 'customerAccess.unavailable', customerVisible: false, reasonCode }`
- Guarded reason codes at Task2076:
  - `mount_target_invalid`
  - `route_registration_failed`
- Route summary must not expose raw router/app/target, route object, handler/function source, request-like fields, dbClient, env/Zeabur values, provider/debug/internal/private fields, tokens/header-looking strings, SQL-looking strings, or raw errors/stacks.

### Task2077 Routes Dependency Injection Contract Guard

- `registerCustomerAccessRoutes` uses only caller-injected dependencies.
- It must not import, create, discover, or fall back to global app/router/server/public routes/global registry, DB pool/client factory, env/Zeabur secrets, provider clients, AI/RAG/model providers, or billing dependencies.
- Importing the route module does not register routes or create runtime dependencies.
- Route registration does not execute `dbClient.query`.
- Route registration does not call an injected `projectionService`.
- Missing dbClient preserves existing request-time safe-deny behavior.
- Explicit malformed dbClient fails before route registration with sanitized failure.
- Guarded reason codes after Task2077:
  - `mount_target_invalid`
  - `db_client_invalid`
  - `route_registration_failed`

### Task2078 Dependency Failure Atomicity Guard

- First-route registration failure returns:
  - `{ registered: false, messageKey: 'customerAccess.unavailable', customerVisible: false, reasonCode: 'route_registration_failed' }`
- Second-route registration failure returns the same sanitized failure even if the injected target records the first route before throwing.
- Caller-visible summary is fail-closed.
- Failure summaries do not contain partial success or partial route details.
- No rollback framework or global route registry was introduced.
- Injected target side effects cannot be rolled back by this route module; the accepted contract is that the returned summary never reports partial success.

## Current Accepted Route And Registration Contracts

### Public Customer Routes

- Customer access route:
  - `GET /customer-access/:caseId`
- Customer service report route:
  - `GET /customer-access/:caseId/service-report/:reportId`

### Internal Test Route

- `GET /__internal/customer-access/service-reports/:caseId/:reportId`

### Projection Service Input DTO

- `dbClient`
- `customerAccessContext`
- `caseId`
- `reportId`

### App Adapter Mount Target

- Explicitly injected safe plain object only.
- Supported API only:
  - `get(path, handler)`

### Sanitized HTTP Unavailable Envelope

- HTTP status: `404`
- Body:
  - `status: 'deny'`
  - `messageKey: 'customerAccess.unavailable'`
  - `customerVisible: false`
  - `data: null`
  - `error.messageKey: 'customerAccess.unavailable'`

### Registration Summary Non-Leakage

Registration summaries must not expose:

- raw target/router/app objects
- raw dbClient
- raw projectionService
- handler/function source
- route objects
- request-like containers
- thrown error message, stack, or cause
- env/Zeabur values
- provider/debug/internal/private fields
- SQL-looking strings
- token/header-looking strings
- partial route arrays in failure summaries

## Explicit Non-Goals And Not Authorized

This checkpoint does not authorize:

- runtime/source changes
- test changes
- package or lockfile changes
- new route creation
- global route mounting
- rollback framework or global route registry work
- `src/app.js`, `src/server.js`, or `public.routes.js` changes
- DB execution, DB connection, migrations, SQL, schema, seeds, psql, or dry-run/apply work
- repository query text or parameter changes
- route/controller/handler/projection service behavior changes
- smoke or endpoint probes
- Zeabur/env inspection
- listener/server startup
- provider sending: LINE/SMS/email/webhook/app push
- admin frontend work
- AI/RAG/model/provider calls
- billing/settlement/payment/invoice work
- cleanup/reset/stash/revert of the 7 held historical untracked docs

## Verification Plan

- `git diff --check -- docs/task-2079-customer-access-route-registration-runtime-guard-branch-checkpoint-no-runtime-change.md`
- `git status --short --branch`
- No node tests expected because this checkpoint is docs-only and does not touch source or tests.
- No DB, migration, smoke, env, listener, provider, admin, AI, billing, or package commands.
