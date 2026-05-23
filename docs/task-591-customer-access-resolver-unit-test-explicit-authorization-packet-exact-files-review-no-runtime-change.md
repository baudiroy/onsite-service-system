# Task 591 - Customer Access Resolver Unit Test Explicit Authorization Packet

## Scope

Task591 is a docs-only explicit authorization packet and exact-files review for a possible future Customer Access Resolver unit test.

Task591 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no route / controller.
- no DTO / projection.
- no DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.

Task591 does not authorize test implementation.

## Current Baseline Recap

Current accepted baseline:

- Task574 through Task578: resolver static baseline closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.
- Task587: pure function skeleton authorization review completed.
- Task588: unit test authorization review completed.
- Task589: response envelope authorization review completed.
- Task590: resolver pure function skeleton explicit authorization packet completed.

Current state:

- actual unit test file still not authorized.
- actual resolver skeleton still not authorized.
- actual response envelope helper still not authorized.

## Explicit Non-authorization Conclusion

TASK591 DOES NOT AUTHORIZE CREATION OF `tests/customerAccess/customerAccessResolver.unit.test.js`.

Task591 only creates a future unit test authorization packet.

Task591 does not:

- create unit test file.
- modify existing tests.
- modify fixtures.
- create resolver runtime.
- create response envelope helper.
- change runtime behavior.
- execute unit test.

## Future Exact Test File Authorization Candidate

If a future task separately authorizes the unit test, the only recommended test file is:

```text
tests/customerAccess/customerAccessResolver.unit.test.js
```

Future implementation should allow only this single test file unless PM separately authorizes additional files.

Future implementation must not:

- modify existing tests.
- modify fixtures.
- add helper fixture unless separately authorized.

Task591 does not create this file.

## Future Test Subject Dependency

Unit test implementation depends on a future resolver skeleton.

Expected test subject:

```text
src/customerAccess/customerAccessResolver.js
```

If the resolver skeleton has not been created by an authorized task, unit test implementation must not assume runtime exists.

If future work uses test-first development, it must separately authorize:

- failing test creation.
- import of a not-yet-existing module.
- expected failure state.
- allowed commands.
- stop condition.

Task591 does not authorize test-first development, failing tests, or import of a nonexistent module.

## Future Allowed Test Boundary

If later authorized, unit tests must be:

- Node built-in test runner.
- pure function input to decision output.
- synthetic input objects only.
- no server startup.
- no DB connection.
- no repository mock.
- no route / controller / API test.
- no provider mock.
- no AI / RAG mock.
- no audit log write.
- no real customer PII.
- no token / secret / LINE credential.

## Future Exact Test Matrix

Future implementation should cover at least:

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

Future unit test implementation must not:

- use a mock DB instead of pure input.
- use a repository mock instead of pure input.
- test route / controller / API endpoint.
- test real customer identity runtime.
- test publication state runtime write.
- test audit log write.
- test provider sending.
- use real phone / address / LINE id / token / secret.
- loosen safe-deny behavior to pass tests.
- create a second formal Field Service Report for testing.
- modify finalAppointmentId for testing.

## Future Allowed Commands Draft

If future test implementation is separately authorized, suggested commands:

```bash
node --test tests/customerAccess/customerAccessResolver.unit.test.js
git diff --check -- tests/customerAccess/customerAccessResolver.unit.test.js
```

Task591 must not run the `node --test` command above because the test file does not exist and Task591 does not create it.

Task591 may only run:

```bash
git diff --check -- docs/task-591-customer-access-resolver-unit-test-explicit-authorization-packet-exact-files-review-no-runtime-change.md
```

## Stop Conditions

Future test implementation must stop and report to PM if it appears to require:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection implementation.
- response envelope implementation.
- resolver implementation unless separately authorized.
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
- changes outside exact authorized test file.

## Mandatory Invariants

Any future test work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Next Task Candidates

Candidates only; do not execute from Task591:

- Task592 - Customer Access Response Envelope Explicit Authorization Packet / Exact Files Review / No Runtime Change.
- Task593 - Customer Access Resolver Pure Function Skeleton Final Go / No-Go Review / No Runtime Change.
- Task594 - Customer Access Resolver Unit Test Final Go / No-Go Review / No Runtime Change.

Task591 does not start Task592.

## Non-goals

Task591 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task590 documents.

Task591 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.
- `node --check src/customerAccess/customerAccessResponseEnvelope.js`.

## Guardrails Review

Task591 remains aligned with `PROJECT_GUARDRAILS.md`:

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
