# Task 690 - App Factory Engineer Mobile Options Integration

## Summary

Task 690 wires Engineer Mobile route options through the app factory.

`createApp({ engineerMobile })` now passes `options.engineerMobile` to
`createAppRouter`, allowing the already-mounted `GET /engineer-mobile/tasks` route
to use an injected read model or task provider at app-factory level.

## Runtime Boundary

This task only updates the app factory option pass-through in `src/app.js`.

It does not:

- modify `src/server.js`
- create a database client
- execute real database queries
- add or apply migrations
- add repository wiring
- create provider clients
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- change auth middleware
- change audit-log writers
- add smoke tests

## Compatibility

Default app behavior remains no-options safe-deny:

- `GET /engineer-mobile/tasks` is present on the default app
- missing auth returns generic `403` deny
- no sensitive data is returned

Injected app behavior is covered with synthetic read-only options:

- `createApp({ engineerMobile: { readModel } })` returns only tasks assigned to
  the authenticated engineer within the authenticated organization
- wrong organization tasks are excluded
- wrong engineer tasks are excluded
- raw phone, raw address, raw LINE identity, tokens, secrets, database URL,
  internal notes, audit logs, AI raw payload, and `finalAppointmentId` are not
  returned
- injected `taskProvider` is not called during app creation; it is only called
  when the route request executes

Customer Access and Data Correction app routes remain present.

## Regression Coverage

Added `tests/engineerMobile/engineerMobileAppFactoryOptions.unit.test.js` to verify:

- `src/app.js` still exports default `app`
- `src/app.js` still exports `createApp`
- default app mounts `GET /engineer-mobile/tasks` and safely denies missing auth
- `createApp({ engineerMobile: { readModel } })` supports valid engineer auth
- only assigned engineer tasks within organization are returned
- forbidden internal/sensitive fields are redacted
- app creation does not call injected task providers before a request
- Customer Access and Data Correction routes remain present
- `src/app.js` does not import DB, repository, provider, AI/RAG, server bootstrap,
  or call `app.listen`

## Future Tasks

- Wire server-level `engineerMobile` options through bootstrap only after a separate
  no-shared-DB task is approved.
- Add a real Engineer Mobile read repository only after an explicit DB/runtime task.
- Add platform engineer auth middleware integration in a separately scoped task.
- Build Engineer Mobile UI in a separate frontend/mobile task.
