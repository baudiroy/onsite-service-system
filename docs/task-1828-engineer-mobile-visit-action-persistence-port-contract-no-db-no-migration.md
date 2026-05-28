# Task1828 - Engineer Mobile Visit Action Persistence Port Contract No DB No Migration

## Scope

Task1828 adds a pure runtime contract module for the future Engineer Mobile visit action persistence boundary.

Allowed files:

- `src/engineerMobile/engineerMobileVisitActionPersistencePortContract.js`
- `tests/engineerMobile/engineerMobileVisitActionPersistencePortContract.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionPersistencePortContractBoundary.static.test.js`
- `docs/task-1828-engineer-mobile-visit-action-persistence-port-contract-no-db-no-migration.md`

## Runtime Shape

The contract module validates only sanitized envelopes for Engineer Mobile visit action persistence port input:

- transition patch envelope
- audit event envelope
- combined persistence port input

The module exports:

- `ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_CONTRACT_KIND`
- `validateEngineerMobileVisitActionTransitionPatchEnvelope`
- `validateEngineerMobileVisitActionAuditEventEnvelope`
- `validateEngineerMobileVisitActionPersistencePortInput`

Transition patch validation accepts appointment-only envelopes with safe root fields and a patch limited to:

- `mobileVisitStatus`
- `visitResult`
- `updatedBy`
- `updatedAt`

Audit event validation accepts appointment-only envelopes with supported Engineer Mobile visit action audit actions and an audit event limited to:

- `action`
- `entityType`
- `entityId`
- `actorId`
- `organizationId`
- `occurredAt`
- `caseId`
- `appointmentId`
- `requestId`

Combined validation validates the transition patch first, optionally validates the audit event, and rejects organization or entity mismatches.

## Boundary

- No DB
- No SQL
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
- Pure persistence port contract only

## Safety Notes

The contract module does not copy raw appointments, customer contact data, private notes, report draft fields, provider payloads, storage metadata, raw failures, completion report data, final appointment mutation fields, or customer-visible publication fields into its output.

The contract is a validation boundary only. It does not create a storage writer, register a route, mount Express, execute SQL, create audit log persistence, send provider messages, create reports, approve reports, publish reports, or mutate final appointment fields.

## Verification Plan

- Unit tests cover accepted transition patch statuses, accepted audit actions, unsafe extra fields, completion-report and final-appointment boundaries, combined validation, sensitive-output exclusion, and input non-mutation.
- Static boundary tests enforce no imports, no forbidden runtime patterns, and required task document boundary phrases.
- Practical chain verification should include Task1828 tests plus Task1818 transition patch builder tests and Task1822 audit event builder tests.
