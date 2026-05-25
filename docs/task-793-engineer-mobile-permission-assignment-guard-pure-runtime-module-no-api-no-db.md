# Task793 - Engineer Mobile Permission Assignment Guard / Pure Runtime Module / No API No DB

Status: completed

Scope: Engineer Mobile permission / assignment decision helper / pure runtime module / no API / no DB

## Purpose

Task793 adds the first bounded permission-assignment guard for Engineer Mobile task list and task detail decisions.

The guard is intentionally pure and deterministic. It evaluates only caller-provided synthetic permission and assignment context. It does not read a database, call a repository, mount a route, write audit logs, start a server, send notifications, run AI/RAG, or touch completion / Field Service Report / `finalAppointmentId` logic.

## Changed Files

- `src/engineerMobile/engineerMobilePermissionAssignmentGuard.js`
- `tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js`
- `docs/task-793-engineer-mobile-permission-assignment-guard-pure-runtime-module-no-api-no-db.md`
- `docs/design/engineer-mobile-workbench.md`

## Guard Contract

The guard exports:

- `evaluateEngineerMobilePermissionAssignment(input)`
- `ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS`
- `ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ALLOWED_ROLES`
- `ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REQUIRED_PERMISSIONS`
- `ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS`

Supported actions:

- `task_list`
- `task_detail`

Allowed roles:

- `engineer`
- `dispatch_assistant`
- `supervisor`
- `admin`

Compatible permissions:

- `engineer_mobile.tasks.read`
- `engineer_mobile.tasks.read.assigned`
- `engineer_mobile.workbench.access`

## Fail-closed Rules

The guard denies when:

- action is missing or unsupported
- organization, user, engineer, or role scope is missing
- role is not allowed
- known Engineer Mobile read permission is missing
- assignment context is missing
- assignment organization does not match caller organization
- engineer role is not explicitly assigned or eligible for the task

Dispatcher / supervisor / admin style roles can inspect explicit same-organization assignment context, but they still require:

- organization scope
- user and engineer context
- allowed role
- compatible Engineer Mobile read permission
- explicit assignment context

## Safe Output

The guard returns only:

- `allowed`
- `decision`
- `reasonKey`
- `scope`
- `action`
- `auditIntent`

The output must not copy raw task payloads or expose:

- stack
- SQL
- DB URL
- token
- secret
- raw LINE id
- full phone
- full address
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- Field Service Report id
- formal report id
- `finalAppointmentId`

`auditIntent` is metadata-only and does not write audit logs.

## Boundary

Task793 does not:

- wire the guard into app / API / routes / controllers
- connect a real DB
- create or modify repositories
- write audit logs
- change permission middleware behavior
- change API shape
- change DB schema or migrations
- execute Migration 022
- run psql / db:migrate / DDL / dry-run / apply
- change completion writes
- create or update Field Service Reports
- expose, infer, or mutate `finalAppointmentId`
- send provider notifications
- add LINE / SMS / App push / webhook runtime
- add AI/RAG runtime
- touch admin UI
- change package files
- add smoke or integration tests

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- src/engineerMobile/engineerMobilePermissionAssignmentGuard.js tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js docs/task-793-engineer-mobile-permission-assignment-guard-pure-runtime-module-no-api-no-db.md docs/design/engineer-mobile-workbench.md
```

## Future Tasks

Future tasks require separate explicit PM approval:

- wire guard into Engineer Mobile route/controller paths
- add real assignment resolver
- add real permission service integration
- add audit writer for task access decisions
- promote DB-backed repository usage after Migration 022 dry-run/apply approval
- add smoke/integration coverage
- add admin or mobile UI behavior
- add completion submission persistence

Task793 does not approve any of those steps.
