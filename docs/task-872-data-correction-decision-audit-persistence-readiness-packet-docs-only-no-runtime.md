# Task 872 - Data Correction Decision Audit Persistence Readiness Packet

Status: completed

## Goal

Define the explicit readiness gate for any future persistence of Data Correction `auditIntent` metadata from Task869 through Task871.

This task is docs-only. It does not implement an audit writer, DB schema, migration, repository, transaction, route wiring, smoke test, public API response change, or any runtime behavior.

## Current Baseline

Task869 through Task871 established and closed an intent-only branch:

- Task869 added a pure Data Correction decision audit intent builder.
- Task870 composed that builder into Data Correction request/apply services as an internal opt-in side-channel.
- Task871 added closure guard coverage proving the side-channel remains internal, opt-in, public-response-safe, DB-free, writer-free, and behavior-neutral.

The current `auditIntent` is evidence metadata only:

- `auditWritten: false`
- no audit writer / sink
- no DB / repository / transaction
- no migration / DDL / psql / dry-run / apply
- no route/controller/API public response body exposure
- no provider, LINE, SMS, App push, webhook, AI, RAG, billing, or settlement side effect
- no correction behavior expansion

## Explicit Future Approvals Required

No future persistence work may begin until a bounded task explicitly approves the specific layer being changed.

Required approval gates:

1. Schema proposal approval
   - Define the future audit table concept, safe columns, organization scope, indexes, retention, and redaction policy.
   - This proposal alone must not create a migration.

2. Migration file approval
   - Create an authoring-only migration file after schema proposal approval.
   - The migration file must not be applied or dry-run unless separately approved.

3. DB dry-run / apply approval
   - Any DDL, `psql`, `npm run db:migrate`, dry-run, or shared/runtime DB apply requires explicit disposable-local or shared-runtime approval.
   - Generic "continue" or "go ahead" wording is not DB approval.

4. Repository approval
   - Future repository work must use injected DB / transaction dependencies.
   - No global DB connection, environment-driven DB client, provider config, or implicit runtime wiring.

5. Transaction boundary approval
   - Define whether audit persistence is best-effort or strict.
   - Define rollback behavior when audit write fails.
   - Do not couple audit persistence to official correction application behavior without explicit product and engineering approval.

6. Audit writer approval
   - Implement only after safe schema/repository boundaries exist.
   - Writer must accept safe `auditIntent` metadata only.
   - Writer must fail closed without leaking raw data or exceptions.

7. Permission and organization-scope approval
   - Persistence and any viewer/reporting path must be organization-scoped, tenant-isolated, permission-aware, and auditable.
   - Cross-organization reads or writes are forbidden.

8. Retention and redaction approval
   - Define retention period, masking policy, field allow-list, deletion/archival behavior, and safe export/report boundaries.

9. Smoke / integration approval
   - Runtime or smoke coverage may be added only after the bounded runtime layer is approved.
   - Do not add smoke tests for a docs-only readiness task.

10. Rollback plan approval
    - Any migration or runtime persistence task must include rollback or disablement strategy.

## Safe Persisted Field Direction

Future persistence may consider only safe, minimal metadata fields such as:

- `eventType`
- `organizationId`
- `caseId`
- `appointmentId`
- `actorId`
- `actorRole`
- `action`
- `fieldKey`
- `fieldGroup`
- `decision`
- `reasonCode`
- `safeMessageKey`
- `resultStatus`
- `createdAt`
- `requestId`, if generated safely

These fields are not automatically approved for DB persistence. They are the maximum safe direction for a future schema proposal.

## Forbidden Persisted Data

Future audit persistence must not store:

- before / after values
- raw correction payload
- raw phone / mobile
- raw address
- raw LINE user id
- token
- secret
- credentials
- DB URL
- stack traces
- SQL
- `finalAppointmentId`
- Field Service Report id / report id
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- cross-organization data
- provider payloads
- customer-visible report body
- photos, signatures, files, or file contents

## Non-effect Boundary

Future persistence must not create, update, delete, or infer:

- official correction application
- Case
- Appointment
- Field Service Report
- `finalAppointmentId`
- customer identity
- phone / LINE / App binding
- provider sending
- AI / RAG result
- billing result
- settlement result
- customer-facing report
- smoke fixture data

Audit persistence is evidence capture. It is not permission to expand correction behavior.

## Future Bounded Task Candidates

Recommended future sequence:

1. Data Correction audit schema proposal / no migration
2. Data Correction audit migration authorization packet / no DB
3. Data Correction audit migration file / no apply
4. Data Correction audit repository with injected fake DB tests / no global DB
5. Data Correction audit writer with fake DB unit tests / no route exposure
6. Service-level injected audit writer side-channel / no public API change
7. Route/app injection only after explicit runtime approval
8. Local-only DB dry-run only after explicit disposable DB approval
9. Smoke/integration coverage only after the runtime and DB branch is explicitly approved
10. Audit viewer/reporting only after permission, masking, retention, and export controls are defined

## Verification

Executed commands:

```bash
test -f docs/task-872-data-correction-decision-audit-persistence-readiness-packet-docs-only-no-runtime.md
grep -Ei "Data Correction|auditIntent|persistence|DB|migration|repository|writer|transaction|retention|redaction|permission|organization|explicit approval|no runtime" docs/task-872-data-correction-decision-audit-persistence-readiness-packet-docs-only-no-runtime.md
git diff --check -- docs/task-872-data-correction-decision-audit-persistence-readiness-packet-docs-only-no-runtime.md
```

## Scope Confirmation

Task872 is docs-only / no runtime change:

- no `src/**` change
- no `admin/src/**` change
- no migration
- no DB / psql / DDL / dry-run / apply
- no API / route / controller / DTO change
- no permission runtime change
- no audit writer / sink
- no provider / LINE / SMS / App push / webhook change
- no AI / RAG runtime change
- no billing / settlement change
- no package change
- no smoke / integration test change
- no sensitive data, token, secret, LINE access token, or AI provider config touched
