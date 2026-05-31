# Task2413 Depot Workshop Migration 028 Disposable DB Dry-Run Authorization Packet

## Scope

Task2413 prepares a future authorization packet for a disposable local/test DB dry-run of migration 028.

This is docs/static-only. It does not change runtime/source behavior, migration files, repository adapter behavior, route behavior, provider behavior, package files, admin frontend, Customer Access, Engineer Mobile, Repair Intake, billing, AI/RAG, smoke coverage, staging, production, or deployment.

Task2413 does not authorize DB execution, SQL execution, migration dry-run, migration apply, `DATABASE_URL`, env, Zeabur, or secrets inspection, server/listener startup, smoke tests, endpoint probes, provider sending, package changes, route write scope, runtime wiring, or any future task.

## Migration Target

Migration target: `migrations/028_create_depot_workshop_repair_orders.sql`

Current migration 028 status:

- migration file exists
- migration file is authoring-only
- migration file states that dry-run or apply requires a separate task
- migration file states that no DB connection or database execution is authorized by the file
- migration creates `depot_workshop_repair_orders`
- migration remains unapplied by this task

## Allowed Future Target

Allowed future DB target type: disposable local/test DB only.

A future dry-run task must name the disposable target explicitly. The target must be safe to discard, must not contain production/staging/shared/customer/provider/billing data, and must not be discovered through env or secret inspection.

Explicitly forbidden DB targets:

- shared DB
- staging DB
- production DB
- Zeabur DB
- app runtime DB
- any DB discovered through env/secret inspection

## Forbidden In Task2413

Task2413 does not authorize DB execution.

Task2413 does not authorize SQL execution.

Task2413 does not authorize migration dry-run.

Task2413 does not authorize migration apply.

Task2413 does not authorize `DATABASE_URL`, env, Zeabur, or secrets inspection.

Task2413 does not authorize server/listener startup.

Task2413 does not authorize smoke tests, endpoint probes, shared runtime, deploy, staging/prod traffic, or `/healthz`.

No route write-scope behavior is authorized.

No provider sending is authorized.

No package or package-lock changes are authorized.

No formal Field Service Report / Completion Report behavior is authorized.

No finalAppointmentId mutation path is authorized.

## Future Dry-Run Prerequisites

Before any future dry-run, a separate exact PM task must provide:

- Explicit PM authorization naming the disposable DB target
- Local tooling availability check
- No secrets printed
- No database URL printed
- No production/staging/shared traffic
- Rollback/drop disposable DB plan
- expected sanitized verification output
- explicit migration target or range
- stop conditions accepted before execution

Generic approval such as continue, proceed, or run migration is not sufficient.

## Stop Conditions

Stop before any future dry-run if any condition is true:

- missing psql or migration tooling
- ambiguous DB target
- missing disposable target name
- any need to inspect `DATABASE_URL` or secrets
- any accidental staging/prod/shared target
- any Zeabur, app runtime, or persistent DB target
- any request to print credentials, tokens, passwords, URLs, or private keys
- any request to send provider notifications
- any route/runtime smoke request
- any server/listener startup request
- any endpoint probe request
- any package installation or package change request
- any formal report, billing, AI/RAG, or finalAppointmentId request

## Rollback / Cleanup Expectation

A future disposable dry-run task must define a cleanup plan before execution.

Accepted cleanup shapes for a future task:

- discard the disposable local/test database
- drop only the named disposable local/test database
- rollback a transaction wrapper if the future command uses one

Cleanup does not authorize shared, staging, production, Zeabur, or app DB cleanup.

## Recommended Next Bounded Task

Recommended next bounded task: pause until disposable DB target/tooling is provided.

Reason: this task did not receive an explicitly named disposable DB target, did not verify local tooling availability, and did not authorize inspecting env/secrets to discover a target.

Do not start a dry-run from Task2413.

Do not recommend immediate dry-run because no disposable DB target/tooling was explicitly provided in this task.

## Static Guard Coverage

`tests/depotWorkshop/depotWorkshopMigration028DisposableDbDryRunAuthorization.static.test.js` reads migration/docs/source text only. It verifies:

- authorization packet exists
- migration 028 exists
- migration 028 remains authoring-only
- migration 028 static review / portfolio docs exist
- repository adapter and fake-chain closure docs exist
- packet references disposable local/test DB only
- packet forbids shared/staging/prod/Zeabur/app DB targets
- packet forbids DB execution / SQL execution / migration dry-run/apply in Task2413
- packet forbids `DATABASE_URL` / env / secrets inspection
- packet contains prerequisites and stop conditions
- packet contains no executable DB/migration command authorization
- packet contains no real-looking DB URL or credential
- route write scope remains blocked
- no provider/package/formal-report/finalAppointmentId behavior is authorized

## Runtime Statement

No DB execution occurred.

No SQL execution occurred.

No SQL execution against a real DB occurred.

No migration dry-run/apply occurred.

No real DB connection occurred.

No migration file changed.

No `DATABASE_URL`, env, Zeabur, or secrets values were inspected.

No server/listener was started.

No smoke or endpoint probe was run.

No provider sending occurred.

No package or package-lock changes occurred.

Future DB work remains blocked until PM authorizes one exact bounded task with an explicitly named disposable target.

## Held Docs

The 7 held historical docs remain outside Task2413 scope and must stay untracked, unstaged, and untouched.
