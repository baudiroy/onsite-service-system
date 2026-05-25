# Task 692 - Engineer Mobile Task List Read Model Mapper And Query Spec

## Summary

Task 692 adds a pre-DB Engineer Mobile task list read model mapper and a static,
non-executable query spec.

The mapper converts synthetic future database rows into the safe task read model shape
used by the existing Engineer Mobile task list service. The query spec documents a
future read-only, parameterized query boundary without executing SQL.

## Runtime Boundary

This task does not connect the mapper to the route, app, server, or any database.

It does not:

- create a repository
- create a database client
- execute SQL
- apply or dry-run migrations
- modify API behavior
- modify permission middleware
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- add smoke tests

## Mapper Behavior

`mapEngineerMobileTaskListRows(rows, filters)`:

- accepts synthetic future row objects
- excludes rows missing `organization_id`, `case_id`, `appointment_id`, or
  `assigned_engineer_id`
- can filter by `organizationId` and `engineerId`
- maps only safe read model fields needed by the Engineer Mobile task list service
- sorts deterministically by scheduled start, appointment id, then case id
- does not mutate input rows
- strips internal notes, audit logs, AI raw payload, billing / settlement internals,
  raw phone, raw address, raw LINE identity, token, secret, database URL, and
  `finalAppointmentId`

## Query Spec Behavior

`buildEngineerMobileTaskListQuerySpec(input)`:

- requires `organizationId` and `engineerId`
- returns fail-closed when required params are missing
- returns `executable: false` by default
- uses a static placeholder-based SQL string
- does not interpolate raw input values into SQL text
- does not request raw customer payload
- does not request raw phone, raw address, raw LINE identity, token, secret, or
  `finalAppointmentId`

The query spec is preparation only. A future repository/query-executor task must decide
whether and how to execute a database query.

## Isolation Notes

Engineer assignment isolation must be enforced in the future repository/query and is
still reinforced by the existing service-level filtering. This task only prepares the
safe mapping/query boundary.

## Regression Coverage

Added `tests/engineerMobile/engineerMobileTaskListReadModelMapper.unit.test.js` to
verify:

- exported mapper/query spec functions and constants
- missing input returns empty tasks
- valid synthetic rows map to safe read model shape
- rows missing required ids are excluded
- rows can be filtered by organization and engineer
- row ordering is deterministic
- internal/sensitive fields are stripped
- input rows are not mutated
- query spec requires `organizationId` and `engineerId`
- query spec fail-closes when required params are missing
- query spec remains `executable: false`
- SQL uses placeholders and does not interpolate raw values
- query fields do not include raw customer payload or `finalAppointmentId`
- module imports no DB, repository, provider, AI, route, app, or server modules

## Future Tasks

- Add an injected query executor / repository adapter in a separate no-real-DB task.
- Add DB dry-run only after explicit disposable local/test DB authorization.
- Wire a real repository into server/app bootstrap only after a separate bounded task.
- Add smoke coverage only after the runtime branch explicitly permits smoke execution.
