# Task1844 Engineer Mobile Visit Action Repository Adapter / Injected DB Client Only / No DB Execution

Status: implemented as an injected-client repository adapter skeleton with unit and static boundary tests.

## Purpose

Task1844 adds the Engineer Mobile visit action repository adapter skeleton. The adapter maps validated Task1842 repository contract input into a sanitized parameterized operation intent for an injected DB client.

This is still not real DB persistence. The only write-like call is to an injected synthetic `dbClient.execute(operationIntent)` used by unit tests. The adapter does not import a DB client, create a connection, build raw query text, register routes, or wire global runtime.

## Allowed Files

- `src/engineerMobile/engineerMobileVisitActionRepositoryAdapter.js`
- `tests/engineerMobile/engineerMobileVisitActionRepositoryAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionRepositoryAdapterBoundary.static.test.js`
- `docs/task-1844-engineer-mobile-visit-action-repository-adapter-injected-db-client-no-db-execution.md`

The 7 held historical untracked docs remain untouched.

## Relationship To Task1842

Task1842 created the pure repository contract:

- validates sanitized transition patch and optional audit event envelopes
- rejects unsafe fields and completion / final appointment boundaries
- normalizes repository result envelopes without leaking raw details

Task1844 imports only `./engineerMobileVisitActionRepositoryContract` and uses:

- `validateEngineerMobileVisitActionRepositoryInput`
- `normalizeEngineerMobileVisitActionRepositoryResult`

The adapter does not import Task1828 directly and does not introduce a repository implementation with real DB behavior.

## Injected DB Client Only

Factory:

```js
createEngineerMobileVisitActionRepositoryAdapter({ dbClient })
```

Returned adapter:

```js
persist({ transitionPatchEnvelope, auditEventEnvelope })
```

Boundary:

- Injected DB client only
- Synthetic DB client tests only
- No DB client import
- No real DB connection
- No DB execution
- No SQL execution
- No raw SQL strings
- No SQL statement builder
- No migration
- No DDL
- No schema/index changes

If `dbClient.execute` is missing, the adapter returns a sanitized `db_client_required` failure.

## Operation Intent Shape

After Task1842 contract validation succeeds, the adapter builds a sanitized parameterized operation intent:

```js
{
  operationKind: 'engineer_mobile.visit_action_repository.operation_intent',
  operationName: 'persist_engineer_mobile_visit_action',
  entityType: 'appointment',
  entityId: '...',
  organizationId: '...',
  action: 'engineer_mobile.start_travel',
  parameters: {
    mobileVisitStatus: 'traveling',
    visitResult: undefined,
    updatedBy: '...',
    updatedAt: '...',
    auditEvent: {
      eventKind: 'engineer_mobile.visit_action_audit_event',
      action: 'engineer_mobile.start_travel.allowed',
      entityType: 'appointment',
      entityId: '...',
      actorId: '...',
      organizationId: '...',
      occurredAt: '...'
    }
  }
}
```

The intent contains sanitized values only. It does not include phone, address, LINE identifiers, customer raw data, private notes, provider payloads, credentials, DB URLs, raw query text, report draft fields, customer-visible publication fields, Completion Report fields, Field Service Report fields, or `finalAppointmentId` mutation fields.

## Result Handling

The adapter treats these injected-client success variants as persisted success:

- `undefined`
- `null`
- `true`
- `{ ok: true }`
- `{ accepted: true }`
- `{ persisted: true }`
- `{ written: true }`
- `{ appointmentUpdated: true }`

Failure variants return sanitized `repository_write_failed`:

- `false`
- `{ ok: false }`
- `{ accepted: false }`
- `{ persisted: false }`
- `{ written: false }`
- `{ appointmentUpdated: false }`
- `{ error: ... }`
- thrown errors
- unknown object shapes

On success, the adapter returns a sanitized normalized repository result from Task1842 normalization. Raw DB result, raw errors, stack traces, DB metadata, provider payloads, customer data, report draft fields, customer-visible publication fields, Completion Report fields, Field Service Report fields, and `finalAppointmentId` mutation fields are not exposed.

## Synthetic DB-Client Tests Only

Task1844 tests use a fake injected object with an `execute(operationIntent)` function. This validates the adapter contract and operation intent without a real DB connection.

The test suite confirms:

- missing `dbClient` / missing `dbClient.execute` returns `db_client_required`
- valid transition-only and transition-plus-audit inputs call `dbClient.execute` exactly once
- validation denial reason codes are preserved
- mismatched organization/entity inputs do not call `dbClient.execute`
- success and failure variants are normalized safely
- thrown errors and unknown objects fail closed
- operation intents do not contain sensitive/raw/publication/completion/final appointment fields
- inputs are not mutated

## Forbidden Scope

- No DB / SQL execution / psql
- No DB execution
- No SQL execution
- No SQL statement builder
- No raw SQL strings
- No migration / DDL / schema/index changes
- No DB client import
- No real DB connection
- No controller changes
- No global mount
- No route registration
- No global route registration
- No src/app.js, src/server.js, or routes/index.js changes
- No Express import
- No listen call
- No smoke test
- No real persistence/write execution
- No audit log persistence
- No provider sending
- No AI / RAG
- No billing / settlement
- No admin UI
- No package.json or lockfile changes
- No seed changes
- No permission table migration
- No completion report creation
- No completion report approval
- No completion report publication
- No Field Service Report creation
- No Field Service Report approval
- No Field Service Report publication
- No finalAppointmentId creation or mutation
- No finalAppointmentId mutation
- No customer-visible publication
- No staging / commit / push
- No cleanup/reset/stash/revert
- No touching the 7 held historical docs

## Future Sequence

Future work must remain separately approved and bounded:

1. disposable DB dry-run only after Task1840-style approval
2. real repository SQL implementation only after migration 023 dry-run acceptance
3. runtime bootstrap wiring with injected repository port
4. global route/mount only after separate approval

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileVisitActionRepositoryAdapter.unit.test.js
node --test tests/engineerMobile/engineerMobileVisitActionRepositoryAdapterBoundary.static.test.js
node --test tests/engineerMobile/engineerMobileVisitActionRepositoryContract.unit.test.js tests/engineerMobile/engineerMobileVisitActionRepositoryContractBoundary.static.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileVisitActionRepositoryAdapter.js tests/engineerMobile/engineerMobileVisitActionRepositoryAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionRepositoryAdapterBoundary.static.test.js docs/task-1844-engineer-mobile-visit-action-repository-adapter-injected-db-client-no-db-execution.md
```

A precise credential/sensitive scan should be limited to the four touched Task1844 files.
