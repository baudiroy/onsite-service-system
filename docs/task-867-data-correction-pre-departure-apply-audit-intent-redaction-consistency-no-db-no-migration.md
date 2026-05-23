# Task 867 - Data Correction Pre-Departure Apply Audit Intent Redaction Consistency

Status: completed

## Scope

Task 867 reviewed the `pre_departure_apply` audit metadata path for safe redaction and consistency. The existing implementation does not expose a public `auditIntent` API field. For this task, audit intent is treated as the existing injected `auditWriter` metadata payload.

No real audit sink, database write, migration, API shape, permission model, admin frontend, provider, AI/RAG, billing, settlement, or smoke-test runtime was added.

## Coverage Added

The targeted data correction unit tests now assert that `pre_departure_apply` audit metadata stays safe across:

- Successful pre-departure apply.
- Permission-denied apply.
- Malformed validation-failed apply.
- Post-departure apply denial.
- Correction writer failure.

The service, app factory, and server bootstrap entry points now check that audit metadata only contains safe fields such as:

- `organizationId`
- `caseId`
- `appointmentId` when present in the safe request context
- actor `userId` and `role`
- correction `fieldKey` and `fieldGroup`
- decision / reason / safe message metadata

The tests also confirm the audit metadata does not include raw correction payloads, before/after values, raw phone/address/LINE identifiers, token/secret/DB URL values, `finalAppointmentId`, stack details, writer internals, or full request payloads.

## Behavior Notes

- Permission-denied and validation-failed apply paths remain fail-closed before calling the injected audit writer.
- Post-departure apply still blocks correction application and does not call contact-log or dispatch-note writers from the apply path.
- Correction writer failure still returns a safe failed envelope, while previously recorded audit metadata remains redacted.
- No new public audit API field was introduced.
- Correction writer/manual writer behavior from Tasks 863-866 is unchanged.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 124 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 649 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1977 passed / 0 failed.
- `git diff --check -- src/dataCorrection/preDepartureCorrectionApplicationService.js src/dataCorrection/dataCorrectionRequestService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-867-data-correction-pre-departure-apply-audit-intent-redaction-consistency-no-db-no-migration.md` - PASS.
