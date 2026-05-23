# Task 581 - Customer Access Resolver Pure Function Skeleton Readiness Gate

## Scope

Task581 is a docs-only readiness gate for a possible future Customer Access Resolver pure function skeleton.

Task581 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no API.
- no DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.
- no test code changes.

Task581 does not authorize implementation.

## Current Baseline Recap

The current resolver branch has completed:

- Task574: implementation sequencing completed.
- Task575: resolver contract proposal completed.
- Task576: fixture marker extension completed.
- Task577: static decision matrix test completed, PASS 10/0.
- Task578: static baseline closure completed.
- Task579: runtime authorization packet completed.
- Task580: minimal runtime skeleton proposal completed.

Current state remains:

- runtime not authorized.
- API runtime not authorized.
- DB, migration, provider sending, and AI remain no-go.

## Readiness Gate Conclusion

PURE FUNCTION SKELETON IS NOT YET AUTHORIZED BY TASK581.

Task581 only establishes this readiness gate.

Task581 does not:

- create `resolveCustomerAccess`.
- create `src/customerAccess/customerAccessResolver.js`.
- create `src/services/customerAccessResolver.js`.
- create unit tests.
- change runtime behavior.
- add a resolver module.
- add an API endpoint.
- access DB.
- send notifications.
- call AI/RAG.

## Required Explicit Authorization for Future Runtime Task

If a future task starts the pure function skeleton, PM must issue a separate exact task such as:

```text
Task582 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB
```

That future task must explicitly list:

- whether `src/` modification is allowed.
- exact allowed file path.
- exact forbidden files.
- exact allowed commands.
- whether unit tests may be added.
- whether DB remains forbidden.
- whether migration remains forbidden.
- whether route / controller remains forbidden.
- whether provider sending remains forbidden.
- whether AI / RAG remains forbidden.
- acceptance criteria.
- rollback / stop condition.

Without those details, runtime remains blocked.

## Proposed Future Exact-file Candidate

Most conservative future candidate:

```text
src/customerAccess/customerAccessResolver.js
```

Task581 does not create this file.

If this candidate is later authorized, it should be:

- pure function only.
- no DB.
- no repository.
- no route / controller.
- no provider.
- no side effect.
- deterministic input to decision output.
- fail-closed by default.

## Future Acceptance Criteria Draft

If a future runtime skeleton is authorized, it should at minimum:

- export only a pure resolver function.
- not import repository, DB, provider, controller, or route modules.
- not write audit log.
- not write Field Service Report data.
- not write appointment data.
- not write publication state.
- not write customer identity linkage.
- not modify finalAppointmentId.
- return generic safe-deny on missing or invalid required inputs.
- not leak raw denial reason to customer.
- treat LINE id as scoped channel identity only, never global identity.
- require organization scope.
- require verified customer identity.
- require Case linkage.
- require publication allowed state.
- require customer-visible policy.
- avoid sensitive customer PII in output.

## Mandatory Invariants

Any future work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` alone is not sufficient authorization.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Explicit No-go Boundaries

The following remain forbidden:

- No resolver runtime.
- No customer-facing API runtime.
- No route / controller / DTO / projection / repository / service.
- No DB / SQL / DDL / psql.
- No migration draft / dry-run / apply.
- No provider sending / LINE / SMS / Email / App push.
- No survey runtime.
- No billing / settlement runtime.
- No AI / RAG / vector DB.
- No package.json change.
- No smoke / browser / API / full test suite.

## Next Task Candidates

Candidates only; do not execute from Task581:

- Task582 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB.
- Task583 - Customer Access Resolver Unit Test Plan / No Runtime Change.
- Task584 - Customer Access Response Envelope Proposal / No Runtime Change.

Task581 does not start Task582.

## Non-goals

Task581 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task580 documents.

Task581 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.

## Guardrails Review

Task581 remains aligned with `PROJECT_GUARDRAILS.md`:

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
