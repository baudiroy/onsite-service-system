# Task1822 Engineer Mobile Visit Action Audit Event Builder No DB

## Scope

Task1822 adds a pure audit event builder for the Engineer Mobile Visit Action flow.

Pipeline boundary:

```text
auditIntent -> safe audit event object only
```

This task does not write audit logs, does not create persistence, and does not wire a route, controller, repository, provider, or global mount.

## Files

- `src/engineerMobile/engineerMobileVisitActionAuditEventBuilder.js`
- `tests/engineerMobile/engineerMobileVisitActionAuditEventBuilder.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionAuditEventBuilderBoundary.static.test.js`
- `docs/task-1822-engineer-mobile-visit-action-audit-event-builder-no-db.md`

The 7 held historical untracked docs remain untouched.

## Runtime Shape

The builder exports:

- `buildEngineerMobileVisitActionAuditEvent`
- `ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND`
- `ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS`

The function is pure and synchronous. It accepts `{ auditIntent, now }` and returns a sanitized success or failure envelope.

Supported audit actions:

- `engineer_mobile.start_travel.allowed`
- `engineer_mobile.arrive.allowed`
- `engineer_mobile.start_work.allowed`
- `engineer_mobile.finish_work.allowed`
- `engineer_mobile.record_visit_result.allowed`

Accepted input fields are limited to:

- `action`
- `entityType`
- `entityId`
- `actorId`
- `organizationId`

Optional safe identifiers:

- `caseId`
- `appointmentId`
- `requestId`

Unknown input fields are not copied into the output.

## Boundary

- No DB
- No migration
- No global mount
- No route registration
- No Express import
- No repository import
- No real persistence
- No audit log persistence
- No provider sending
- No completion report creation
- No completion report approval
- No completion report publication
- No finalAppointmentId mutation
- No customer-visible publication
- Pure audit event builder only

## Validation

Stable denial reason codes:

- `audit_intent_required`
- `audit_action_required`
- `unsupported_audit_action`
- `entity_type_required`
- `unsupported_entity_type`
- `entity_id_required`
- `organization_id_required`
- `actor_id_required`
- `completion_report_boundary`
- `final_appointment_boundary`

The only supported `entityType` is `appointment`.

## Verification

Planned verification:

```bash
node --test tests/engineerMobile/engineerMobileVisitActionAuditEventBuilder.unit.test.js tests/engineerMobile/engineerMobileVisitActionAuditEventBuilderBoundary.static.test.js
npm run check
```

Also run a precise credential/sensitive scan limited to the four Task1822 files. Boundary-test and doc literals may be reported as intentional false positives only if refined connection-string, token-shaped, and credential-assignment scans are clean.
