# Task 720 - Engineer Mobile Read Model Sanitized Fixture Contract / No Runtime

## Summary

Task 720 defines a sanitized synthetic fixture contract for future Engineer Mobile read-model unit tests.

Added:

- `tests/engineerMobile/fixtures/engineerMobileReadModelRows.fixture.js`
- `tests/engineerMobile/engineerMobileReadModelFixtureContract.static.test.js`

## Purpose

The fixture provides safe read-model rows aligned with migration `022_create_engineer_mobile_read_model.sql` and the existing mapper expectations.

It is for unit/static tests only. It is not seed data, not DB data, not production-like data, and not an import/export payload.

## Non-runtime Scope

Task 720 does not:

- perform no DB execution
- perform no migration dry-run
- connect to a DB
- execute SQL
- run `psql`
- apply or dry-run migrations
- add repository reads
- no runtime access
- add API routes/controllers/services
- modify runtime source
- modify Admin UI
- add smoke or integration tests

## Fixture Scenarios

The synthetic fixture covers:

- assigned appointment row
- multi-appointment same-case rows
- completed appointment row where `finalAppointmentId` is resolved by backend/system outside the read model
- source unassigned appointment exclusion concept
- internal note exclusion concept

The read model fixture intentionally does not include a formal Field Service Report id. Task detail rows are not Field Service Reports.

## Redaction Rules

Fixture data must remain synthetic and masked.

Allowed:

- synthetic ids
- masked customer names
- masked phones
- district-level address summaries
- safe issue / product / service summaries
- safe metadata references

Forbidden:

- real customer names
- full phone values
- full address values
- raw LINE identifiers
- DB URLs
- tokens
- secrets
- passwords
- raw credentials
- full payloads
- internal notes
- audit logs
- AI raw payloads
- billing / settlement internal data

## Future Use

Future unit tests may import this fixture to verify read-model mapper behavior, permission filtering, customer-visible filtering, and engineer assignment scope.

Future tasks must not treat this fixture as:

- a DB seed file
- a migration sample
- a production data example
- a smoke fixture
- a substitute for organization scope checks

## Current Boundary

This task only adds the fixture contract, fixture rows, and static guard.
It does not create runtime access, repository reads, DB seed data, or migration execution.
