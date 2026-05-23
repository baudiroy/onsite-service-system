# Task 588 - Customer Access Resolver Unit Test Authorization Review

## Scope

Task588 is a docs-only authorization readiness review for possible future Customer Access Resolver unit test implementation.

Task588 is:

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

Task588 does not authorize test implementation.

## Current Baseline Recap

Current accepted baseline:

- Task574 through Task578: resolver static baseline closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact test implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.
- Task587: pure function skeleton authorization review completed.

Current state:

- actual unit test implementation still not authorized.
- actual resolver skeleton still not authorized.
- actual response envelope helper still not authorized.
- API, DB, migration, provider sending, and AI remain no-go.

## Authorization Review Conclusion

TASK588 DOES NOT AUTHORIZE UNIT TEST IMPLEMENTATION.

Task588 only performs unit test authorization readiness review.

Task588 does not:

- create `tests/customerAccess/customerAccessResolver.unit.test.js`.
- modify existing tests.
- modify fixtures.
- create resolver runtime.
- create response envelope helper.
- change runtime behavior.

## Future Unit Test Candidate Summary

If separately authorized, the only recommended unit test file is:

```text
tests/customerAccess/customerAccessResolver.unit.test.js
```

If later authorized, it must:

- use Node built-in test runner.
- test pure function input to decision output.
- use synthetic input objects.
- not start a server.
- not connect to DB.
- not import repository / route / controller / provider / AI modules.
- not use real customer PII, token, secret, or LINE credential.

## Future Test Subject Dependency Condition

Unit test implementation depends on whether the future resolver skeleton exists.

If `src/customerAccess/customerAccessResolver.js` has not been authorized and created, unit test implementation must not silently assume runtime behavior.

If a future task wants test-first development, it must explicitly authorize:

- whether a failing test may be created.
- exact test file path.
- exact import target.
- expected failure state.
- allowed command.
- stop condition.

Task588 does not authorize test-first development or a failing test.

## Future Minimum Test Authorization Checklist

Before future test implementation begins, the task must include:

- exact task name.
- exact allowed test file path.
- exact forbidden files.
- exact allowed commands.
- whether test-first failing test is allowed.
- whether import of a future resolver module is allowed.
- whether DB remains forbidden.
- whether migration remains forbidden.
- whether route / controller remains forbidden.
- whether provider sending remains forbidden.
- whether AI / RAG remains forbidden.
- safe-deny / sensitive-output assertions.
- no-side-effect assertions.
- rollback / stop condition.
- PM acceptance criteria.

## Future Test Behavior Checklist

Future unit tests should cover at least:

- allow valid access.
- deny missing organization scope.
- deny cross-organization Case.
- deny wrong customer.
- deny unverified customer identity.
- deny unlinked Case.
- deny publication not allowed.
- deny customer-visible policy failure.
- deny raw phone only.
- deny raw address only.
- deny LINE id alone.
- deny `organization_id + line_channel_id + line_user_id` alone.
- deny malformed input.
- deny unknown / unsupported access reason.
- sensitive output scan.
- no-write / no-side-effect expectation.
- no finalAppointmentId modification expectation.

## Future Implementation Stop Conditions

Future test implementation must stop and report to PM if it appears to require:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection implementation.
- response envelope implementation.
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
- changes outside exact authorized files.

## Mandatory Invariants

Any future unit test work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Next Task Candidates

Candidates only; do not execute from Task588:

- Task589 - Customer Access Response Envelope Authorization Review / No Runtime Change.
- Task590 - Customer Access Resolver Pure Function Skeleton Explicit Authorization Packet / Exact Files Review / No Runtime Change.
- Task591 - Customer Access Resolver Unit Test Explicit Authorization Packet / Exact Files Review / No Runtime Change.

Task588 does not start Task589.

## Non-goals

Task588 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task587 documents.

Task588 does not run:

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

Task588 remains aligned with `PROJECT_GUARDRAILS.md`:

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
