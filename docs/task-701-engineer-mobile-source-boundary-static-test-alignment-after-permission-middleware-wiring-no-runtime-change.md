# Task 701 - Engineer Mobile Source Boundary Static Test Alignment

## Summary

Task 701 aligns the Engineer Mobile source boundary static test after Task 700 wired
the permission middleware into the Engineer Mobile route.

This task does not modify runtime source.

## Updated Legal Dependency

The legal route dependency direction is now:

- `src/routes/engineerMobileRoutes.js`
  - `../controllers/engineerMobileController`
  - `../engineerMobile/engineerMobilePermissionMiddleware`

The route must not import Engineer Mobile service, mapper, repository, provider adapter,
app, server, DB, notification provider, or AI/RAG modules directly.

## Preserved Guards

The static test still verifies:

- expected Engineer Mobile source files exist
- Engineer Mobile source files do not import DB / pool / transaction / repository modules
- no LINE / SMS / email / app push provider imports
- no AI / RAG / vector / OpenAI imports
- service / mapper / repository / adapter / permission middleware do not import route,
  controller, app, or server modules
- controller imports only Engineer Mobile service
- app may import the Task 695 adapter only as app-layer options wiring
- server does not directly import Engineer Mobile modules
- Engineer Mobile feature behavior does not read `process.env` directly
- no unsafe logging or raw sensitive output patterns
- no official Case / Appointment / Field Service Report mutation patterns

## Non-goals

This task does not:

- modify runtime source
- change API behavior
- connect to a database
- execute SQL
- add or apply migrations
- modify permissions runtime
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- modify smoke or browser tests
- modify admin frontend
- modify `package.json`
- modify guardrails, design docs, or task indexes

## Future Tasks

Future real DB, auth, UI, audit, and smoke work must preserve this source boundary or
open a separately scoped task that explicitly changes the boundary.
