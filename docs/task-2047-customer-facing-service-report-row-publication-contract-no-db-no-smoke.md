# Task2047 Customer-facing Service Report Row Publication Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `8e94dfca85da202446c7886808329300cacf7317`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report row-level publication and customer-visible policy guard only.

## Findings

Task2046 required explicit customer-visible/public signals before any attachment can appear in the successful customer-facing service report DTO.

Task2047 applies the same fail-closed principle to the service report projection row itself. Before this task, a matched projection row without row-level publication fields could still pass when the request context was otherwise authorized. That made fixture or projection-view drift harder to detect and could treat missing publication metadata as safe.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now requires the matched service report projection row to include:

- an explicit row-level publication allow signal, such as `publication_allowed: true` or published/customer-visible publication state; and
- an explicit row-level customer-visible policy pass signal, `customer_visible_policy_passed: true` or `customerVisiblePolicyPassed: true`.

Rows with missing publication metadata, missing customer-visible policy pass metadata, unpublished/draft/internal/revoked state, mismatched publication case/report reference, or explicit deny flags now return the generic safe-deny envelope.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service rows missing publication fields.
- Direct projection service rows missing explicit customer-visible policy pass.
- Direct projection service rows with customer-visible policy pass but no publication allow signal.
- Direct handler rows missing row-level publication fields.
- Full mounted customer-facing service report route rows missing row-level publication fields.
- Existing synthetic app adapter/internal route fixtures updated to include explicit row publication metadata.

## Behavior preserved

- Existing successful customer-facing service report DTO allowlist remains unchanged.
- Existing attachment visibility filtering remains unchanged.
- Existing safe-deny / not-found / projection failure envelopes remain unchanged.
- Existing response header / content-type behavior remains unchanged.
- Existing parameter guard and customer access context behavior remain unchanged.
- Existing full mounted route and direct projection handler DTO equivalence remains unchanged.

## Explicit non-actions

- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No endpoint probe or public/shared/prod target access.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, AI, storage provider, or RAG execution.
- No file upload, file download, or signed URL generation.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication workflow mutation outside row-level projection filtering.
- No route expansion or global app/server mount change.

## Verification

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js`
  - Result: PASS, 82/82 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 782/782 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, pools, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.
