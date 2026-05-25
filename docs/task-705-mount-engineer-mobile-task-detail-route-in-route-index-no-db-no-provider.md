# Task 705 - Mount Engineer Mobile Task Detail Route in Route Index / No DB / No Provider

## Summary

Task 705 mounted the injected, read-only Engineer Mobile task detail route in the central route index.

Mounted routes:

- `GET /engineer-mobile/tasks`
- `GET /engineer-mobile/tasks/:appointmentId`

Both routes receive the same `options.engineerMobile` object from `createAppRouter(options)`, preserving the existing injected read model / task provider pattern without introducing DB, repository, provider, AI, app, or server dependencies.

## Runtime Boundary

- Updated only the central route index registration.
- Did not change `src/app.js` or `src/server.js`.
- Did not mount a real DB provider.
- Did not add migrations, schema changes, repositories, fixtures, smoke scripts, browser tests, or package scripts.
- Did not change Customer Access or Data Correction route behavior.

## Permission Boundary

`GET /engineer-mobile/tasks/:appointmentId` remains protected by `createEngineerMobilePermissionMiddleware` before the task detail controller handler.

The mounted route preserves the existing safe behavior:

- Missing auth is denied before any read model / provider call.
- Missing permission is denied before any read model / provider call.
- Valid engineer auth with a matching same-organization assigned appointment returns safe detail data.
- Wrong organization, wrong engineer, or wrong appointment returns a generic unavailable response.
- Detail output excludes internal notes, audit data, AI raw payload, billing / settlement internals, raw phone, raw address, raw LINE id, token / secret, `DATABASE_URL`, evidence tokens, and `finalAppointmentId`.

## Compatibility Coverage

Added `tests/engineerMobile/engineerMobileTaskDetailRouteMount.unit.test.js` to cover:

- Central router mounts the list route.
- Central router mounts the detail route.
- List route is registered before detail route.
- Detail route stack has permission middleware before controller.
- Missing auth and missing permission deny before injected read model.
- Valid engineer auth and matching appointment return HTTP 200 detail.
- Wrong org / engineer / appointment return generic safe unavailable.
- Detail response redacts sensitive/internal fields and `finalAppointmentId`.
- List route still returns assigned scoped tasks with the same injected options.
- Customer Access and Data Correction routes remain mounted.
- Route index source does not import DB / repository / provider-like dependencies or app/server bootstrap.

## Future Tasks

- Add app/server-level detail route tests only when a broader app/server route verification task is approved.
- Add a real DB repository and detail mapper in a separate bounded task.
- Add Engineer Mobile UI detail page in a separate frontend/mobile workbench task.
- Add smoke/browser coverage only after the runtime route is backed by an approved read provider and user-visible UI.
