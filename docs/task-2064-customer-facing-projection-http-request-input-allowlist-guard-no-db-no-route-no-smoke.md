# Task2064 — Customer-Facing Projection HTTP Request Input Allowlist Guard

## Scope

- No DB changes.
- No migrations, SQL, seeds, schema, indexes, psql, db commands, dry-run, or migration apply.
- No repository query changes.
- No projection service behavior changes.
- No route/controller/global mount changes.
- No `src/app.js`, `src/server.js`, `public.routes.js`, or route registration changes.
- No Zeabur, env, runtime smoke, endpoint probes, provider sending, admin frontend, AI/RAG/provider/model calls, or billing/settlement/payment/invoice/package work.
- The 7 held historical untracked docs were left untouched.

## Request Input Guard

The customer-facing service report HTTP handler now builds an explicit projection service input DTO before invoking the projection service.

The only top-level keys passed to the projection service are:

- `dbClient`
- `customerAccessContext`
- `caseId`
- `reportId`

The accepted public report identifier request location remains `request.params.reportId`. The accepted case identifier request location remains `request.params.caseId`.

The sanitized `customerAccessContext` passed to the projection service is a flat plain object with only:

- `organizationId`
- `customerId`
- `caseId`
- `organizationScopeMatched`
- `customerIdentityVerified`
- `caseLinkedToCustomer`
- `publicationAllowed`
- `customerVisiblePolicyPassed`

The projection service no longer receives raw request containers such as `req`, `request`, `headers`, `query`, `params`, `body`, `cookies`, `ip`, `socket`, `connection`, `auth`, `access`, `user`, `session`, provider payloads, debug fields, or arbitrary request/context objects.

Missing, empty, non-string, SQL-looking, token/header-looking, object, array, number, boolean, Date, Error, Buffer-like, Promise-like, or otherwise malformed route identifiers fail closed before projection service invocation and return the existing sanitized unavailable safe-deny HTTP response.

## Regression Notes

- Task2058 `serviceSummary` remains sourced only from `approved_service_summary`.
- Task2061 `completionTime` remains sourced only from `completion_time`.
- Task2060 public attachment item keys remain `attachmentId`, `label`, and `mimeType`.
- Task2059 `serviceReport` top-level allowlist remains unchanged.
- Task2062 malformed projection row fail-closed behavior remains unchanged.
- Task2063 malformed service result and thrown/rejected service error HTTP guard remains unchanged.
