# Task2065 — Customer-Facing Projection customerAccessContext Strict Primitive Guard / No DB No Route No Smoke

## Scope

- Added a projection service boundary guard for the Task2064 `customerAccessContext` DTO.
- Accepted `customerAccessContext` keys are only:
  - `organizationId`
  - `customerId`
  - `caseId`
  - `organizationScopeMatched`
  - `customerIdentityVerified`
  - `caseLinkedToCustomer`
  - `publicationAllowed`
  - `customerVisiblePolicyPassed`
- ID fields must be safe nonempty strings.
- Policy fields must be actual boolean `true` values.

## Safe-Deny Behavior

- Missing, malformed, nested, non-plain, unknown-key, unsafe ID, or non-boolean policy contexts fail closed before query.
- Failed context validation returns the existing sanitized unavailable envelope:
  - `status: deny`
  - `messageKey: customerAccess.unavailable`
  - `customerVisible: false`
  - `data: null`
  - `error.messageKey: customerAccess.unavailable`
- The response does not expose which context key failed.

## Boundaries

- No DB changes.
- No migrations, SQL, seeds, schema, indexes, psql, db, migration dry-run, or migration apply.
- No repository query changes.
- No route/controller/global mount changes.
- No Zeabur/env/runtime smoke.
- No provider sending.
- No admin frontend.
- No AI/RAG/provider/model calls.
- No billing/settlement/payment/invoice work.
- No package or package-lock changes.
- The 7 held historical untracked docs were not touched.
