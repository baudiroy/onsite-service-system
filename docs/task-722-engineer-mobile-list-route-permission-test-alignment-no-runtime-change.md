# Task 722 - Engineer Mobile List Route Permission Test Alignment / No Runtime Change

## Summary

Task 722 aligns the Engineer Mobile list route unit test with the current route stack after the permission middleware was added to `GET /engineer-mobile/tasks`.

The production route already registers:

- Engineer Mobile permission middleware
- Engineer Mobile task list controller handler

The previous unit test still assumed a single route handler and omitted the permission context required by the middleware. This task updates only the test expectations.

## Scope

Changed:

- `tests/engineerMobile/engineerMobileRoute.unit.test.js`

Added:

- `docs/task-722-engineer-mobile-list-route-permission-test-alignment-no-runtime-change.md`

## Coverage

The updated test now verifies:

- `GET /engineer-mobile/tasks` registers both permission middleware and controller handler.
- The route handler test passes through the permission middleware before invoking the controller.
- The injected task read model still returns only assigned, safe task data.
- The route import boundary explicitly allows the Engineer Mobile permission middleware while still forbidding DB, repository, provider, notification, AI, RAG, vector, app listen, and server listen imports.

## No Runtime Boundary

Task 722 does not change:

- backend runtime source
- Admin frontend
- API behavior
- DB schema
- migrations
- smoke tests
- package files
- provider, notification, LINE, SMS, AI, RAG, or vector runtime

## Verification

Expected verification:

```bash
node --test tests/engineerMobile/engineerMobileRoute.unit.test.js
node --test tests/engineerMobile/engineerMobileReadModelFixtureMapper.unit.test.js tests/engineerMobile/engineerMobileRoute.unit.test.js tests/engineerMobile/engineerMobileTaskDetailRoute.unit.test.js tests/engineerMobile/engineerMobileReadRepository.unit.test.js tests/engineerMobile/engineerMobileCompositeReadRepositoryE2E.integration.test.js
git diff --check -- tests/engineerMobile/engineerMobileRoute.unit.test.js docs/task-722-engineer-mobile-list-route-permission-test-alignment-no-runtime-change.md
```
