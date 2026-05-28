# Task1850 - Engineer Mobile Bootstrap Repository Adapter Synthetic DB Client Integration

## Summary

Purpose: integration-style unit coverage for bootstrap to repository adapter to synthetic DB client.

Task1850 adds test-only evidence that the accepted runtime chain can flow through:

`runtime bootstrap -> repositoryAdapter -> repository persistence-port bridge -> integrated persistence writer -> application service -> synthetic dbClient.execute(operationIntent)`

The task does not change production runtime code. It composes existing accepted modules only.

## Files

- `tests/engineerMobile/engineerMobileVisitActionBootstrapRepositoryAdapter.integration.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionBootstrapRepositoryAdapterIntegrationBoundary.static.test.js`
- `docs/task-1850-engineer-mobile-bootstrap-repository-adapter-synthetic-db-client-integration-no-db.md`

## Modules Composed

- runtime bootstrap
- repository adapter
- repository persistence-port bridge through bootstrap
- integrated persistence writer through bootstrap
- application service through bootstrap
- injected synthetic DB client only

## Covered Behavior

- Service-only bootstrap with `repositoryAdapter` and synthetic `dbClient` accepts `engineer_mobile.start_travel`.
- Synthetic `dbClient.execute(operationIntent)` is called exactly once for accepted `start_travel`.
- Operation intent contains only sanitized appointment update fields.
- Service-only bootstrap with `repositoryAdapter` accepts `engineer_mobile.record_visit_result`.
- `record_visit_result` operation intent includes safe `visitResult`.
- Planner or policy denial does not call `dbClient.execute`.
- Denied output preserves safe `reasonCode`.
- Mounted bootstrap with injected synthetic mount target and repository adapter processes an accepted request.
- Mounted request path still does not require Express, route index, app/server, or listen.
- Synthetic DB client failure returns sanitized failure and does not expose raw DB/client error.
- Synthetic DB client unknown object result fails closed.
- Inputs are not mutated.
- Operation intent does not include phone, address, LINE, customer raw data, private notes, or report draft fields.
- Operation intent does not include raw SQL strings, DB URLs, credentials, provider payloads, customer-visible publication fields, Completion Report / Field Service Report fields, or `finalAppointmentId` mutation fields.
- No provider sending, AI/RAG, billing/settlement, admin, package, seed, route, global mount, smoke, DB execution, SQL execution, migration, or real persistence behavior appears.

## Boundary Confirmation

- No DB execution.
- No SQL execution.
- No raw SQL strings.
- No SQL statement builder.
- No migration.
- No DDL.
- No schema/index changes.
- No DB client import.
- No real DB connection.
- Injected synthetic DB client only.
- No real persistence.
- No real persistence/write execution.
- No audit log persistence.
- No provider sending.
- No route/global mount.
- No controller/global route/global mount.
- No route index changes.
- No `src/app.js`, `src/server.js`, or `routes/index.js` changes.
- No Express import/listen.
- No smoke test.
- No AI/RAG.
- No billing/settlement.
- No admin UI.
- No package or lockfile changes.
- No seed changes.
- No permission table migration.
- No Completion Report / Field Service Report creation.
- No Completion Report / Field Service Report approval.
- No Completion Report / Field Service Report publication.
- No finalAppointmentId creation.
- No finalAppointmentId mutation.
- No customer-visible publication.
- No staging, commit, or push.
- No cleanup/reset/stash/revert.
- No touching the 7 held historical docs.

## Sanitized Operation Intent Boundary

The integration test observes only the synthetic operation intent passed to the injected `dbClient.execute` function. The intent is an operation descriptor for tests, not a DB command.

Allowed operation intent fields are limited to the repository adapter's sanitized operation shape:

- operation kind and operation name
- appointment entity type and id
- organization id
- engineer mobile action
- appointment update parameters such as mobile visit status, visit result, updated by, updated at
- sanitized audit event metadata when bootstrap integrates audit with the repository bridge

The operation intent excludes customer phone, address, LINE raw data, customer raw data, private notes, report drafts, provider payloads, credentials, DB URLs, raw SQL strings, Completion Report fields, Field Service Report fields, customer publication fields, and `finalAppointmentId` mutation fields.

## Future Sequence

- keep synthetic integration green,
- disposable DB dry-run only after Task1840-style explicit approval,
- real repository SQL implementation only after migration 023 dry-run acceptance,
- global route/mount only after separate approval.

## Verification Scope

Task1850 should be verified with:

- `node --test tests/engineerMobile/engineerMobileVisitActionBootstrapRepositoryAdapter.integration.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionBootstrapRepositoryAdapterIntegrationBoundary.static.test.js`
- scoped regression tests for runtime bootstrap, repository adapter, repository bridge, integrated persistence writer, and repository contract
- `npm run check`
- `git diff --check` limited to the three Task1850 files
- precise credential/sensitive scan limited to the three Task1850 files
