# Task 634 — Customer Access Bootstrap HTTP Behavior / Injected Synthetic DB Client / No Listen / No Shared DB

## Purpose

Task 634 verifies the Customer Access bootstrap wiring path using an injected synthetic DB client:

```text
createCustomerAccessEnabledApp({ dbClient })
-> createApp({ customerAccess })
-> createAppRouter({ customerAccess })
-> customer access route options
-> dbAdapter / queryExecutor / repository
-> customer access HTTP response
```

This is a behavior test only. It does not change production runtime code.

## Files Changed

- `tests/customerAccess/customerAccessAppBootstrapAdapter.http-behavior.unit.test.js`
- `docs/task-634-customer-access-bootstrap-http-behavior-injected-synthetic-db-client-no-listen-no-shared-db.md`

## Tested Wiring Path

The test creates an app with `createCustomerAccessEnabledApp({ dbClient })` and sends synthetic HTTP requests through the Express app handler without calling `app.listen`.

The synthetic DB client is verified to be:

- Not called during app creation.
- Reached during request execution when customer access context input is provided.
- Safe when it returns empty rows.
- Safe when it throws.

## Safety Expectations

Responses must not expose:

- Raw SQL.
- Raw query params.
- Raw DB rows.
- Tokens or secrets.
- Full phone or full address.
- Raw channel id.
- Internal note, audit log, or AI raw payload.
- `finalAppointmentId` from the DB-query path.

Failure and not-found cases remain generic safe-deny responses.

## Boundaries

Task 634 does not:

- Modify production `src/`.
- Start a server with `app.listen`.
- Connect to a shared DB.
- Read `DATABASE_URL`.
- Execute SQL against a real database.
- Add or apply migrations.
- Modify schema.
- Run smoke, browser, or external API tests.
- Trigger provider sending, LINE, SMS, email, app push, survey, AI, RAG, or vector DB behavior.

## Verification Commands

Expected commands:

```bash
node --check tests/customerAccess/customerAccessAppBootstrapAdapter.http-behavior.unit.test.js
node --test tests/customerAccess/customerAccessAppBootstrapAdapter.http-behavior.unit.test.js
git diff --check -- tests/customerAccess/customerAccessAppBootstrapAdapter.http-behavior.unit.test.js docs/task-634-customer-access-bootstrap-http-behavior-injected-synthetic-db-client-no-listen-no-shared-db.md
npm run check
npm run admin:check
```

## Guardrails

This task preserves:

- One Case = one formal Field Service Report.
- Customer-facing report = filtered publication view.
- LINE user id is not a global identity.
- Organization isolation.
- Data Access Control.
- No internal data leakage.
- No sensitive output.
- No migration or schema change.
