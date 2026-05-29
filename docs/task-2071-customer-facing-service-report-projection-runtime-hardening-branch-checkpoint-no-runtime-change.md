# Task2071 - Customer-Facing Service Report Projection Runtime Hardening Branch Checkpoint

## Purpose

This checkpoint records the accepted Task2058-Task2070 customer-facing service report projection runtime hardening branch before moving to the next runtime branch.

This is a docs-only checkpoint. It records accepted invariants and does not authorize runtime, source, test, DB, route, provider, admin, AI, billing, package, smoke, Zeabur, or environment changes.

## Accepted Task2058-Task2070 Results

- Task2058: `serviceSummary` is customer-visible only from `approved_service_summary`.
- Task2059: `serviceReport` uses a top-level response allowlist.
- Task2060: `publicAttachments` items use only `attachmentId`, `label`, and `mimeType`.
- Task2061: `completionTime` is customer-visible only from `completion_time`.
- Task2062: malformed projection rows and row containers fail closed.
- Task2063: the HTTP boundary guards malformed service results and thrown service errors.
- Task2064: the HTTP request input allowlist passes only `dbClient`, `customerAccessContext`, `caseId`, and `reportId`; request identifiers come from `request.params.caseId` and `request.params.reportId`.
- Task2065: `customerAccessContext` uses a strict primitive guard.
- Task2066: top-level `caseId` and `reportId` identifier consistency is guarded; invalid inputs fail before DB query.
- Task2067: DB result shape and cardinality are guarded; exactly one row is required.
- Task2068: DB query throw/reject and malformed `dbClient` cases fail closed with safe deny.
- Task2069: query parameter binding uses frozen query config values in this order: `[organizationId, customerId, caseId, reportId]`.
- Task2070: query config immutability and no-mutation behavior are guarded.

## Accepted Customer-Facing Projection Contracts

The accepted `serviceReport` top-level keys are:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

The accepted `publicAttachments` item keys are:

- `attachmentId`
- `label`
- `mimeType`

The accepted safe-deny/unavailable envelope is:

- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

Malformed or unauthorized service results map to HTTP 404 through the current HTTP boundary.

No raw row, raw result, raw request, raw context, query config, query values, SQL text, raw error, provider payload, AI payload, internal fields, or private fields may become customer-visible.

## Explicit Non-Goals

Task2071 does not authorize:

- DB changes
- migrations
- SQL or query text changes
- query parameter order changes
- route, controller, or global mount changes
- provider sending
- Zeabur, environment, or smoke checks
- admin frontend work
- AI/RAG/model calls
- billing or settlement work
- package changes
- source/runtime code changes
- test code changes
- cleanup, reset, stash, revert, or mutation of the 7 held historical untracked docs

## Verification Plan

Expected verification for this docs-only checkpoint:

- `git diff --check -- docs/task-2071-customer-facing-service-report-projection-runtime-hardening-branch-checkpoint-no-runtime-change.md`
- `git status --short --branch`

Node tests are not expected because this task changes no source or test files.

DB, migration, smoke, endpoint, Zeabur, environment, and secret inspection commands are not authorized.
