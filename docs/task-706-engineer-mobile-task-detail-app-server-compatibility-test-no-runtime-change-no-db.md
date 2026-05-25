# Task 706 - Engineer Mobile Task Detail App/Server Compatibility Test / No Runtime Change / No DB

## Summary

Task 706 added app/server compatibility coverage for the mounted Engineer Mobile task detail route:

- `GET /engineer-mobile/tasks/:appointmentId`

This task did not modify runtime source. It only added an integration test and this task note.

## Coverage

`tests/engineerMobile/engineerMobileTaskDetailAppServerCompatibility.integration.test.js` verifies:

- `createApp({ engineerMobile: { readModel } })` can serve the mounted detail route with valid engineer auth and matching appointment.
- The opt-in request-aware provider path can still serve detail by returning the engineer task list and letting the detail service filter by `appointmentId`.
- `createServerBootstrap({ engineerMobile })` exposes the detail route through the app factory without calling `listen`.
- `options.app` priority bypasses engineerMobile provider/repository creation.
- Missing auth and missing permission deny before read model / provider calls.
- Wrong organization, wrong engineer, or wrong appointment returns generic safe unavailable.
- Detail response redacts raw phone, raw address, raw LINE id, token, secret, `DATABASE_URL`, internal note, audit log, AI raw payload, billing / settlement internals, evidence tokens, and `finalAppointmentId`.
- List route still works through app/server after the detail route mount.
- Customer Access and Data Correction app routes remain present.

## Request-aware Provider Note

The current request-aware adapter is list-oriented. For detail requests it maps auth into organization / engineer input and expects the repository/read model to return a scoped task collection, then the task detail service filters by `appointmentId`.

Future work may add a detail-specific request-aware repository adapter that receives `appointmentId` directly. Task 706 intentionally does not change runtime source to add that behavior.

## Runtime Boundary

- No runtime source changed.
- No `src/app.js` or `src/server.js` edits.
- No route/controller/service edits.
- No DB, SQL, migration, schema, repository, provider sending, AI/RAG/vector, browser, smoke, admin, fixture, or package changes.
- No real customer PII, tokens, secrets, LINE credentials, or AI provider settings were used.

## Future Tasks

- Add a detail-specific request-aware repository adapter only in a separate bounded runtime task.
- Add a real DB detail repository / mapper only after a separate DB-approved task.
- Add Engineer Mobile UI detail page and browser smoke only after the backend read provider and UI route are approved.
