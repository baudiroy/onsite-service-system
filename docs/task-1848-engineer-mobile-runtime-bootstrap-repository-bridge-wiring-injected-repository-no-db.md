# Task1848 - Engineer Mobile Runtime Bootstrap Repository Bridge Wiring

## Summary

Task1848 updates the Engineer Mobile visit action runtime bootstrap so an injected `repositoryAdapter` can be composed through the accepted repository persistence-port bridge and then through the existing integrated persistence writer.

This keeps runtime bootstrap dependency injection only. It does not create a DB client, execute DB work, mount global routes, or change API shape.

## Files

- `src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js`
- `docs/task-1848-engineer-mobile-runtime-bootstrap-repository-bridge-wiring-injected-repository-no-db.md`

## Composition

The accepted repository path is:

`repositoryAdapter -> repository persistence-port bridge -> integrated persistence writer -> application service transitionWriter`

The bootstrap now resolves transition persistence in this order:

1. Direct `transitionWriter`.
2. Injected `persistencePort` through the integrated persistence writer.
3. Injected `repositoryAdapter` through the repository persistence-port bridge and integrated persistence writer.
4. Injected `patchWriter` through the transition writer adapter.
5. Missing transition writer source.

The bootstrap resolves audit behavior in this order:

1. Direct `auditWriter`.
2. Integrated audit handling when `persistencePort` is used.
3. Integrated audit handling when `repositoryAdapter` is used.
4. Injected `auditEventWriter` through the audit writer adapter.
5. Missing audit writer source.

## Runtime Boundary

- Injected repository adapter only.
- Injected repository bridge only.
- Injected dependencies only.
- Injected writers only.
- No DB execution.
- No SQL execution.
- No raw SQL.
- No SQL statement builder.
- No migration.
- No DDL.
- No schema/index changes.
- No DB client creation.
- No DB client import.
- No real DB connection.
- No real persistence implementation.
- No audit log persistence implementation.
- No global mount.
- No route registration.
- No Express import.
- No controller changes.
- No `src/app.js`, `src/server.js`, or `routes/index.js` changes.
- No listen call.
- No smoke test.
- No provider sending.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package or lockfile changes.
- No seed changes.
- No separate audit event writer on repository bridge path.
- No completion report creation.
- No completion report approval.
- No completion report publication.
- No Field Service Report creation.
- No Field Service Report approval.
- No Field Service Report publication.
- No finalAppointmentId creation.
- No finalAppointmentId mutation.
- No customer-visible publication.
- No cleanup/reset/stash/revert.
- No touching the 7 held historical docs.

## Sanitized Writer Source Summary

The bootstrap returns only the existing sanitized `writerSources` summary. It reports source labels such as `direct`, `integrated_persistence_writer`, `repository_bridge_integrated_writer`, `patch_writer_adapter`, `audit_event_writer_adapter`, or `missing`.

It does not expose repository adapter internals, repository payloads, persistence payloads, audit event internals, raw errors, DB details, provider details, customer data, phone, address, LINE raw data, private notes, report drafts, Completion Report fields, Field Service Report fields, or `finalAppointmentId` fields.

## Non-mutation Boundary

Bootstrap creation does not call direct writers, `patchWriter`, `auditEventWriter`, `persistencePort`, or `repositoryAdapter`. It only composes injected adapters.

The service and mounted handler tests preserve injected dependency shape and request payloads. The bootstrap does not mutate injected writers, `repositoryAdapter`, `persistencePort`, mount target, actor, appointment, or request payload.

## Verification Scope

Task1848 should be verified with:

- runtime bootstrap unit tests
- runtime bootstrap static boundary tests
- repository persistence-port bridge regression tests
- integrated persistence writer regression tests
- repository contract regression tests
- `npm run check`
- precise credential/sensitive scan limited to the Task1848 files
