# Task1909 Depot Intake Repository Adapter / Injected DB Client

Status: implemented and verified locally with synthetic dbClient tests only. No real DB connection, migration, seed, smoke, Zeabur action, deploy, runtime server start, provider sending, billing, AI/RAG execution, customer-visible publication, admin frontend, package, or lockfile changes were made for this task.

## Scope

Task1909 adds a minimal Depot Intake SQL repository adapter using an injected `dbClient`.

The boundary is injected dbClient only.

Changed files:

- `src/repositories/DepotIntakeSqlRepositoryAdapter.js`
- `tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js`
- `tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js`
- `docs/task-1909-depot-intake-repository-adapter-injected-db-client.md`

## Repository Boundary

Adapter kind:

- `depot_workshop.depot_intake_sql_repository_adapter`

Factory:

- `createDepotIntakeSqlRepositoryAdapter({ dbClient })`

Methods:

- `findDepotIntakeState(input)`
- `recordDepotIntakeIntent(input)`

Task1909 intentionally keeps the repository read-only for depot intake state. `recordDepotIntakeIntent` fail-closes with `depot_intake_write_scope_not_approved` and does not query the injected client.

## Safe Read Scope

The read path uses existing `repair_intake_drafts` safe fields only:

- `safe_summary`
- `safe_metadata`
- `validation_errors_safe`

Supported workflow types:

- `depot`
- `carry_in`
- `mail_in`
- `pickup_delivery`

The repository returns normalized depot intake envelopes with safe metadata only:

- draft id
- organization id
- tenant id
- draft status
- source / source ref / intake source
- workflow type / service type
- brand id
- service provider id
- item/product/model/serial/issue summary refs
- depot status
- received timestamp
- return method
- validation status
- safe warnings
- created/updated timestamps

## Query And Isolation Properties

- Injected `dbClient` only.
- Supports injected `query` or `execute`.
- Uses parameterized query specs only.
- Query values are frozen.
- Requires `draftId`.
- Requires `organizationId`.
- Uses `organization_id = $2::uuid`.
- Uses optional tenant predicate through `$3::uuid`.
- Denies non-depot workflow rows as not found or denied.
- Denies brand or service-provider scope mismatch as not found or denied.
- Denies subcontractor scope until an explicit assignment/access relationship exists.

## Sanitization Properties

The adapter does not expose raw DB rows. It strips or omits unsafe fields such as:

- raw rows / raw payloads
- customer names / customer data
- phone / address
- provider payloads
- headers / authorization / cookies
- tokens / secrets
- SQL / stack traces
- `DATABASE_URL`
- `JWT_SECRET`
- Completion Report / Field Service Report markers
- `finalAppointmentId`

Client failures return sanitized envelopes and do not expose raw error messages.

## Deferred Scope

The following remain deferred because no dedicated depot/workshop schema or write semantics are approved in this task:

- depot/workshop status writes
- depot/workshop receipt / diagnosis / quote / work order / QC / return tables
- customer-visible depot/workshop publication
- subcontractor assignment visibility
- route wiring
- service orchestration
- audit write persistence
- DB-backed smoke
- migration or seed

## Safety Properties

- Synthetic dbClient unit tests only.
- No real DB connection.
- No DATABASE_URL usage.
- No global pool construction.
- No app/server import.
- No migration execution.
- No runtime start.
- No seed execution.
- No smoke execution.
- No Zeabur/deploy action.
- No provider sending.
- No LINE, SMS, email, app push, or webhook execution.
- No billing, AI/RAG, storage, or external provider execution.
- No assignment, appointment, case, or depot/workshop mutation in real runtime.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.
- No admin frontend/package/lockfile changes.

## Verification

Targeted tests:

- `node --test tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js`

Related readiness / permission tests:

- `node --test tests/security/fileAccessControlPolicy.unit.test.js tests/security/fieldVisibilityPolicy.unit.test.js tests/security/providerSecretGuard.unit.test.js tests/security/aiRetrievalGuardPolicy.unit.test.js tests/security/isoControlsFoundationalPolicies.integration.test.js tests/security/dataClassificationPolicy.unit.test.js tests/security/exportControlPolicy.unit.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next Task Recommendation

Task1910 can add a depot repair status model runtime boundary only after PM acceptance. It should remain no-DB unless explicitly scoped, should not write depot status to unapproved schema, and must keep Completion Report / Field Service Report, `finalAppointmentId`, provider sending, billing, AI/RAG, customer-visible publication, migration, seed, smoke, and Zeabur/deploy behavior behind separate explicit gates.
