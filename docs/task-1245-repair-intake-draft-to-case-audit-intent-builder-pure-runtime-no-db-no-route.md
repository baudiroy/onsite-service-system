# Task1245 — Repair Intake Draft-to-Case Audit Intent Builder / Pure Runtime / No DB No Route

Status: local implementation ready for PM review.

## Scope

Task1245 adds a pure audit intent builder for the Repair Intake draft-to-Case flow:

- `src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuditIntentBuilderBoundary.static.test.js`

The builder returns a safe audit intent object only. It does not persist audit logs, write database records, mount routes, register controllers, start app/server runtime, or send data to external providers.

## Runtime Boundary

This task prepares the future route approval checklist item for audit event shape. It does not approve or implement future audit writer/repository integration.

Future integration with an audit writer, repository, route, controller, app/server mount, auth/session/JWT, or database persistence requires separate PM approval.

## Behavior

`buildRepairIntakeDraftToCaseAuditIntent(input)` supports these phases:

- `attempt`
- `authorized`
- `denied`
- `submitted`
- `failed`

Required safe scalar fields:

- `organizationId`
- `actorId`
- `repairIntakeDraftId`

Optional safe scalar passthrough fields:

- `caseId`
- `resultStatus`
- `reasonCode`
- `source`
- `occurredAt`

Invalid input returns a safe invalid envelope with `auditIntent: null`; it does not throw raw errors or expose unsafe payload details.

## Sensitive Field Exclusion

The implementation does not copy or return unsafe input fields such as SQL/query details, stack traces, raw errors, database rows, permission traces, provider payloads, audit records, phone, address, email, raw body, or raw request content.

The builder does not mutate input and returns a detached result object.

## Explicit Non-goals

- No audit persistence.
- No audit writer or repository integration.
- No database access.
- No migration.
- No SQL dry-run or apply.
- No route/controller/app/server mount.
- No auth/session/JWT runtime.
- No provider sending.
- No customer-visible runtime.
- No admin/frontend changes.
- No AI/RAG.
- No billing/settlement.
- No smoke execution.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuditIntentBuilderBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- Unit/static tests pass.
- Existing full synthetic HTTP-envelope integration passes.
- Diff checks pass.
- Staged area remains empty.
- Latest commit before Task1245 remains `000cdb0 Document historical appointment dispatch source review`.
- Historical dirty tracked files remain unstaged and untouched.
