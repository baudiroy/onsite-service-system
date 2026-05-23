# Task 580 - Customer Access Resolver Minimal Runtime Skeleton Proposal

## Scope

Task580 is a docs-only proposal for what a future Customer Access Resolver minimal runtime skeleton could look like.

Task580 is not runtime implementation.

Task580 does not authorize:

- resolver runtime.
- API runtime.
- DB access.
- migration.
- provider sending.
- AI / RAG / vector DB.
- test code changes.
- `src/`, `admin/src/`, `tests/`, or `fixtures/` changes.

## Current Baseline Recap

The current customer access resolver branch has completed:

- Task574: implementation sequencing.
- Task575: resolver contract proposal.
- Task576: fixture marker extension.
- Task577: static decision matrix test, PASS 10/0.
- Task578: static baseline closure.
- Task579: runtime authorization packet.

Current state remains:

- resolver static baseline closed.
- resolver runtime not authorized.
- customer-facing API runtime not authorized.
- DB, migration, provider sending, and AI remain no-go.

## Proposed Future Minimal Skeleton Shape

If a future task explicitly authorizes a minimal runtime skeleton, the safest candidate should be a pure resolver function only.

Possible future candidate file names:

- `src/customerAccess/customerAccessResolver.js`
- `src/services/customerAccessResolver.js`

These are future candidates only. Task580 does not create either file.

The future skeleton should be:

- pure function only.
- no DB call.
- no repository.
- no route / controller.
- no provider.
- no request context side effect.
- no audit log write.
- no Field Service Report write.
- no appointment write.
- no publication state write.
- no finalAppointmentId modification.
- deterministic input to decision output.
- fail-closed by default.

The skeleton should not read live database state. Any needed context should be passed as already-authorized, already-filtered input by a separately reviewed caller.

## Proposed Future Function Boundary

A future function could conceptually be named:

```text
resolveCustomerAccess(input) -> decision
```

Task580 does not add this function.

Future input/output must follow the Task575 contract:

- organization scope required.
- verified customer identity required.
- Case linkage required.
- publication allowed required.
- customer-visible policy required.
- generic safe-deny for failure.
- no sensitive denial reason to customer.

Future output should be a decision, not a data projection implementation:

- `allow` decision permits entry into a separately reviewed customer-visible projection layer.
- `unavailable` decision returns a generic safe-deny envelope.
- internal diagnostic categories, if any, must not be customer-facing.

## Forbidden Runtime Behaviors

Any future resolver skeleton must not:

- create a formal Field Service Report.
- approve a formal Field Service Report.
- publish a formal Field Service Report.
- create a second formal Field Service Report.
- modify completion source-data.
- modify finalAppointmentId.
- treat LINE id as global identity.
- authorize access using raw phone, raw address, or raw LINE id alone.
- read or output internal note.
- read or output audit log.
- read or output AI raw payload.
- read or output internal billing / settlement data.
- query across organizations.
- auto-link customer identity.
- auto-open customer-facing publication.
- send LINE, SMS, Email, App push, or any provider notification.
- call AI / RAG / vector DB.

Customer-facing denial must remain generic and must not reveal Case existence, report existence, organization existence, customer matching failure, linkage failure, or publication state.

## Future Test Proposal

Future tests are proposals only. Task580 does not add tests.

Possible future test directions:

- pure unit test for an allow decision.
- safe-deny test for cross-organization input.
- safe-deny test for wrong customer.
- safe-deny test for unverified identity.
- safe-deny test for unlinked Case.
- safe-deny test for publication not allowed.
- safe-deny test for raw phone-only authorization attempt.
- safe-deny test for raw address-only authorization attempt.
- safe-deny test for raw LINE id-only authorization attempt.
- sensitive-value scan.
- no-write / no-side-effect expectation.

Future tests should validate deterministic input to decision output without DB, route, provider, AI, or network behavior unless a later task explicitly opens those scopes.

## Runtime Authorization Requirements Before Implementation

Before Task581 or any runtime task begins, a future task must explicitly provide:

- exact task name.
- exact files allowed.
- exact commands allowed.
- whether `src/` modification is allowed.
- whether `tests/` modification is allowed.
- whether fixtures modification is allowed.
- whether DB remains forbidden.
- whether migration remains forbidden.
- whether provider sending remains forbidden.
- whether AI / RAG remains forbidden.
- rollback / stop condition.
- PM acceptance criteria.

Default remains no runtime until explicitly opened.

## Next Task Candidates

Candidates only; do not execute from Task580:

- Task581 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB.
- Task582 - Customer Access Resolver Unit Test Plan / No Runtime Change.
- Task583 - Customer Access Response Envelope Proposal / No Runtime Change.

Task580 does not start Task581.

## Non-goals

Task580 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task579 documents.

Task580 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.

## Guardrails Review

Task580 remains aligned with `PROJECT_GUARDRAILS.md`:

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
