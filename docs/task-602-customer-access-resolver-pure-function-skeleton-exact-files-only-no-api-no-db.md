# Task 602 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB

## Scope

Task602 creates the first Customer Access Resolver pure function skeleton.

Task602 is a minimal runtime skeleton task, but its runtime scope is strictly limited to a single pure function file and this documentation note.

Allowed files:

- `src/customerAccess/customerAccessResolver.js`
- `docs/task-602-customer-access-resolver-pure-function-skeleton-exact-files-only-no-api-no-db.md`

Task602 does not modify any other file.

## Runtime Boundary

Task602 does not implement:

- API route.
- controller.
- DTO.
- projection service.
- repository.
- DB query.
- migration.
- provider sending.
- LINE / SMS / Email / App push.
- AI / RAG / vector DB.
- audit log write.
- file storage access.
- Field Service Report write.
- appointment write.
- publication state write.
- customer identity write.
- `finalAppointmentId` modification.

## Resolver Skeleton

Task602 adds:

```text
resolveCustomerAccess(input) -> decision
```

The skeleton is:

- CommonJS export.
- pure function only.
- deterministic input to decision output.
- side-effect free.
- fail-closed by default.
- no imports.
- no DB.
- no repository.
- no route / controller / DTO / projection.
- no provider.
- no AI / RAG.
- no audit log write.
- no formal data mutation.

## Minimum Decision Behavior

The resolver denies when:

- input is missing.
- organization scope is missing or invalid.
- customer identity is unverified.
- Case linkage is missing.
- publication is not allowed.
- customer-visible policy fails.
- access relies on raw phone only.
- access relies on raw address only.
- access relies on LINE id alone.
- access relies on `organization_id + line_channel_id + line_user_id` alone.

The resolver allows only when the caller supplies all of the following preloaded and sanitized summaries:

- valid organization scope.
- verified customer identity.
- linked Case.
- publication allowed.
- customer-visible policy passed.

## Decision Shape

Denied decisions use a generic safe customer-facing message key:

```js
{
  allowed: false,
  status: 'deny',
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  internalReasonCode: 'MISSING_ORGANIZATION_SCOPE'
}
```

Allowed decisions use a minimal allow marker:

```js
{
  allowed: true,
  status: 'allow',
  messageKey: 'customerAccess.allowed',
  customerVisible: true
}
```

`internalReasonCode` is server-side metadata only. Customer-facing responses must remain generic and must not expose the internal reason.

## Safe Output Policy

The resolver output must not contain:

- raw phone.
- raw address.
- raw LINE user id.
- internal note.
- audit log.
- AI raw payload.
- internal billing data.
- internal settlement data.
- full Field Service Report payload.
- full appointment payload.
- full customer payload.

## Mandatory Invariants

Task602 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, complete, reopen, or publish a Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Verification

Allowed commands for Task602:

```bash
node --check src/customerAccess/customerAccessResolver.js
git diff --check -- src/customerAccess/customerAccessResolver.js docs/task-602-customer-access-resolver-pure-function-skeleton-exact-files-only-no-api-no-db.md
```

No tests, smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task602.

## Guardrails Review

Task602 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
