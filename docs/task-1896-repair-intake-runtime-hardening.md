# Task1896 Repair Intake Runtime Hardening

Status: implemented with synthetic tests and static boundary checks. No DB execution.

## Current Baseline

- Task1895 commit is the local parent for this task.
- Repair Intake safe planning boundary remains source-level only:
  - `POST /repair-intake/drafts/:draftId/case/plan`
- The boundary remains unmounted by this task.
- No submit route was added by this task.
- No formal Case creation, linking, persistence, or draft merge was added by this task.

## Hardened Areas

- Planning service response hardening:
  - Filters unsafe `reasonCode` text from injected eligibility evaluators.
  - Filters unsafe `requiredActions` from injected eligibility evaluators.
  - Filters unsafe `reasonCode` text from injected candidate builders.
  - Filters unsafe `requiredActions` from injected candidate builders.
  - Preserves request-scoped metadata for the optional internal audit boundary without exposing audit data in the service result.
- Safe route response hardening:
  - Filters unsafe planning result `reasonCode` text before public route response.
  - Filters unsafe planning result `requiredActions` before public route response.
  - Preserves existing safe-deny and review-required envelope behavior.
- Candidate builder hardening:
  - Filters unsafe preflight required actions.
  - Filters unsafe reference scalar values before candidate DTO output.
  - Keeps duplicate and contact-role output as candidates only.
- Contact role DTO hardening:
  - Filters unsafe role reference scalar values.
  - Filters unsafe safe-contact-summary fields while preserving masked summary fields.

## Static Boundary Checks

Added Task1896 static checks proving hardened files do not introduce:

- DB clients, SQL execution, migration, seed, or `npm run db`.
- Smoke tests or Zeabur probes.
- App/server/router mounting.
- Provider sending.
- AI/RAG execution.
- Billing provider execution.
- Formal Case creation, linking, submit route, or persistence.
- Completion Report / Field Service Report behavior.
- `finalAppointmentId` mutation.
- Customer-visible publication behavior.
- Draft merge or confirmed duplicate auto-merge behavior.

## Preserved Invariants

- Draft remains a draft.
- Duplicate candidate remains a candidate.
- Confirmed duplicate does not auto-merge.
- Reporter, customer, billing contact, and on-site contact override separation remains explicit.
- Route boundary remains unmounted unless a later task explicitly scopes mounting.
- No submit route exists in this task.
- Audit remains internal-only and is not route/customer-visible.
- Organization isolation is not bypassed.
- LINE is not treated as a global identity.

## Verification Summary

- Added unit coverage for unsafe evaluator and candidate-builder output sanitization.
- Added unit coverage for unsafe planning result sanitization before public route response.
- Added unit coverage for candidate builder and contact-role DTO unsafe scalar filtering.
- Added static coverage for no DB, migration, seed, smoke, Zeabur, route mount, provider, AI, billing, Case creation/linking, FSR, `finalAppointmentId`, publication, or draft merge behavior.

## Explicit Non-Actions

- No DB, SQL, psql, migration, seed, or migration dry-run.
- No runtime server start.
- No repair intake smoke.
- No Zeabur public endpoint probes.
- No Zeabur env changes or deploy.
- No package or lockfile changes.
- No admin frontend changes.
- No secrets printed.
- No provider, billing, or AI execution.

## Next Gate

Task1897 branch final review may run only after PM accepts Task1895 and Task1896.
