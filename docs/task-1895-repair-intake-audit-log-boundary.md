# Task1895 Repair Intake Audit Log Boundary

Status: implemented with injected synthetic audit writer support. No DB execution.

## Current Baseline

- Accepted baseline: `origin/main` = `1f73d863c25bd3433432059127059d68560b9eb2`.
- Current Repair Intake safe planning boundary remains source-level only:
  - `POST /repair-intake/drafts/:draftId/case/plan`
- No route mount was added by this task.
- No submit route was added by this task.
- No formal Case creation, linking, persistence, or draft merge was added by this task.
- No DB, SQL, migration, seed, smoke, Zeabur probe, deploy, provider, AI/RAG, billing, Completion Report / Field Service Report, `finalAppointmentId`, or customer-visible publication action was performed.

## Implemented Boundary

- Added `repairIntakeDraftToCasePlanningAuditBoundary`.
- The boundary builds an internal-only audit event for Repair Intake draft-to-Case planning decisions.
- The boundary uses an injected writer only.
- The boundary does not construct a DB client, read `DATABASE_URL`, import app/server, mount routes, or call providers.
- The planning service can optionally call the audit boundary after producing a planning decision.
- Audit failures are swallowed by the planning service and do not change public/service planning responses.
- Audit data is not returned from the safe route envelope.

## Safe Audit Event Metadata

The planning audit event may include only safe metadata:

- `eventType`
- `action`
- `visibility`
- `draftId`
- `organizationId`
- `actorId`
- `requestId`
- `sourceBoundary`
- `decisionStatus`
- `planningStatus`
- `reasonCode`
- `requiredActions`
- `eligible`
- `caseCreationAllowed`
- `candidateReady`
- `duplicateDecisionStatus`
- `occurredAt`

## Excluded Audit Data

The audit boundary excludes:

- Raw draft rows.
- Raw contact payloads.
- Raw phone or address values.
- Provider payloads or tokens.
- `DATABASE_URL`, `JWT_SECRET`, private keys, provider keys, passwords, or Zeabur secrets.
- SQL and stack traces.
- Billing internals.
- AI/RAG provider output.
- Formal Case internals.
- Completion Report / Field Service Report internals.
- `finalAppointmentId`.
- Customer-visible publication fields.

## Decision Coverage

The boundary supports safe audit metadata for:

- Planning allow path.
- Review-required duplicate decisions.
- Blocked duplicate decisions.
- Invalid audit context.
- Missing audit writer.
- Audit writer failure.

## Safety Boundaries

- Draft remains a draft.
- Duplicate candidate remains a candidate.
- Confirmed duplicate does not auto-merge.
- Reporter, customer, billing contact, and on-site contact override separation remains unchanged.
- No customer, contact, billing, draft, appointment, Case, Completion Report, Field Service Report, or publication mutation was added.
- Organization isolation and request context stay in the planning metadata boundary.

## Verification Summary

- Added synthetic unit tests for audit event building and injected writer behavior.
- Added static guard tests for no DB, migration, route, provider, AI, billing, formal Case, Completion Report / FSR, `finalAppointmentId`, or customer-visible publication coupling.
- Extended planning service tests to prove audit recording is optional, internal-only, and failure-safe.
- Extended safe route tests to prove audit metadata is not exposed in public route envelopes.

## Next Gate

Task1896 may harden runtime behavior and static guards after PM acceptance of Task1895.
