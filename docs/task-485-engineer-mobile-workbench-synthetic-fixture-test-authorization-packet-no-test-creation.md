# Task 485 - Engineer Mobile Workbench Synthetic Fixture / Test Authorization Packet

## Status

Task 485 is docs-only.

It prepares a future authorization packet for Engineer Mobile Workbench synthetic fixtures and minimal tests. It does not create fixtures, tests, runtime behavior, or test execution.

## Current Baseline

Current branch remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task 467 through Task 478 introduced skeleton route/controller/resolver/guard/projection/auth/completion boundary files only.

Task 479 through Task 481 closed and handed off the minimal skeleton boundary.

Task 482 documented future actual auth/session design but did not implement runtime.

Task 483 documented future real permission / assignment design but did not implement runtime.

Task 484 documented future real projection data design but did not implement runtime.

Task 485 does not authorize fixture creation, test creation, DB access, smoke execution, browser execution, API execution, or runtime expansion.

## Future Test Purpose

Future synthetic fixture and minimal test work should verify Engineer Mobile Workbench boundaries without turning skeleton endpoints into functional runtime.

Future tests may verify:

- route registration does not accidentally disappear
- controller-to-resolver wiring remains intentional
- resolver-to-auth/guard/projection/completion boundary wiring remains intentional
- skeleton endpoints still do not query DB
- skeleton endpoints still do not send provider notifications
- skeleton endpoints still do not call AI/RAG/vector database
- skeleton endpoints still do not persist Case / Appointment / Field Service Report state
- skeleton endpoints still do not expose `finalAppointmentId` as engineer-selectable
- no sensitive fixture data exists

Future tests must preserve one Case = one formal Field Service Report and system-owned `finalAppointmentId` principles.

## Synthetic Fixture Principles

Future fixtures must use synthetic data only.

Future fixtures must not use:

- production data
- shared runtime data
- Zeabur/prod data
- real customer names
- real phone numbers
- real addresses
- raw LINE ids
- raw channel ids
- real token / secret / key values
- real photos
- real signatures
- real attachments
- real provider payloads

If a fixture needs phone, address, or channel-like values, it must use clearly fake or masked values.

Fixture data must never be sent to an AI provider.

Fixture values should be intentionally artificial, obvious, and safe for logs, diffs, local test output, and PM review.

## Future Allowed Test Categories

The following categories are proposal-only. Task 485 does not create any tests.

Future PM-scoped tasks may consider:

- static import guard tests
- not implemented response tests
- route registration tests
- controller-to-resolver wiring tests
- resolver-to-auth / guard / projection / completion boundary wiring tests
- safe-deny equivalence tests, after future runtime exists
- permission denial tests, after future runtime exists
- allow-list projection tests, after future runtime exists
- duplicate completion submission tests, after future runtime exists
- Field Service Report uniqueness guard tests, after future runtime exists
- `finalAppointmentId` system-owned tests, after future runtime exists
- no provider sending tests
- no AI provider call tests
- sensitive fixture scan tests

## Test Boundaries

Future test work must not:

- connect to DB unless PM separately authorizes DB/test DB scope
- execute migration
- execute Migration020
- call provider sending
- call AI/RAG/vector database
- use production data
- access shared/prod/Zeabur data
- write Case official state
- write Appointment official state
- write Field Service Report official state
- create a formal Field Service Report
- create a real appointment
- process real photos or signatures
- test mobile UI unless PM separately authorizes mobile UI scope
- execute smoke/browser/API tests unless PM separately authorizes them

Minimal skeleton tests should stay static or local-process only unless a future PM task explicitly expands scope.

## Future Authorization Template

Task 485 does not authorize this template. It only records a future template PM may use later.

Future PM authorization may use a form like:

```text
I authorize TaskXXX: Engineer Mobile Workbench synthetic fixture and minimal test skeleton only.

Scope:
- exact files listed by PM
- synthetic fixtures only
- no production data
- no DB
- no migration
- no Migration020
- no provider sending
- no AI/RAG/vector DB
- no mobile UI
- no smoke/browser/API tests unless explicitly listed
- no formal Case / Appointment / Field Service Report state mutation
- no engineer manual finalAppointmentId selection
```

Any future task using this template must still list exact allowed files and exact verification commands.

## Future Exact File Planning Guidance

This section is guidance only. It does not authorize file creation.

Future file categories may include:

- `tests/...engineerMobileWorkbench...`
- `fixtures/...synthetic...`
- static test helpers
- response fixture snapshots
- sensitive fixture scan helper scripts

Actual files must wait until PM lists exact allowed files in a future task.

## Sensitive Scan Requirements

Future fixture/test tasks must include scans for:

- secrets
- tokens
- raw LINE/channel ids
- phone-like values
- address-like values
- provider payload markers
- production-like data
- DB connection strings

Future scans should be designed to avoid self-matching on the scan command text inside documentation.

## Future Stop Conditions

Future fixture/test work must stop and report if it requires:

- modifying any `src/` file
- modifying any `admin/src/` file
- adding fixtures without PM exact file scope
- adding tests without PM exact file scope
- executing tests without PM exact command scope
- adding or modifying runtime code
- adding service
- adding repository
- connecting to DB
- executing migration
- implementing real permission runtime
- implementing actual auth/session validation
- implementing real projection data
- implementing completion persistence
- implementing mobile UI
- implementing upload / signature / object storage
- triggering provider sending
- calling AI/RAG/vector database

## Explicit Non-goals

Task 485 does not:

- modify backend `src/`
- modify `admin/src/`
- add fixtures
- add tests
- execute tests
- add or modify route/controller/resolver/guard/projection/auth/boundary code
- add actual auth/session validation
- add real permission decision
- add real projection data
- add service
- add repository
- add DB / migration / Migration020
- execute DB / migration / psql
- execute smoke/browser/API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Migration / Schema Decision

No migration, schema, index, DB, or Migration020 change is included in Task 485.

## Runtime Decision

No runtime behavior is changed in Task 485.

The Engineer Mobile Workbench remains at the skeleton-only boundary. Future fixture/test creation still requires PM exact allowed files and scope.
