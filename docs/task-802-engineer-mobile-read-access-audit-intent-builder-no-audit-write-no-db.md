# Task802 - Engineer Mobile Read Access Audit Intent Builder / No Audit Write No DB

Status: completed

Scope: Engineer Mobile read access audit intent builder / pure module / no audit write / no DB

## Purpose

Task802 adds a pure audit-intent builder for future Engineer Mobile task-list and task-detail read access evidence. The builder produces safe metadata that a future separately-approved audit writer may consume, but this task does not write audit logs, persist data, change API responses, call providers, or invoke AI/RAG.

## Changed Files

- `src/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.js`
- `tests/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.unit.test.js`
- `docs/task-802-engineer-mobile-read-access-audit-intent-builder-no-audit-write-no-db.md`
- `docs/design/engineer-mobile-workbench.md`

## Runtime Boundary

The builder is pure and deterministic. It imports no runtime modules and does not call:

- DB / repository / query / transaction code.
- API routes / controllers / services.
- global app / server / router code.
- audit writer / logger / sink code.
- provider / LINE / SMS / App push / webhook runtime.
- completion / Field Service Report write code.
- `finalAppointmentId` exposure, inference, or mutation code.
- AI/RAG / vector / provider code.
- admin UI, package, smoke, or migration code.

## Supported Events

The builder supports safe intent event types:

- `engineer_mobile_task_list_read_allowed`
- `engineer_mobile_task_list_read_denied`
- `engineer_mobile_task_detail_read_allowed`
- `engineer_mobile_task_detail_read_denied`
- `engineer_mobile_task_read_denied_malformed`

## Safe Intent Fields

The intent may include only safe metadata:

- `eventType`
- `organization_id`
- `actorId`
- `actorRole`
- `engineerId`
- `action`
- `reasonKey`
- `resultStatus`
- `taskId`
- `appointmentId`
- `caseId`
- `timestamp`, only if injected
- `auditWritten: false`

Missing or unsafe input returns a minimal malformed denied intent without throwing.

## Redaction Boundary

The builder must never include:

- raw task rows
- raw LINE id
- full phone / address
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- Field Service Report id / report id
- `finalAppointmentId`
- token / secret / DB URL / credentials
- stack / SQL

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.js tests/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.unit.test.js docs/task-802-engineer-mobile-read-access-audit-intent-builder-no-audit-write-no-db.md docs/design/engineer-mobile-workbench.md
```

## Future Task

Future audit writer integration, DB persistence, task-read evidence logging, API route wiring, real permission service usage, assignment resolver usage, completion submission, Field Service Report writes, provider sending, AI/RAG helper, admin/mobile UI, package changes, smoke/integration tests, or Migration 022 execution requires a separate bounded task and explicit approval.
