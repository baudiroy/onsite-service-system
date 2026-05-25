# Task 698 - Engineer Mobile Source Boundary Static Test

## Summary

Task 698 adds a static source-boundary test for the Engineer Mobile Phase 1 read path.

This task does not modify runtime source. It only adds test coverage and this task note.

## Purpose

The static test prevents future Engineer Mobile work from accidentally introducing:

- direct DB / pool / transaction imports
- repository imports from route/controller/service wiring layers
- LINE / SMS / email / app push provider imports
- AI / RAG / vector / OpenAI imports
- unsafe sensitive logging patterns
- raw sensitive output fields
- official Case / Appointment / Field Service Report mutation patterns

## Dependency Direction

The intended dependency direction remains:

- route -> controller
- controller -> service
- service -> injected `readModel` / `taskProvider` only
- mapper / repository / adapter remain DB-free, provider-free, and AI-free in this phase
- app may wire the Task 695 adapter by explicit option
- server only passes options and does not directly import Engineer Mobile route/controller/service/adapter/repository modules

## Static Test Scope

`tests/engineerMobile/engineerMobileSourceBoundary.static.test.js` reads source text only.
It does not import runtime modules, start a server, connect to a database, execute SQL,
or use real provider credentials.

The test scans:

- `src/engineerMobile/`
- `src/controllers/engineerMobileController.js`
- `src/routes/engineerMobileRoutes.js`
- `src/routes/index.js`
- `src/app.js`
- `src/server.js`

## Non-goals

This task does not:

- modify runtime source
- change API behavior
- connect to a database
- execute SQL
- add or apply migrations
- modify permissions
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- modify smoke or browser tests
- modify admin frontend
- modify `package.json`
- modify `PROJECT_GUARDRAILS.md`, design docs, or task indexes

## Future Tasks

Future real DB, auth middleware, Engineer Mobile UI, audit log, and smoke coverage tasks
must either preserve this boundary or explicitly open a new task that explains why the
boundary changes are needed.
