# Task 587 - Customer Access Resolver Pure Function Skeleton Authorization Review

## Scope

Task587 is a docs-only authorization readiness review for a possible future Customer Access Resolver pure function skeleton.

Task587 is:

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

Task587 does not authorize implementation.

## Current Baseline Recap

Current accepted baseline:

- Task574 through Task578: resolver static baseline closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact test implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.

Current state:

- actual resolver skeleton still not authorized.
- actual unit test file still not authorized.
- response envelope helper still not authorized.
- API, DB, migration, provider sending, and AI remain no-go.

## Authorization Review Conclusion

TASK587 DOES NOT AUTHORIZE PURE FUNCTION SKELETON IMPLEMENTATION.

Task587 only performs authorization readiness review.

Task587 does not:

- create `resolveCustomerAccess`.
- create `src/customerAccess/customerAccessResolver.js`.
- create unit tests.
- create response envelope helper.
- change runtime behavior.
- add resolver runtime.
- add customer-facing API runtime.

## Future Implementation Candidate Summary

If separately authorized, the only recommended resolver skeleton file is:

```text
src/customerAccess/customerAccessResolver.js
```

If later authorized, it must remain:

- pure function only.
- deterministic input to decision output.
- side-effect free.
- fail-closed by default.
- no DB.
- no repository.
- no route / controller.
- no provider.
- no AI / RAG.
- no audit log write.
- no Field Service Report write.
- no appointment write.
- no publication state write.
- no customer identity write.
- no finalAppointmentId modification.

## Future Minimum Acceptance Checklist

Before future implementation begins, the task must include:

- exact task name.
- exact allowed file path.
- exact forbidden files.
- exact allowed commands.
- explicit allow or deny for unit tests.
- explicit continued ban or allowance for DB.
- explicit continued ban or allowance for migration.
- explicit continued ban or allowance for route / controller.
- explicit continued ban or allowance for provider sending.
- explicit continued ban or allowance for AI / RAG.
- no-write / no-side-effect acceptance criteria.
- sensitive output / safe-deny criteria.
- rollback / stop condition.
- PM acceptance criteria.

## Future Resolver Behavior Checklist

If later authorized, resolver behavior must require:

- organization scope.
- verified customer identity.
- Case linkage.
- publication allowed state.
- customer-visible policy.
- generic safe-deny on any failed requirement.
- no customer-visible raw denial reason.
- no raw phone / address / LINE id in output.
- LINE id treated only as scoped channel identity.
- `organization_id + line_channel_id + line_user_id` alone is not sufficient authorization.

## Future Implementation Stop Conditions

Future implementation must stop and report to PM if it appears to require:

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

Any future resolver work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Next Task Candidates

Candidates only; do not execute from Task587:

- Task588 - Customer Access Resolver Unit Test Authorization Review / No Runtime Change.
- Task589 - Customer Access Response Envelope Authorization Review / No Runtime Change.
- Task590 - Customer Access Resolver Pure Function Skeleton Explicit Authorization Packet / Exact Files Review / No Runtime Change.

Task587 does not start Task588.

## Non-goals

Task587 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task586 documents.

Task587 does not run:

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

Task587 remains aligned with `PROJECT_GUARDRAILS.md`:

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
