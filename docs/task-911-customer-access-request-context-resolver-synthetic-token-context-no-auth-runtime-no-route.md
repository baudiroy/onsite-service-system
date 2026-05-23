# Task 911 - Customer Access Request Context Resolver

## Status

Completed.

## Goal

Add a pure Customer Access request context resolver that converts a synthetic or pre-resolved request context into the minimal `customerAccessContext` shape needed by the Task908 projection service and Task909 HTTP-like handler.

This task does not implement login, session, JWT verification, route registration, a real DB lookup, or customer identity binding runtime.

## Modified Files

- `src/customerAccess/customerAccessRequestContextResolver.js`
- `tests/customerAccess/customerAccessRequestContextResolver.unit.test.js`
- `tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js`
- `docs/task-911-customer-access-request-context-resolver-synthetic-token-context-no-auth-runtime-no-route.md`

No `admin/src/`, `migrations/`, production route/controller/bootstrap, auth/session/JWT runtime, real user/customer identity repository, real DB/repository/transaction, provider, LINE/SMS/email/App push/webhook, AI/RAG/vector/search, billing/settlement, package/env/config/credential, smoke, or shared runtime file was modified.

## Implementation Summary

`customerAccessRequestContextResolver.js` exports:

- `resolveCustomerAccessContextFromRequest(request)`

The resolver:

- accepts only `request.customerAccessContext` or `request.syntheticCustomerAccessContext`
- fails closed when both context sources are present
- fails closed for missing request or missing synthetic/pre-resolved context
- fails closed for missing or invalid organization/customer identifiers
- fails closed for unauthorized context flags
- fails closed for malformed scoped case/report identifiers
- returns a normalized minimal context for valid synthetic/pre-resolved input
- emits `customerAccessContext: null` on failure
- does not copy raw request, raw customer profile, token/header/cookie, phone/address, LINE id, provider payload, AI payload, billing data, or internal notes
- does not mutate the request or input context

## Normalized Context Shape

Successful output is:

- `resolved: true`
- `messageKey: customerAccess.context.resolved`
- `customerVisible: false`
- `customerAccessContext` containing only:
  - `organizationId`
  - `customerId`
  - optional `caseId`
  - optional `reportId`
  - `params.caseId` / `params.reportId` when present
  - `auth.organizationId`
  - `auth.customerId`
  - `auth.customerIdentityVerified`
  - `access.organizationScopeMatched`
  - `access.caseLinkedToCustomer`
  - `access.publicationAllowed`
  - `access.customerVisiblePolicyPassed`

Failure output is generic and non-sensitive:

- `resolved: false`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `customerAccessContext: null`

## Explicit Non-scope

- No auth runtime.
- No login/session implementation.
- No JWT verification.
- No bearer token parsing as trusted identity.
- No cookie/session parsing as trusted identity.
- No customer identity binding runtime.
- No real DB.
- No DB execution.
- No repository lookup.
- No transaction.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL apply or dry-run.
- No route.
- No controller.
- No public API rollout.
- No API shape change.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.

## Verification

Commands to run:

```sh
node --test tests/customerAccess/customerAccessRequestContextResolver.unit.test.js
node --test tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js
node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js
node --test tests/customerAccess/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/customerAccess tests/customerAccess docs/task-911-customer-access-request-context-resolver-synthetic-token-context-no-auth-runtime-no-route.md
```

Current results:

- `node --test tests/customerAccess/customerAccessRequestContextResolver.unit.test.js`: PASS (12 tests)
- `node --test tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js`: PASS (6 tests)
- `node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`: PASS (8 tests)
- `node --test tests/customerAccess/*.js`: PASS (648 tests)
- `npm run check`: PASS
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS (2910 tests)
- `git diff --check -- src/customerAccess tests/customerAccess docs/task-911-customer-access-request-context-resolver-synthetic-token-context-no-auth-runtime-no-route.md`: PASS
