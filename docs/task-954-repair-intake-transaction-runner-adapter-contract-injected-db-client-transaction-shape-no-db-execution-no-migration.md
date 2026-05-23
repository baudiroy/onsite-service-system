# Task954 - Repair Intake Transaction Runner Adapter Contract / Injected DB Client Transaction Shape / No DB Execution No Migration

Status: completed locally.

## Scope

Task954 adds a bounded Repair Intake transaction runner adapter contract for later injection into Task950's repository case creator adapter.

Allowed files:

- `src/repairIntake/repairIntakeTransactionRunnerAdapter.js`
- `tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js`
- this task note

Out of scope:

- existing Task934-Task953 files;
- Engineer Mobile Task921-Task933;
- Task902;
- `admin/src/**`;
- API route / controller / DTO / OpenAPI changes;
- DB execution, SQL dry-run, psql, migration creation/apply, schema files, SQL migration files, seed files, or `npm run db:migrate`;
- package files;
- smoke / shared runtime scripts;
- provider integrations or LINE / SMS / App / email / webhook sending;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- default global transaction runner or default DB client;
- Case creation;
- draft linking;
- audit persistence;
- idempotency persistence / store.

## Implementation Summary

Task954 adds `createRepairIntakeTransactionRunnerAdapter(options)`.

Injected options:

- `dbClient`

Exposed methods:

- `runInTransaction(callback)`
- `transaction(callback)`

Supported injected transaction client shapes:

- `dbClient.transaction(async (tx) => result)`
- `dbClient.runInTransaction(async (tx) => result)`
- `dbClient.withTransaction(async (tx) => result)`

The adapter:

- requires an injected `dbClient`;
- does not import or create a default DB client;
- passes only the injected `tx` object to the caller callback;
- propagates the callback result when the injected transaction method returns it;
- rejects missing callbacks before invoking the transaction method.

## Failure Strategy

Task954 intentionally uses sanitized generic thrown errors for transaction failures instead of returning failure envelopes.

Reason: transaction runners are intended to sit under Task950's repository case creator adapter. Throwing allows injected transaction implementations to roll back and lets Task950's existing failure path handle transaction failure. Returning an envelope from inside the transaction runner could be mistaken for a successful transaction result by an upper-layer adapter.

Failure errors use `RepairIntakeTransactionRunnerError` with safe public fields only:

```js
{
  name,
  message,
  reasonCode,
  requiredActions
}
```

The adapter never exposes SQL text, stack traces, raw error messages, tokens, secrets, raw phone/address/customer payload, or `finalAppointmentId`.

## Boundaries Preserved

Task954 does not:

- execute DB directly;
- run raw SQL;
- import a global DB client;
- create a default DB connection;
- create or apply migrations;
- wire API routes/controllers/DTO/OpenAPI;
- add smoke/shared runtime;
- perform Case creation;
- link drafts;
- perform audit persistence;
- perform idempotency persistence;
- expose customer-visible data;
- touch admin frontend, provider sending, AI/RAG, billing, or settlement runtime.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeTransactionRunnerAdapter.js tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js docs/task-954-repair-intake-transaction-runner-adapter-contract-injected-db-client-transaction-shape-no-db-execution-no-migration.md
git diff --check -- src/repairIntake/repairIntakeTransactionRunnerAdapter.js tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js docs/task-954-repair-intake-transaction-runner-adapter-contract-injected-db-client-transaction-shape-no-db-execution-no-migration.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js`: PASS (13/13)
- `node --test tests/repairIntake/*.js`: PASS (241/241)
- `npm run check`: PASS
- `git diff -- src/repairIntake/repairIntakeTransactionRunnerAdapter.js tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js docs/task-954-repair-intake-transaction-runner-adapter-contract-injected-db-client-transaction-shape-no-db-execution-no-migration.md`: PASS
- `git diff --check -- src/repairIntake/repairIntakeTransactionRunnerAdapter.js tests/repairIntake/repairIntakeTransactionRunnerAdapter.unit.test.js docs/task-954-repair-intake-transaction-runner-adapter-contract-injected-db-client-transaction-shape-no-db-execution-no-migration.md`: PASS
- `git status --short`: PASS; Task954 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
