# Task2236 - Repair Intake Draft-to-Case Route Adapter / Handler Failure Static Boundary Guard

Status: implemented

Scope:
- Added a focused static guard for the Task2235 route adapter / route handler failure normalization boundary.
- The guard reads source, test, and doc files as text only.
- No runtime/source behavior was changed.

Static boundary coverage:
- Confirms the route adapter keeps explicit input/output sanitization through `routeLikeToPreRouteInput()`, `sanitizeNestedValue()`, `safeScalar()`, and `sanitizeRouteOutput()`.
- Confirms the route handler keeps explicit input/output sanitization through `routeLikeInputFromFutureRouterInput()`, `sanitizeNestedValue()`, `safeScalar()`, and `sanitizeRouteOutput()`.
- Confirms thrown/rejected pre-route handler failures map to `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_FAILED`.
- Confirms thrown/rejected route adapter failures map to `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_FAILED`.
- Confirms malformed/non-object pre-route handler output maps to `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_OUTPUT_INVALID`.
- Confirms malformed/non-object route adapter output maps to `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_OUTPUT_INVALID`.
- Confirms unsafe string markers are filtered in both route adapter and route handler sanitizers.
- Confirms forbidden/raw/private/system request and output fields remain denied.
- Confirms route-facing output does not return or spread raw delegate output wholesale.
- Confirms route path and route mount behavior are not changed by the guarded boundary.
- Confirms Task2235 tests and docs record failure, leakage, success-path, immutability, and scope evidence.

Boundaries:
- No DB commands, SQL execution, SQL runtime construction, transactions, migrations, migration dry-runs/applies, `DATABASE_URL`, Zeabur, or env inspection.
- No repository implementation behavior changes.
- No audit persistence behavior changes.
- No route path or route mount changes.
- No public/open/customer route expansion.
- No smoke tests, endpoint probes, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz`.
- No provider sending, auth/session middleware, rate limiting, payload-size/body-parser, permission model, role expansion, organization isolation, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, Customer Access, Engineer Mobile, or package dependency changes.
- The 7 held historical untracked docs were not touched.

Verification:
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterHandlerFailureBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterHandlerFailureNormalizer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterFullCompositionIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFullCompositionIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
