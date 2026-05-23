# Task 729 - Customer Access Mounted Route Test Contract Refresh / No Runtime Change

## Summary

Task 729 refreshed stale Customer Access test contracts after the route and server bootstrap architecture had already moved to:

- central route aggregation via `src/routes/index.js`
- middleware plus controller mounted route stack
- bounded module-local Customer Access DB adapter wiring for injected synthetic clients
- safe Customer Access env flag extraction through `getCustomerAccessSafeEnvFlags`

This task did not modify Customer Access runtime source. It only updated tests so they exercise the current safe path instead of older single-handler and no-env-helper assumptions.

## Updated Coverage

- Mounted route tests now invoke the full middleware + controller stack.
- Route registry and route module tests now capture multiple Express handlers.
- Server source boundary tests allow the safe env flag helper while still blocking direct DB adapter/repository/provider/AI wiring.
- Route import boundary tests allow the bounded Customer Access DB adapter used by injected synthetic `dbClient` test paths.
- Read-only repository source boundary now expects the DB read model mapper import only.

## Guardrails

- No backend runtime behavior change.
- No admin frontend change.
- No API behavior change.
- No migration or schema/index change.
- No shared DB access, no DB migration, no psql, no provider calls.
- No sensitive data, raw phone, raw LINE id, token, secret, or full payload output.
- Customer-visible data, organization scope, and safe-deny behavior remain unchanged.

## Verification

- `node --test tests/customerAccess/*.js` - PASS, 596 passed / 0 failed.
- `npm run check` - PASS.
- `git diff --check` - PASS.
