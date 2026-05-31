# Task2314 Repair Intake Draft-to-Case DB-Backed Runtime Implementation Authorization Packet

Status: authorization packet only

Task2314 creates a source-reading implementation packet for the next Repair Intake draft-to-case DB-backed runtime branch. It does not change runtime behavior, source behavior, route behavior, repository behavior, migration files, package files, tests that execute runtime paths, Customer Access, Engineer Mobile, providers, auth/session, rate limiting, payload-size policy, admin frontend, billing, AI/RAG, smoke coverage, staging, or production.

Task2314 does not authorize DB execution, SQL execution, SQL runtime construction, migration creation, migration dry-run, migration apply, environment inspection, Zeabur/secrets inspection, server/listener startup, endpoint probes, smoke tests, provider sending, public/open route expansion, Customer Access behavior, Engineer Mobile behavior, or any future task. PM must still authorize one exact task at a time.

## Current Accepted Status

- Current Repair Intake draft-to-case route remains admin/injected-only.
- Current route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Current route remains permission-gated by `requirePermission` / `cases.create`.
- No public/open/customer route expansion is authorized or present.
- No `src/openRepairIntake/` path is authorized or present.
- No `tests/openRepairIntake/` path is authorized or present.
- No Repair Intake controller under `src/controllers/` is authorized or present.
- Request DTO, trusted context, permission gate, idempotency/request correlation, audit context, injected adapter failure, public envelope, route composition, application/controller/API/route/HTTP mapper boundaries are already hardened by the accepted Task2187-Task2243 branch.
- The accepted branch closed with DB/repository transaction behavior, audit persistence, migration/schema work, auth/session runtime work, rate-limit/payload-size runtime work, smoke/staging/prod rollout, provider sending, and public/open route exposure still non-authorized.

## Current DB and Repository Seam Inventory

### Draft reader / draft lookup

- `src/repairIntake/repairIntakeDraftReaderPortAdapter.js` adapts the injected draft repository to the application service.
- `src/repairIntake/repairIntakeDraftRepositoryContract.js` defines the sanitized `findDraftForConversion` contract surface and strips unsafe fields.
- `src/repairIntake/repairIntakeDraftRepository.js` is the DB-capable draft lookup repository behind an injected query client. It targets `repair_intake_drafts` and maps safe draft fields only.
- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js` can construct the DB-capable draft repository from an injected `dbClient`, but Task2314 does not authorize executing that factory or wiring it to runtime traffic.

### Case planner / case creator

- `src/repairIntake/repairIntakeCasePlannerPortAdapter.js` adapts an injected planning policy.
- `src/repairIntake/repairIntakeCaseCreatorPortAdapter.js` adapts an injected case creation port.
- `src/repairIntake/repairIntakeCaseRepositoryContract.js` defines the sanitized `createCaseFromDraft` contract surface.
- `src/repairIntake/repairIntakeCaseRepository.js` wraps an injected case creation dependency and returns a sanitized case creation envelope.
- `src/repairIntake/repairIntakeCaseRepositoryAdapter.js` and `src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js` are existing repository/adapter seams for case creation behavior.
- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js` can build a case creation port and conversion writer around DB-capable repositories, but this packet does not authorize execution or route wiring.

### Idempotency / replay

- `src/repairIntake/repairIntakeIdempotencyPortAdapter.js` adapts an injected idempotency store.
- `src/repairIntake/repairIntakeIdempotencyRepositoryContract.js` defines sanitized lookup/write contract surfaces for idempotency replay.
- `src/repairIntake/repairIntakeIdempotencyRepository.js` is the DB-capable idempotency repository behind an injected query client. It targets `repair_intake_idempotency_records` and preserves safe replay result fields.
- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js` can build an idempotency store wrapper, but Task2314 does not authorize using it in runtime traffic.

### Audit writer

- `src/repairIntake/repairIntakeAuditWriterPortAdapter.js` keeps audit recording behind an injected `auditPort.recordDraftToCaseDecision`.
- `src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js` is a DB-capable audit writer adapter for injected clients and table names.
- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js` can build an audit port targeting `repair_intake_audit_events`, but Task2314 does not authorize audit persistence.
- Task2217 remains the governing audit persistence decision gate.

### DB-capable runtime port factory

- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js` is the existing DB-capable runtime port factory.
- It requires an injected query client and id generators.
- It can compose draft repository, idempotency repository/store, planning policy, case creation port, conversion writer, and audit port.
- It remains inventory only for Task2314. This packet does not authorize importing it into route/admin/API/controller/application/synthetic boundaries or executing it.

### Repository contract modules

- `src/repairIntake/repairIntakeDraftRepositoryContract.js`
- `src/repairIntake/repairIntakeCaseRepositoryContract.js`
- `src/repairIntake/repairIntakeIdempotencyRepositoryContract.js`
- These contracts remain sanitized, injected seams. They are allowed references for the next implementation slice but are not DB execution authorization by themselves.

### Migration files

- `migrations/026_create_repair_intake_persistence_tables.sql` is the relevant Repair Intake persistence schema artifact.
- It defines `repair_intake_drafts`, `repair_intake_draft_case_conversions`, `repair_intake_idempotency_records`, and `repair_intake_audit_events`.
- Its header states that it is file-authoring/proposal only and that dry-run or apply requires separate explicit authorization.
- Earlier core case tables are in `migrations/001_create_base_tables.sql` and `migrations/002_create_cases.sql`.
- Task2314 reads migration files only and does not authorize migration creation, dry-run, apply, schema changes, or DB connectivity.

## Recommended First Implementation Slice

Recommended exact next bounded task: DB-backed draft reader only.

Why this is the safest first slice:

- It exercises the smallest DB-backed seam: draft lookup/read mapping only.
- It can stay behind injected runtime ports and avoid route path, public exposure, provider, audit persistence, case creation, transaction, idempotency write, and migration changes.
- It can validate that the already-authored `repair_intake_drafts` shape and `repairIntakeDraftRepository.js` mapping are sufficient before any write path is expanded.
- It gives PM an early stop point before case creation transactions, conversion writes, idempotency persistence, or audit persistence are authorized.

Required PM authorization before that slice:

- Exact task title and allowed files.
- Confirmation whether source behavior changes to the DB-backed draft reader are allowed.
- Confirmation that no DB connection, SQL execution, migration dry-run/apply, smoke, endpoint probe, server/listener startup, or environment/secret inspection is authorized unless explicitly listed.
- Test boundary, preferably unit tests with injected fake query clients only.

## Stop Conditions For Future DB-Backed Work

- Any need to inspect database connection variables, Zeabur, env, or secrets.
- Any need to run SQL, migrations, DB dry-runs, endpoint probes, smoke tests, server/listener startup, shared runtime, staging, production, or health endpoint checks.
- Any need to change route path, mount scope, public/open/customer exposure, auth/session provider, permission model, rate limiting, payload-size/body-parser, package dependencies, migrations, providers, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior.
- Any unsafe raw customer/contact/address/private data leak in draft lookup, case creation, idempotency replay, audit output, public envelope, or logs.
- Any uncertainty about migration apply status or schema compatibility.

## Static Guard Coverage

`tests/repairIntake/repairIntakeDraftToCaseDbBackedImplementationAuthorization.static.test.js` reads source, test, doc, and migration files as text only. It asserts:

- the route remains admin/injected-only and permission-gated;
- public/open/customer route expansion markers stay absent;
- `src/openRepairIntake/` and `tests/openRepairIntake/` stay absent;
- no Repair Intake controller exists under `src/controllers/`;
- DB-backed implementation remains non-authorized by Task2314;
- Task2217-Task2225 and Task2243/Task2245 decision/closure gates remain visible;
- the relevant DB/repository/migration seams remain visible;
- the authorization packet does not introduce executable DB, migration, smoke, server, endpoint, provider, or environment instructions as authorization.

## Authorization Boundary

Task2314 is an authorization packet and static inventory only. It does not authorize DB-backed draft reader implementation, case creator transaction work, idempotency persistence, audit persistence, migration/schema dry-run/apply, runtime wiring, smoke/staging/prod rollout, provider sending, public/open/customer route exposure, or Task2315. PM must authorize the next exact task before any implementation begins.
