# Task 486 - Engineer Mobile Workbench Synthetic Fixture / Test File Touch Plan

## Status

Task 486 is docs-only.

It defines a future file touch plan for Engineer Mobile Workbench synthetic fixtures and minimal tests. It does not create fixtures, tests, or runtime behavior.

## Current Baseline

Current branch remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task 485 completed the fixture/test authorization packet.

Task 486 is only a file touch plan.

Task 486 does not create fixtures.

Task 486 does not create tests.

Task 486 does not execute tests.

## Future Candidate Fixture / Test Files

The following are future candidate files only. Task 486 does not create them.

Future candidates may include:

- `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.noDbImports.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.notImplementedResponse.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.noSensitivePayload.test.js`
- `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js`

These paths are planning candidates. They do not grant permission to create files.

If any future task creates fixtures or tests, PM must list exact allowed files in that single task.

## Future Test Purpose Mapping

| Future file | Purpose | Allowed data | Forbidden data | Requires DB? | Executes provider/AI? |
| --- | --- | --- | --- | --- | --- |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js` | Verify skeleton boundaries, route/controller/resolver shape, and not-implemented behavior if later scoped. | Synthetic-only route names and safe status expectations. | Production data, real customer data, real phone/address, raw LINE id, actual Case / Appointment / Field Service Report mutation. | No | No |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.noDbImports.test.js` | Verify skeleton files do not import DB/repository/service modules before runtime scope. | Static file path and import metadata. | DB credentials, production data, runtime query results. | No | No |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.notImplementedResponse.test.js` | Verify endpoints still return the expected not-implemented response until runtime is scoped. | Synthetic request metadata and expected safe response shape. | Real customer/task/case/appointment payloads, provider payloads, formal state mutation. | No | No |
| `tests/engineerMobileWorkbench/engineerMobileWorkbench.noSensitivePayload.test.js` | Verify future response fixtures do not include sensitive or internal payloads. | Synthetic response samples and masked values. | Real customer name, real phone, real address, raw channel ids, token / secret / api key, raw provider payload. | No | No |
| `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js` | Provide clearly fake data for future static or local tests. | Synthetic ids such as `synthetic-*`, masked phone/address-like values, fake product/task labels. | Production/shared/Zeabur data, real photos, signatures, attachments, real provider payloads, cross-organization data. | No | No |

All future rows are synthetic-only, no production data, no DB, no provider sending, no AI/RAG, no real customer / phone / address / LINE id, and no actual Case / Appointment / Field Service Report state mutation.

## Future Fixture Data Policy

Future fixture data must be synthetic-only.

Future fixture data must not contain:

- real customer name
- real phone
- real address
- raw LINE / provider channel ids
- token / secret / api key
- raw provider payload
- real photo / signature / attachment
- production data
- shared runtime data
- Zeabur data

If an id is needed, use clearly fake values such as `synthetic-*`.

If a phone-like or address-like value is needed, use masked or clearly fake values.

Fixtures must not be sent to an AI provider.

Fixtures must not be treated as business records.

## Future Minimal Test Categories

The following are proposal-only categories:

- skeleton endpoint still returns 501
- route registration exists
- controller-to-resolver wiring remains skeleton
- resolver-to-auth/guard/projection/completion boundary wiring remains skeleton
- no DB / repository / service imports
- no provider / AI imports
- no fake customer/task/case/appointment/Field Service Report payload
- no `finalAppointmentId` manual selection
- no Case / Appointment / Field Service Report mutation
- no Field Service Report draft/formal Field Service Report creation

Task 486 does not create or execute any of these tests.

## Future Verification Command Plan

This plan is proposal-only.

Future verification may include:

```bash
git diff --check
```

```bash
npm run check
```

```bash
npm test -- --runInBand tests/engineerMobileWorkbench
```

Task 486 does not execute `npm test`.

Any future test command must be explicitly authorized by PM in a future task.

Smoke, browser, and API tests must not be executed unless PM separately lists them in scope.

## Sensitive Scan Plan

Future fixture/test tasks must scan for:

- token / secret / api key
- raw LINE / channel ids
- phone-like values
- address-like values
- provider payload markers
- production-like ids
- DB connection strings
- real photo / signature references

Future scan commands should avoid self-matching against documentation text.

## Stop Conditions For Future Fixture / Test Tasks

Codex must stop and report if a future fixture/test task requires:

- DB / repository access
- migration / Migration020
- provider sending
- AI/RAG/vector database
- production/shared/Zeabur data
- real customer data
- smoke/browser/API tests without PM scope
- runtime code outside exact allowed files
- package changes
- mobile UI
- upload / signature / object storage runtime

## PM Workflow Rule

The user has agreed that Codex may execute PM tasks after PM clearly defines exact allowed files and scope.

This is not unlimited authorization.

Every task must remain single, explicit, and bounded.

Every task must list:

- allowed files
- forbidden changes
- verification scope
- stop conditions

Codex must not expand scope on its own.

If work requires anything outside scope, Codex must stop and report.

## Explicit Non-goals

Task 486 does not:

- modify backend `src/`
- modify `admin/src/`
- add fixtures
- add tests
- execute tests
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- add actual auth/session validation
- add real permission decision
- add real projection data
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

No migration, schema, index, DB, or Migration020 change is included in Task 486.

## Runtime Decision

No runtime behavior is changed in Task 486.

The Engineer Mobile Workbench remains skeleton-only. Future fixture/test tasks still require PM exact files and scope.
