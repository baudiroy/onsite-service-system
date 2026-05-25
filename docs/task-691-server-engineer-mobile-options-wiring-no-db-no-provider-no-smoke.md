# Task 691 - Server Engineer Mobile Options Wiring

## Summary

Task 691 wires server-level Engineer Mobile options through the existing server
bootstrap path.

`createServerBootstrap({ engineerMobile })` can now create an app whose mounted
`GET /engineer-mobile/tasks` route uses the explicitly injected
`options.engineerMobile` read model or task provider.

## Runtime Boundary

The server only passes explicit options into the app factory. It does not create an
Engineer Mobile task provider, database client, repository, provider client, or AI/RAG
runtime.

This task does not:

- modify migrations
- execute database commands
- apply or dry-run migrations
- read new environment secrets
- create provider clients
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- modify permission middleware
- add audit-log writer runtime
- run smoke tests

`options.app` priority is preserved. When a caller provides an app directly, the server
uses that app and does not create an Engineer Mobile route app or call injected task
providers.

## Compatibility

The server keeps existing Customer Access and Data Correction option paths compatible.
When `customerAccessBootstrap`, `dataCorrection`, and `engineerMobile` are provided
together, server bootstrap still creates an app and the Engineer Mobile route remains
active with injected read-only options.

## Regression Coverage

Added `tests/engineerMobile/engineerMobileServerOptions.unit.test.js` to verify:

- server module still exports existing helpers
- `options.app` priority wins over `engineerMobile`
- `createServerBootstrap({ engineerMobile })` creates an app with
  `GET /engineer-mobile/tasks` active
- bootstrap creation does not call `taskProvider`
- request execution calls the injected task provider
- valid auth returns only assigned engineer tasks within organization scope
- wrong organization and wrong engineer tasks are excluded
- missing auth returns generic `403` safe deny
- raw phone, raw address, raw LINE identity, token, secret, database URL, internal
  note, audit log, AI raw payload, and `finalAppointmentId` are redacted
- Customer Access and Data Correction server option paths remain compatible
- server source does not directly import Engineer Mobile route/controller/service,
  DB, repository, provider, or AI/RAG modules
- `startServer` with a synthetic injected app listens only when explicitly called

## Future Tasks

- Add real Engineer Mobile repository wiring in a separately scoped no-shared-DB task.
- Add platform engineer auth middleware in a separately scoped permission task.
- Add Engineer Mobile UI/mobile workbench work in a separately scoped frontend/mobile task.
- Add smoke coverage only after the runtime branch explicitly approves smoke execution.
