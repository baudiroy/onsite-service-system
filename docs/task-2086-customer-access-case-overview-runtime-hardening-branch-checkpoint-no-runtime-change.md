# Task2086 - Customer Access Case Overview Runtime Hardening Branch Checkpoint

## Scope

- Docs-only checkpoint for accepted Task2080 through Task2085.
- No runtime code, test code, package, route, mount, DB, migration, SQL, smoke, Zeabur/env, listener, provider, admin, AI/RAG, or billing changes.
- The 7 held historical docs remain untracked and untouched.

## Accepted Task Summary

### Task2080 - HTTP Boundary Safe-Deny Guard

- `GET /customer-access/:caseId` is protected by a case overview HTTP boundary.
- `caseId` is accepted only from the original route params snapshot / `request.params.caseId`.
- Controller-to-facade DTO keys are limited to:
  - `caseId`
  - `customerAccessContext`
- Invalid identifiers, invalid context, and boundary failures map to HTTP 404 sanitized unavailable.

### Task2081 - Facade Result Boundary

- Facade throws, rejected thenables, and malformed facade results map to HTTP 404 sanitized unavailable.
- Valid allow responses are rebuilt from explicit allowlists.
- Raw facade results and raw `serviceReport` objects are not passed through, spread, or serialized.

### Task2082 - Facade Input DTO And Context Strict Guard

- Facade input DTO keys are limited to:
  - `caseId`
  - `customerAccessContext`
- `customerAccessContext.params.caseId` must match the top-level `caseId`.
- Accepted `customerAccessContext` sections are:
  - `params`
  - `auth`
  - `channel`
  - `access`
  - `customerVisibleData`
- Policy flags require exact boolean `true`.
- Malformed context and malformed input fail closed before facade/dependency call.

### Task2083 - serviceReport Output DTO Allowlist

- Final top-level response keys are:
  - `status`
  - `messageKey`
  - `customerVisible`
  - `data`
- Final `data` keys are:
  - `serviceReport`
- Final `serviceReport` keys are:
  - `caseNo`
  - `finalAppointmentId`
  - `publicReportId`
  - `status`
  - `summary`
- Raw and unknown `serviceReport` fields are omitted.

### Task2084 - Status/Summary Approved Source Contract

- Customer-visible `status` is sourced only from `serviceReport.status`.
- Customer-visible `summary` is sourced only from `serviceReport.summary`.
- Absent or invalid approved fields are omitted.
- There is no fallback to raw, internal, AI, provider, or debug fields.

### Task2085 - Identifier Approved Source Contract

- Customer-visible `caseNo` is sourced only from `serviceReport.caseNo`.
- Customer-visible `finalAppointmentId` is sourced only from `serviceReport.finalAppointmentId`.
- Customer-visible `publicReportId` is sourced only from `serviceReport.publicReportId`.
- Absent or invalid approved fields are omitted.
- There is no fallback to raw, internal, route, or context aliases.

## Current Case Overview Contracts

### Route

- `GET /customer-access/:caseId`

### Controller/Facade Input DTO

- `caseId`
- `customerAccessContext`

### Valid Allow Response Keys

- top-level: `status`, `messageKey`, `customerVisible`, `data`
- `data`: `serviceReport`
- `serviceReport`: `caseNo`, `finalAppointmentId`, `publicReportId`, `status`, `summary`

### Sanitized Unavailable Envelope

- HTTP status: `404`
- `status`: `deny`
- `messageKey`: `customerAccess.unavailable`
- `customerVisible`: `false`
- `data`: `null`
- `error.messageKey`: `customerAccess.unavailable`

### Approved Source Fields

- `status` <- `serviceReport.status`
- `summary` <- `serviceReport.summary`
- `caseNo` <- `serviceReport.caseNo`
- `finalAppointmentId` <- `serviceReport.finalAppointmentId`
- `publicReportId` <- `serviceReport.publicReportId`

### Non-Leakage Boundary

The case overview response must not expose:

- raw `req` / `request` / `headers` / `query` / `body` / `cookies` / `params` object / `user` / `session` / `socket` / `connection` / `auth`
- raw `customerAccessContext`
- raw facade result or raw `serviceReport` object
- raw DB row, DB result, or query metadata
- customer phone/address raw identity
- LINE identity
- internal notes, engineer notes, diagnosis notes, or completion notes
- AI draft/generated summary
- provider payload, raw payload, debug, stack, SQL, tokens, or headers
- private/admin-only fields

## Regression Boundaries

- Do not change `GET /customer-access/:caseId/service-report/:reportId`.
- Do not change Task2058 through Task2070 service report projection contracts.
- Do not change Task2072 through Task2079 route registration/mount contracts.
- Do not introduce DB, migration, smoke, global mount, provider, admin, AI/RAG, billing, or package work.

## Verification

- Run `git diff --check -- docs/task-2086-customer-access-case-overview-runtime-hardening-branch-checkpoint-no-runtime-change.md`.
- Run `git status --short --branch`.
- Node tests are not required for this checkpoint unless source or test files change.
