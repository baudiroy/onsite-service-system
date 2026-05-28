# Task1846 - Engineer Mobile Visit Action Repository Persistence Port Bridge

## Summary

Task1846 adds a pure CommonJS repository persistence port bridge for engineer mobile visit actions.

The bridge allows the accepted integrated persistence path to use an injected repository adapter as a `persistencePort` without creating a DB client, importing DB libraries, executing SQL, or touching global runtime wiring.

## Files

- `src/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridge.js`
- `tests/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridge.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridgeBoundary.static.test.js`
- `docs/task-1846-engineer-mobile-visit-action-repository-persistence-port-bridge-injected-repository-no-db.md`

## Purpose

The bridge connects:

`Task1832 integrated persistence writer -> Task1830 persistence port writer adapter -> Task1846 repository bridge -> injected repositoryAdapter.persist(...)`

It keeps the existing integrated writer and persistence port adapter shape intact while providing a safe bridge to the Task1842 repository contract and the Task1844 repository adapter.

## Relationship To Accepted Layers

- Task1832 integrated persistence writer builds transition and audit envelopes.
- Task1830 persistence port writer adapter validates persistence port input and calls an injected `persistencePort.persist(...)`.
- Task1842 repository contract validates repository-safe transition and audit envelopes.
- Task1844 repository adapter accepts an injected DB-client-like executor in isolated future wiring, but Task1846 does not create that client or connect to it.

Task1846 normalizes accepted builder envelope variants into repository-safe envelope kinds, validates with `validateEngineerMobileVisitActionRepositoryInput`, and only then calls the injected `repositoryAdapter.persist(...)`.

## Runtime Boundary

- Injected repository adapter only.
- No DB execution.
- No SQL execution.
- No raw SQL strings.
- No SQL statement builder.
- No migration.
- No DDL.
- No schema/index changes.
- No global mount.
- No route registration.
- No Express import.
- No DB client import.
- No real DB connection.
- No controller changes.
- No `src/app.js`, `src/server.js`, or `routes/index.js` changes.
- No listen call.
- No smoke test.
- No real persistence.
- No write execution.
- No audit log persistence.
- No provider sending.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package or lockfile changes.
- No seed changes.
- No permission table migration.
- No completion report creation.
- No completion report approval.
- No completion report publication.
- No Field Service Report creation.
- No Field Service Report approval.
- No Field Service Report publication.
- No finalAppointmentId creation.
- No finalAppointmentId mutation.
- No customer-visible publication.
- No staging / commit / push.
- No cleanup/reset/stash/revert.
- No touching the 7 held historical docs.

## Sensitive Field Exclusion

The bridge copies only the fields accepted by the repository contract:

- transition envelope identity, action, and mobile visit patch fields
- transition audit context IDs
- audit event identity, actor, organization, timestamp, case, appointment, and request IDs

The bridge does not pass through phone, address, LINE raw data, customer raw data, private notes, report draft fields, provider payloads, DB metadata, raw repository results, raw errors, stack traces, credentials, customer-visible publication fields, Completion Report fields, Field Service Report fields, or `finalAppointmentId` mutation fields.

## Failure Handling

- Missing `repositoryAdapter` or `repositoryAdapter.persist` returns `repository_adapter_required`.
- Contract validation denial preserves the contract reason code.
- Repository adapter failure, thrown error, or unknown result returns `repository_adapter_write_failed`.
- Returned failures are sanitized and do not expose raw repository results or thrown errors.

## Future Sequence

- optional bootstrap wiring with injected repository bridge
- disposable DB dry-run only after Task1840-style approval
- real SQL repository implementation only after migration 023 dry-run acceptance
- global route/mount only after separate approval

## Verification Scope

Task1846 should be verified with:

- bridge unit tests
- bridge static boundary tests
- Task1842 repository contract regression tests
- Task1830 persistence port writer adapter regression tests
- Task1832 integrated persistence writer regression tests
- `npm run check`
- precise credential/sensitive scan limited to the four Task1846 files
