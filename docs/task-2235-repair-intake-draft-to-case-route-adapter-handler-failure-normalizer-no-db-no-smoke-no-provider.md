# Task2235 - Repair Intake Draft-to-Case Route Adapter / Handler Failure Normalizer

Status: implemented

Scope:
- Hardened the existing Repair Intake draft-to-case route adapter / route handler boundary.
- Added focused unit coverage for thrown, rejected, malformed, unsafe request, unsafe output, success-path, and mutation-safety behavior.
- Kept the change inside `src/repairIntake/`, `tests/repairIntake/`, and this task doc.

Runtime behavior:
- Route adapter pre-route handler thrown/rejected failures continue to return a sanitized 503 unavailable envelope with `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_FAILED`.
- Route handler adapter thrown/rejected failures continue to return a sanitized 503 unavailable envelope with `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_FAILED`.
- Route adapter now fails closed when the pre-route handler returns `null`, an array, a string, a number, or another non-object output, using `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_OUTPUT_INVALID`.
- Route handler now fails closed when the route adapter returns `null`, an array, a string, a number, or another non-object output, using `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_OUTPUT_INVALID`.
- Route adapter and route handler sanitizers now drop unsafe string markers as well as unsafe field names.
- Safe scalar extraction now rejects unsafe string markers before using source, request id, idempotency, draft id, or header-derived scalar values.
- Existing allowed success output remains unchanged.
- Input objects and delegate output objects are not mutated.

Final route boundary behavior:
- Unsafe request input is sanitized before pre-route handler / route adapter invocation where each boundary owns that route-shaped input.
- Unsafe handler output fields and unsafe strings are stripped before route-facing output.
- Raw exception messages, stack traces, SQL, DB URLs, env markers, secrets, tokens, passwords, provider payloads, raw request/body/draftInput, customer contact/address/private fields, audit internals, debug/internal/raw error data, AI/RAG markers, and billing/settlement/invoice markers are not exposed.
- Raw handler, adapter, controller, API, request, body, or draftInput output is not passed through wholesale.

Verification:
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterHandlerFailureNormalizer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterFullCompositionIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFullCompositionIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleSafeControllerFailureNormalizer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`

Boundaries:
- No DB commands, SQL execution, SQL runtime construction, transactions, migrations, migration dry-runs/applies, `DATABASE_URL`, Zeabur, or env inspection.
- No repository implementation behavior changes.
- No audit persistence behavior changes.
- No route path or route mount changes.
- No public/open/customer route expansion.
- No smoke tests, endpoint probes, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz`.
- No provider sending, auth/session middleware, rate limiting, payload-size/body-parser, permission model, role expansion, organization isolation, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, Customer Access, Engineer Mobile, or package dependency changes.
- The 7 held historical untracked docs were not touched.
