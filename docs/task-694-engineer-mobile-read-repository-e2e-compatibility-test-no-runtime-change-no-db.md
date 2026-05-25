# Task 694 - Engineer Mobile Read Repository E2E Compatibility Test

## Summary

Task 694 adds integration coverage for the Engineer Mobile read repository path without
changing runtime source.

The test verifies that the Task 693 repository can be used as an injected read model or
task provider for the already-mounted Engineer Mobile task list route through app and
server factory options.

## Runtime Boundary

This task is test-only plus documentation.

It does not:

- modify runtime source
- connect to a database
- execute real SQL
- add or apply migrations
- modify API mounts
- modify permission runtime services
- write audit logs
- send LINE / SMS / email / app push notifications
- add AI / RAG runtime
- run smoke or browser tests

## Coverage

Added `tests/engineerMobile/engineerMobileReadRepositoryE2E.integration.test.js` to
verify:

- repository default mode fail-closes and does not call an executor
- repository synthetic mode with `allowNonExecutableForTest: true` calls an injected
  executor
- executor receives a frozen safe query spec
- query spec uses placeholders and does not interpolate raw organization/engineer values
- app route works with repository-backed read model wrapper
- app route works with repository-backed task provider wrapper
- valid engineer auth returns only assigned engineer tasks within organization scope
- wrong organization and wrong engineer rows are excluded
- missing auth returns generic `403` safe deny
- executor throw returns a safe empty task list without leaking raw error text
- server bootstrap can build an app with repository-backed Engineer Mobile options
  without calling `listen`
- server `options.app` priority bypasses Engineer Mobile provider/executor paths
- responses redact raw phone, raw address, raw LINE identity, token, secret, database
  URL, internal note, audit log, AI raw payload, and `finalAppointmentId`

The test uses only synthetic sentinel strings and does not use real customer data,
tokens, secrets, LINE credentials, database credentials, browser automation, or provider
sending.

## Notes

Because the existing Task 651 service resolves task providers without passing request
arguments, the E2E test uses small wrapper functions that call the repository with the
same synthetic organization/engineer context as the request. A future repository wiring
task may improve this by adding an explicit request-aware provider adapter if needed.

## Future Tasks

- Add a request-aware Engineer Mobile repository adapter in a separately scoped task.
- Add executable query spec and real DB client wiring only after explicit approval.
- Add DB dry-run only after disposable local/test DB authorization.
- Add auth middleware and mobile UI in separate bounded tasks.
- Add smoke coverage only after the runtime branch explicitly permits smoke execution.
