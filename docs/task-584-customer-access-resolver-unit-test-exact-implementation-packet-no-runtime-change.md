# Task 584 - Customer Access Resolver Unit Test Exact Implementation Packet

## Scope

Task584 is a docs-only exact implementation packet for a possible future Customer Access Resolver unit test.

Task584 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.

Task584 does not create tests.

## Current Baseline Recap

The current customer access resolver branch has completed:

- Task574: implementation sequencing completed.
- Task575: resolver contract proposal completed.
- Task576: fixture marker extension completed.
- Task577: static decision matrix test completed, PASS 10/0.
- Task578: static baseline closure completed.
- Task579: runtime authorization packet completed.
- Task580: minimal runtime skeleton proposal completed.
- Task581: pure function skeleton readiness gate completed.
- Task582: exact implementation packet completed.
- Task583: unit test plan completed.

Current state:

- resolver skeleton implementation not authorized.
- unit test implementation not authorized.
- API, DB, migration, provider sending, and AI remain no-go.

## Future Exact Unit Test File Candidate

Future candidate only:

```text
tests/customerAccess/customerAccessResolver.unit.test.js
```

Task584 does not create this file.

Task584 does not modify any `tests/` file.

Task584 does not modify any `fixtures/` file.

Future unit test file creation requires separate explicit authorization.

## Future Exact Test Subject Candidate

Future candidate only:

```text
src/customerAccess/customerAccessResolver.js
```

Task584 does not create or modify this file.

The test plan assumes a future resolver is pure function only.

Future tests must not depend on:

- DB.
- repository.
- route.
- controller.
- provider.
- AI / RAG.
- audit writer.
- file storage.
- billing / settlement service.

## Future Allowed Test Shape

Future unit tests, if separately authorized, should:

- use Node built-in test runner.
- test pure function input to decision output.
- not start a server.
- not connect to DB.
- not import route / controller / repository / provider / AI modules.
- not use real customer PII, token, secret, or LINE credential.
- use synthetic input objects.
- expect generic safe-deny customer-facing output for every deny case.
- assert internal reason code only as server-side metadata.

## Future Exact Test Matrix

Minimum future cases:

- allow: valid organization scope, verified customer identity, linked Case, publication allowed, and customer-visible policy pass.
- deny: missing organization scope.
- deny: cross-organization Case.
- deny: wrong customer.
- deny: unverified customer identity.
- deny: unlinked Case.
- deny: publication not allowed.
- deny: customer-visible policy failure.
- deny: raw phone only.
- deny: raw address only.
- deny: LINE id alone.
- deny: `organization_id + line_channel_id + line_user_id` alone.
- deny: missing Case id.
- deny: malformed input.
- deny: unknown / unsupported access reason.
- sensitive output scan: no raw phone / address / LINE id / internal note / audit log / AI raw payload / billing internal data.
- side-effect expectation: no Field Service Report / appointment / publication / customer identity / audit log writes.
- invariant expectation: no finalAppointmentId modification.

## Future Forbidden Test Shortcuts

Future test implementation must not:

- use a mock DB instead of pure input.
- use a repository mock instead of pure input.
- test route / controller / API endpoint.
- test real customer identity runtime.
- test publication state runtime write.
- test audit log write.
- test provider sending.
- use real phone / address / LINE id / token / secret.
- loosen safe-deny behavior to make tests pass.
- create a second formal Field Service Report for testing.
- modify finalAppointmentId for testing.

## Future Allowed Commands Draft

If a future unit test implementation is separately authorized, suggested commands:

```bash
node --test tests/customerAccess/customerAccessResolver.unit.test.js
git diff --check -- tests/customerAccess/customerAccessResolver.unit.test.js
```

Task584 must not run the `node --test` command above because the test file does not exist and Task584 does not create it.

Task584 may only run:

```bash
git diff --check -- docs/task-584-customer-access-resolver-unit-test-exact-implementation-packet-no-runtime-change.md
```

## Stop Conditions

Future test implementation must stop and report to PM if it appears to require:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection implementation.
- audit log write.
- provider sending.
- AI / RAG.
- migration / schema.
- package change.
- permission runtime.
- entitlement runtime.
- customer identity runtime write.
- publication state write.
- real customer PII.
- token / secret.
- LINE credential.
- changes outside the exact authorized test file.

## Mandatory Invariants

Any future test work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` alone is not sufficient authorization.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Next Task Candidates

Candidates only; do not execute from Task584:

- Task585 - Customer Access Response Envelope Proposal / No Runtime Change.
- Task586 - Customer Access Resolver Pure Function Skeleton Authorization Review / No Runtime Change.
- Task587 - Customer Access Resolver Unit Test Authorization Review / No Runtime Change.

Task584 does not start Task585.

## Non-goals

Task584 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task583 documents.

Task584 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.

## Guardrails Review

Task584 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no provider sending.
- no AI auto decision.
- no customer-facing endpoint implementation.
- no sensitive data output.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
