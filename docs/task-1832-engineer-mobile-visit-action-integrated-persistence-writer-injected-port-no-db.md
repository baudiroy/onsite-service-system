# Task1832 - Engineer Mobile Visit Action Integrated Persistence Writer Injected Port No DB

## Scope

Task1832 adds a pure integrated writer for Engineer Mobile visit actions.

Allowed files:

- `src/engineerMobile/engineerMobileVisitActionIntegratedPersistenceWriter.js`
- `tests/engineerMobile/engineerMobileVisitActionIntegratedPersistenceWriter.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionIntegratedPersistenceWriterBoundary.static.test.js`
- `docs/task-1832-engineer-mobile-visit-action-integrated-persistence-writer-injected-port-no-db.md`

## Runtime Shape

The integrated writer coordinates accepted pure pieces only:

```text
transitionIntent
-> transition patch builder
auditIntent optional
-> audit event builder
-> persistence port writer adapter
-> injected persistencePort.persist(...)
```

The module exports:

- `createEngineerMobileVisitActionIntegratedPersistenceWriter`
- `ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND`

Factory shape:

```js
createEngineerMobileVisitActionIntegratedPersistenceWriter({ persistencePort, now })
```

Returned writer method:

```js
write({ transitionIntent, auditIntent })
```

The writer returns sanitized envelopes only. It preserves transition builder reason codes, audit builder reason codes, and persistence port writer adapter reason codes such as:

- `appointment_id_required`
- `entity_id_required`
- `organization_mismatch`
- `entity_mismatch`
- `persistence_port_required`
- `persistence_port_write_failed`
- `persistence_port_written`

## Boundary

- No DB
- No SQL
- No migration
- No global mount
- No route registration
- No Express import
- No repository import
- Injected persistence port only
- No real persistence implementation
- No audit log persistence implementation
- No provider sending
- No completion report creation
- No completion report approval
- No completion report publication
- No finalAppointmentId mutation
- No customer-visible publication

## Safety Notes

The writer does not expose raw persistence results, raw failures, stack traces, SQL, storage metadata, provider payloads, customer data, report draft fields, customer-visible publication fields, completion report fields, field service report fields, or final appointment mutation fields.

The writer copies safe transition and audit envelopes before delegating to the accepted Task1830 persistence port writer adapter. It does not mutate input intents, generated envelopes, persistence payloads, or returned safe results.

## Verification Plan

- Unit tests cover missing injected persistence port, transition-only persistence, transition plus audit persistence, visit result persistence, transition builder denial, audit builder denial, persistence writer adapter failure, thrown persistence failure, unknown object failure, safe payload shape, sensitive-output exclusion, input non-mutation, persistence payload mutation isolation, and no completion report / field service report / final appointment behavior.
- Static boundary tests enforce the three accepted imports and forbidden runtime patterns.
- Practical verification should include Task1832 tests plus Task1818, Task1822, and Task1830 regression tests.
