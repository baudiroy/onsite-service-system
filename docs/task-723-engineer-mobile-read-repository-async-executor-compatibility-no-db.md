# Task 723 - Engineer Mobile Read Repository Async Executor Compatibility / No DB

## Summary

Task 723 adds async executor compatibility to the Engineer Mobile read repository layer without changing the current HTTP route behavior.

The existing synchronous read repository methods remain available and unchanged for current injected synthetic tests. New async methods are added so a future DB-backed executor can return a Promise without being mistaken for an empty read model.

## Scope

Changed:

- `src/engineerMobile/engineerMobileTaskListReadRepository.js`
- `src/engineerMobile/engineerMobileTaskDetailReadRepository.js`
- `src/engineerMobile/engineerMobileReadRepository.js`
- `tests/engineerMobile/engineerMobileTaskListReadRepository.unit.test.js`
- `tests/engineerMobile/engineerMobileTaskDetailReadRepository.unit.test.js`
- `tests/engineerMobile/engineerMobileReadRepository.unit.test.js`

Added:

- `docs/task-723-engineer-mobile-read-repository-async-executor-compatibility-no-db.md`

## Runtime Boundary

Task 723 adds repository-level async methods only:

- `getTaskListAsync`
- `getTaskDetailAsync`
- `getReadModelAsync`

It does not switch controllers, routes, services, app wiring, or server wiring to async DB access.

## Guarantees

The async path preserves the same safety rules as the sync path:

- missing organization / engineer / appointment context fail-closes
- executor rejection fail-closes
- executor raw errors are not logged or leaked
- mapped output excludes internal notes, audit logs, AI raw payload, billing / settlement internals, raw phone / address / LINE ids, secrets, tokens, database URLs, and `finalAppointmentId`
- query specs stay cloned and frozen before executor invocation

## No DB / No Migration

Task 723 does not:

- connect to a database
- execute SQL
- run `psql`
- apply or dry-run migrations
- create DB clients or pools
- change API routes
- change Admin frontend
- modify smoke tests
- add provider, notification, LINE, SMS, AI, RAG, or vector runtime

## Verification

Expected verification:

```bash
node --test tests/engineerMobile/engineerMobileTaskListReadRepository.unit.test.js tests/engineerMobile/engineerMobileTaskDetailReadRepository.unit.test.js tests/engineerMobile/engineerMobileReadRepository.unit.test.js
node --test tests/engineerMobile/engineerMobileReadModelFixtureMapper.unit.test.js tests/engineerMobile/engineerMobileRoute.unit.test.js tests/engineerMobile/engineerMobileTaskDetailRoute.unit.test.js tests/engineerMobile/engineerMobileReadRepository.unit.test.js tests/engineerMobile/engineerMobileCompositeReadRepositoryE2E.integration.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileTaskListReadRepository.js src/engineerMobile/engineerMobileTaskDetailReadRepository.js src/engineerMobile/engineerMobileReadRepository.js tests/engineerMobile/engineerMobileTaskListReadRepository.unit.test.js tests/engineerMobile/engineerMobileTaskDetailReadRepository.unit.test.js tests/engineerMobile/engineerMobileReadRepository.unit.test.js docs/task-723-engineer-mobile-read-repository-async-executor-compatibility-no-db.md
```

## Future Task

A later bounded task may update the Engineer Mobile controller / route service path to await async repository methods when a real DB executor is injected.
