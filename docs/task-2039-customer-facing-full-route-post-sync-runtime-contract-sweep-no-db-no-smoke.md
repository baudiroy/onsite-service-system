# Task2039 Customer-facing Full Route Post-sync Runtime Contract Sweep / No DB No Smoke

## Baseline

- Starting local HEAD: `c5335cf18af26d26d38988696b9193c8433b5900`
- Starting `origin/main`: `c5335cf18af26d26d38988696b9193c8433b5900`
- Task2038D was already accepted and synced before this sweep.

## Scope

This task verified the accepted customer-facing full route access-gate contract after GitHub sync.

The sweep was no-DB and no-smoke:

- No database connection.
- No SQL execution.
- No migration.
- No seed.
- No public endpoint probe.
- No `/healthz` probe.
- No Zeabur access, deploy, restart, rollback, or environment inspection.
- No provider, billing, or AI execution.

## Contract Confirmed

The synced customer-facing full route contract now confirms:

- `src/customerAccess/customerAccessReadOnlyDbConnector.js` supports legacy `query(sql, params)`.
- The same connector supports explicit read-only query config objects with `text`, `values`, and `readOnly: true`.
- Query config objects that are not explicitly read-only are rejected.
- The full mounted service-report route and the direct projection handler return the same sanitized DTO for the accepted all-allow synthetic context.
- The service-report route still fails closed before projection when an allow-shaped context is missing customer scope.
- Forbidden/internal fields remain absent from the customer-visible response.

## Gap Found

No runtime source gap was found.

The all-customerAccess test sweep found stale static tests from earlier branch-closure phases. Those tests still encoded historical no-route/no-runtime assumptions or historical full local status snapshot assumptions. Those assumptions are no longer valid after the accepted customer-facing runtime route work.

## Test Maintenance Performed

Only `tests/customerAccess/**` files were changed.

The test updates:

- Allow committed historical checkpoint files to have no `git status` rows.
- Avoid requiring historical status docs to match a partial active maintenance change set.
- Update old no-route assertions so accepted production route wiring is allowed only through `src/routes/customerAccessRoutes.js`.
- Continue forbidding the old projection app adapter branch from being mounted as the production route.
- Keep server direct-run assertions tied to the `require.main === module` guarded block instead of requiring a bare `startServer()` call.

## Verification

The PM-requested command:

```bash
node --test tests/customerAccess
```

Result:

- Failed before test execution because this Node runtime treats `tests/customerAccess` as a module path, not a test directory.
- Error class: `MODULE_NOT_FOUND`.

Equivalent full customerAccess test sweep:

```bash
find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test
```

Result:

- `762` tests passed.
- `0` failed.

Additional checks:

- `git diff --check`
- `npm run check`

## Explicit Non-actions

- No runtime source files changed.
- No DB / SQL / migration / seed.
- No smoke or endpoint probe.
- No Zeabur access or deployment action.
- No Zeabur env values inspected or modified.
- No provider, billing, AI, or RAG execution.
- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior creation or mutation.
- No secrets printed.
- The 7 held historical docs were not touched.

## Recommendation

Submit this Task2039 test-maintenance and traceability result to PM for review. Do not push until PM accepts Task2039.
