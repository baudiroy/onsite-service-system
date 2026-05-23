# Task957 Repair Intake Draft-to-Case Runtime Dependency Factory

## Scope

Task957 adds production source for a bounded runtime dependency composition factory:

- `src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js`
- `tests/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.unit.test.js`

This is runtime source, not docs-only. It composes the already accepted injected adapter contracts from Task950 and Task952-Task956 into an explicit dependency bundle for later injection into the draft-to-Case submission flow.

## Boundary

The factory does not register any default or global runtime. It does not create a Case, link a draft, write audit records, check idempotency, run a transaction, query DB, expose an API route, create/apply migrations, run smoke scripts, send providers, invoke AI/RAG, touch admin frontend code, or enter billing/settlement scope at factory creation time.

The accepted local Task921-Task956 files remain local / uncommitted / untracked and were not cleaned, reverted, relocated, or restaged by this task.

## Behavior

`createRepairIntakeDraftCaseRuntimeDependencies(options)` requires:

- injected `dbClient`
- injected `idGenerator`

It allows optional:

- `clock`
- `tableNames.cases`
- `tableNames.repairIntakeDrafts`
- `tableNames.auditEvents`
- `tableNames.idempotencySubmissions`

Table name overrides are validated with a conservative identifier rule before being passed to any adapter. Unsupported table-name keys are rejected. Unsafe runtime dependency options containing raw phone, full address, raw customer payload, provider payload, token, secret, LINE token, or `finalAppointmentId` are rejected.

The returned dependency bundle contains:

- `caseRepository` from Task953
- `repairIntakeDraftRepository` from Task952
- `transactionRunner` from Task954
- `auditWriter` from Task955
- `idempotencyChecker` from Task956
- `caseCreator` from Task950, composed with the repositories, transaction runner, audit writer, and clock above

The returned value contains dependency objects/functions only. It does not return customer-visible data, DB rows, SQL text, submission results, provider payloads, tokens, secrets, raw phone/address/customer payloads, or `finalAppointmentId`.

## Verification

Task957 amendment note:

- The full repairIntake suite was initially blocked by the Task948 static inventory regex because `repairIntakeDraftCaseRuntimeDependencyFactory.js` matches the broad `repairIntakeDraftCase*.js` pattern.
- The Task957 source filename remains unchanged.
- The Task948 static inventory was amended only to distinguish Task934-Task945 no-DB submission modules from later repository/audit/store/runtime-composition modules.
- No production behavior changed.

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js tests/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.unit.test.js docs/task-957-repair-intake-draft-to-case-runtime-dependency-factory-injected-adapters-composition-no-api-no-db-execution.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js tests/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.unit.test.js docs/task-957-repair-intake-draft-to-case-runtime-dependency-factory-injected-adapters-composition-no-api-no-db-execution.md
git status --short
```

## Scope Checklist

- Production source: in scope
- Adapter composition factory: in scope
- DB execution / psql / SQL dry-run / `npm run db:migrate`: out of scope
- Migration creation/apply: out of scope
- API shape / route / controller / DTO / OpenAPI: out of scope
- Smoke/shared runtime: out of scope
- Provider sending / LINE / SMS / App / email / webhook: out of scope
- AI/RAG/vector/provider runtime: out of scope
- Admin frontend: out of scope
- Billing/settlement/payment/invoice: out of scope
- Default global runtime registration: out of scope
- Default global DB client / default ID generator: out of scope
- Case creation execution: out of scope at factory creation time
- Draft linking execution: out of scope at factory creation time
- Audit persistence execution: out of scope at factory creation time
- Idempotency DB query execution: out of scope at factory creation time
- Sensitive data/token/secret/full phone/address/raw payload: out of scope
- `finalAppointmentId`: out of scope
- Task902: out of scope
- Engineer Mobile Task921-Task933: out of scope / remains closed
