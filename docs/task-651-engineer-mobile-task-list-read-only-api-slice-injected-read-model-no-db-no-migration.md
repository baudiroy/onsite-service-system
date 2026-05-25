# Task 651 - Engineer Mobile Task List Read-only API Slice / Injected Read Model / No DB / No Migration

## Summary

Task 651 creates the first Engineer Mobile Workbench read-only API slice:

- `GET /engineer-mobile/tasks`

This task adds a service, controller skeleton, route registration skeleton, unit tests, and a task note. It does not mount the route in the main app, connect to DB, create repositories, add migrations, modify schema, add provider runtime, add AI/RAG runtime, modify admin frontend files, or run smoke/browser tests.

## Runtime Files

- `src/engineerMobile/engineerMobileTaskListService.js`
- `src/controllers/engineerMobileController.js`
- `src/routes/engineerMobileRoutes.js`

## Service Behavior

`buildEngineerMobileTaskList(input, options)` is read-only and fail-closed by default.

It accepts injected task data through `options.readModel`, `options.taskProvider`, or `options.tasks`. This task intentionally does not import DB clients, repositories, transaction helpers, providers, LINE/SMS/Email/App push, AI, or RAG modules.

Filtering rules:

- missing `organizationId` returns a safe empty result
- missing `engineerId` returns a safe empty result
- only tasks with matching `organizationId` are returned
- only tasks with matching `assignedEngineerId` are returned
- optional date range filters tasks by scheduled time
- output is stable and deterministic

Safe output fields are limited to engineer-necessary task list data:

- `caseId`
- `appointmentId`
- `scheduledStart`
- `scheduledEnd`
- `status`
- `customerNameMasked`
- `customerPhoneMasked`
- `addressSummary`
- `productSummary`
- `issueSummary`
- `serviceType`

The output strips internal and forbidden fields such as:

- internal note
- audit log
- AI raw payload
- billing / settlement internal data
- raw phone / address / LINE id
- token / secret
- `finalAppointmentId`

## Controller / Route Behavior

`src/controllers/engineerMobileController.js` exports:

- `buildEngineerMobileTaskListResponse(req, options)`
- `handleEngineerMobileTaskListRequest(req, res, options)`
- `createEngineerMobileTaskListHandler(options)`

The controller expects future middleware-provided `req.auth.organizationId` and `req.auth.engineerId`. Missing auth returns generic HTTP 403 safe deny.

`src/routes/engineerMobileRoutes.js` exports:

- `ENGINEER_MOBILE_TASKS_ROUTE_PATH`
- `registerEngineerMobileRoutes(router, options)`

The route registers:

- `GET /engineer-mobile/tasks`

The route is not mounted in `src/app.js` or `src/routes/index.js` in this task.

## Tests

Added:

- `tests/engineerMobile/engineerMobileTaskListService.unit.test.js`
- `tests/engineerMobile/engineerMobileRoute.unit.test.js`

Coverage includes:

- safe empty result for missing input / organization / engineer
- assignment isolation by organization and engineer
- mixed task filtering
- optional date range filtering
- forbidden field stripping
- no `finalAppointmentId` in output
- no raw phone / address / LINE id in output
- input and read model immutability
- provider throw fail-closed behavior
- route registration
- missing auth 403 safe deny
- valid auth with injected read model returns safe assigned tasks
- static import boundary checks
- no server bootstrap / app.listen

## Guardrails Preserved

- Engineers can only see assigned / authorized tasks.
- Organization isolation remains required.
- Customer-facing and engineer-facing data remain filtered views.
- One Case still has one formal completion report.
- Field Service Report and `finalAppointmentId` are not modified.
- No DB, migration, schema, provider, notification, AI, RAG, admin frontend, smoke, or browser behavior is changed.

## Future Tasks

Future work must be separately bounded before implementation:

- mount the engineer mobile route in app/router
- add auth middleware and permission checks
- add read-only DB repository / projection
- add audit logging policy
- add SaaS entitlement and usage checks
- add mobile web/PWA UI
- add photos/signature/completion flows

## Verification

Expected targeted checks:

- `node --check src/engineerMobile/engineerMobileTaskListService.js`
- `node --check src/controllers/engineerMobileController.js`
- `node --check src/routes/engineerMobileRoutes.js`
- `node --test tests/engineerMobile/engineerMobileTaskListService.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileRoute.unit.test.js`
- `git diff --check -- src/engineerMobile/engineerMobileTaskListService.js src/controllers/engineerMobileController.js src/routes/engineerMobileRoutes.js tests/engineerMobile/engineerMobileTaskListService.unit.test.js tests/engineerMobile/engineerMobileRoute.unit.test.js docs/task-651-engineer-mobile-task-list-read-only-api-slice-injected-read-model-no-db-no-migration.md`
