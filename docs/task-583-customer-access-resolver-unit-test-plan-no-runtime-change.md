# Task 583 - Customer Access Resolver Unit Test Plan

## Scope

Task583 is a docs-only unit test plan for a possible future Customer Access Resolver pure function skeleton.

Task583 is:

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

Task583 does not implement tests.

## Current Baseline Recap

The current branch has completed:

- Task574: implementation sequencing completed.
- Task575: resolver contract proposal completed.
- Task576: fixture marker extension completed.
- Task577: static decision matrix test completed, PASS 10/0.
- Task578: static baseline closure completed.
- Task579: runtime authorization packet completed.
- Task580: minimal runtime skeleton proposal completed.
- Task581: pure function skeleton readiness gate completed.
- Task582: exact implementation packet completed.

Current state:

- pure function skeleton not authorized.
- unit test implementation not authorized.
- resolver runtime remains no-go.
- API, DB, migration, provider sending, and AI remain no-go.

## Future Test File Candidate

Future candidate only:

```text
tests/customerAccess/customerAccessResolver.unit.test.js
```

Task583 does not create this file.

Task583 does not modify existing tests.

Task583 does not modify fixtures.

Future test file creation requires separate explicit authorization.

## Future Test Subject Candidate

Future candidate only:

```text
src/customerAccess/customerAccessResolver.js
```

Task583 does not create or modify this file.

The test plan assumes a future resolver is:

- pure function only.
- deterministic.
- side-effect free.
- fail-closed by default.
- independent of DB, repository, route, controller, provider, AI, and audit writer.

## Minimum Future Test Matrix

Future unit tests should cover at least:

- allow: organization scope valid, verified customer identity, linked Case, publication allowed, and customer-visible policy pass.
- deny: missing organization scope.
- deny: cross-organization Case.
- deny: wrong customer.
- deny: unverified customer identity.
- deny: unlinked Case.
- deny: publication not allowed.
- deny: customer-visible policy failure.
- deny: raw phone only is insufficient.
- deny: raw address only is insufficient.
- deny: LINE id alone is insufficient.
- deny: `organization_id + line_channel_id + line_user_id` alone is insufficient.
- deny: missing Case id.
- deny: malformed input.
- deny: unknown / unsupported access reason.
- sensitive output scan: no raw phone / address / LINE id / internal note / audit log / AI raw payload / billing internal data.
- side-effect expectation: resolver does not write Field Service Report / appointment / publication / customer identity / audit log.
- invariant expectation: resolver never modifies finalAppointmentId.

## Expected Future Assertion Style

Future assertions should verify:

- decisions are deterministic.
- deny uses generic safe-deny customer-facing output.
- internal reason code, if present, is server-side metadata only.
- customer-visible denial message does not reveal whether Case exists.
- customer-visible denial message does not reveal whether customer exists.
- customer-visible denial message does not reveal organization mismatch.
- customer-visible denial message does not reveal identity mismatch.
- output does not include raw customer PII.
- test naming separates allow, safe-deny, sensitive-output, and no-side-effect cases.

## Future Allowed Commands Draft

If a future test implementation is separately authorized, suggested commands:

```bash
node --test tests/customerAccess/customerAccessResolver.unit.test.js
git diff --check -- tests/customerAccess/customerAccessResolver.unit.test.js
```

Task583 must not run the `node --test` command above because the test file does not exist and Task583 does not create it.

Task583 may only run:

```bash
git diff --check -- docs/task-583-customer-access-resolver-unit-test-plan-no-runtime-change.md
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

## Mandatory Invariants

Any future resolver test work must preserve:

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

Candidates only; do not execute from Task583:

- Task584 - Customer Access Resolver Unit Test Exact Implementation Packet / No Runtime Change.
- Task585 - Customer Access Response Envelope Proposal / No Runtime Change.
- Task586 - Customer Access Resolver Pure Function Skeleton Authorization Review / No Runtime Change.

Task583 does not start Task584.

## Non-goals

Task583 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task582 documents.

Task583 does not run:

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

Task583 remains aligned with `PROJECT_GUARDRAILS.md`:

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
