# Task 708 - Engineer Mobile Detail-aware Provider Wiring in App/Server Options / No DB / No Provider

## Summary

Task 708 wired the Engineer Mobile request-aware provider option so `useRequestAwareProvider: true` supports both:

- `GET /engineer-mobile/tasks`
- `GET /engineer-mobile/tasks/:appointmentId`

The app factory now builds both the list provider and the detail-aware provider, then chooses the detail-aware provider when the route service input includes `appointmentId`.

## Behavior

List route requests still map:

- `organizationId`
- `engineerId`
- optional `dateRange`

Detail route requests now map:

- `organizationId`
- `engineerId`
- `appointmentId`

Body-provided organization, engineer, and appointment values remain ignored by the route/controller/service path.

## Compatibility

- Direct `engineerMobile.readModel` behavior remains unchanged when `useRequestAwareProvider` is not enabled.
- App creation does not call repository/readModel/taskProvider.
- Request execution calls injected repository/readModel/taskProvider.
- Server bootstrap passes engineerMobile options through the app factory without importing the adapter directly.
- `options.app` priority still bypasses engineerMobile provider wiring.
- Customer Access and Data Correction route compatibility remains intact.

## Boundary

- Modified only `src/app.js` for runtime wiring.
- `src/server.js` did not require code changes because it already passes `engineerMobile` options to the app factory.
- No route/controller/service changes.
- No DB, SQL, migration, schema, repository implementation, provider sending, AI/RAG/vector, smoke/browser, admin, package, guardrails, or design-doc changes.

## Future Tasks

- Add a real DB detail repository and mapper in a separate DB-approved task.
- Add Engineer Mobile UI detail page and browser smoke after backend read provider and UI route approval.
