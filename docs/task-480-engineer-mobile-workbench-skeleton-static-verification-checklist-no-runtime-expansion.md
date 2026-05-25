# Task 480 - Engineer Mobile Workbench Skeleton Static Verification Checklist

## Status

Task 480 is docs-only.

It creates a static verification checklist for the current Engineer Mobile Workbench minimal runtime skeleton. It does not add tests, execute API/smoke/browser tests, or change runtime behavior.

## Checklist Purpose

Task 480 is a static verification checklist.

Its purpose is not to:

- add tests
- verify API behavior
- start smoke tests
- start browser tests
- start API tests
- authorize actual auth/session runtime
- authorize real permission decisions
- authorize DB/repository work
- authorize mobile UI
- authorize provider sending
- authorize AI/RAG/vector database work

The purpose is to give PM / Codex a repeatable review list for confirming that the current skeleton still respects project guardrails.

## Files Covered By Checklist

Current Engineer Mobile Workbench skeleton files:

- `src/controllers/EngineerMobileWorkbenchController.js`
- `src/routes/engineerMobileWorkbench.routes.js`
- `src/routes/index.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/projections/EngineerMobileWorkbenchProjection.js`
- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`

## Static Checklist Items

Confirm:

- endpoints still return `501 Not Implemented`
- no DB import
- no repository import
- no service import
- no provider import
- no AI/RAG/vector database import
- no storage provider import
- no real auth/session validation
- no real permission decision
- no real assignment lookup
- no real projection data
- no completion persistence
- no Field Service Report draft creation
- no formal Field Service Report creation
- no Case / Appointment / Field Service Report state mutation
- no manual `finalAppointmentId` selection
- no customer / case / appointment / Field Service Report fake payload
- no raw channel id exposure
- no sensitive string
- no production/shared/Zeabur access
- no tests / fixtures added
- no mobile UI added

## Allowed Static Verification Commands Proposal

Future static review may use commands like:

```bash
git diff --check
```

```bash
find src -name '*.js' -print0 | xargs -0 -n1 node --check
```

```bash
npm run check
```

```bash
grep -R "require('../repositories\|require(\"../repositories\|src/db\|db/pool\|db/transaction\|require('../services\|require(\"../services" -n \
  src/controllers/EngineerMobileWorkbenchController.js \
  src/routes/engineerMobileWorkbench.routes.js \
  src/resolvers/EngineerMobileWorkbenchResolver.js \
  src/guards/EngineerMobileWorkbenchPermissionGuard.js \
  src/projections/EngineerMobileWorkbenchProjection.js \
  src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js \
  src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js
```

```bash
grep -R "AIProvider\|R2StorageProvider\|LineService\|NotificationService" -n \
  src/controllers/EngineerMobileWorkbenchController.js \
  src/routes/engineerMobileWorkbench.routes.js \
  src/resolvers/EngineerMobileWorkbenchResolver.js \
  src/guards/EngineerMobileWorkbenchPermissionGuard.js \
  src/projections/EngineerMobileWorkbenchProjection.js \
  src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js \
  src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js
```

```bash
grep -R "DATABASE[_]URL\|PASS[W]ORD\|SEC[R]ET\|TOK[E]N\|API[_]KEY\|LINE[_]CHANNEL[_]SEC[R]ET\|line[_]user[_]id" -n \
  src/controllers/EngineerMobileWorkbenchController.js \
  src/routes/engineerMobileWorkbench.routes.js \
  src/resolvers/EngineerMobileWorkbenchResolver.js \
  src/guards/EngineerMobileWorkbenchPermissionGuard.js \
  src/projections/EngineerMobileWorkbenchProjection.js \
  src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js \
  src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js
```

Task 480 does not run API, smoke, or browser tests.

## Guardrail Checklist

Confirm:

- one Case has one formal Field Service Report
- multiple appointments / dispatch visits do not create multiple formal Field Service Reports
- Field Service Report remains a Case-level summary, not a visit-level report
- `field_service_reports.case_id` uniqueness is not touched
- backend/system-owned `finalAppointmentId` principle is not touched
- engineers do not manually select `finalAppointmentId`
- completion submission skeleton does not create a Field Service Report draft
- completion submission skeleton does not create a formal Field Service Report
- photos / signatures / parts are not processed
- LINE is not required for engineer task management
- AI does not participate in runtime

## PM Workflow Rule

The user has agreed that future tasks explicitly planned by PM, with exact allowed files and exact scope, may be executed by Codex.

This is not unlimited authorization.

Every future task must remain:

- single-purpose
- explicitly scoped
- tied to exact allowed files
- bounded by forbidden changes
- bounded by verification commands
- bounded by stop conditions

Codex must not expand scope from a general "continue" request. If implementation requires anything beyond the PM-scoped task, Codex must stop and report.

## Explicit Non-goals

Task 480 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary code
- add actual auth/session validation
- add real permission decision
- add service
- add repository
- add DB / migration / Migration020
- add tests / fixtures / smoke
- run DB / migration / psql
- run smoke / browser / API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 480.

## Runtime Decision

No runtime behavior is changed in Task 480.

The Engineer Mobile Workbench remains at the skeleton-only boundary until PM provides another task with exact allowed files and scope.
