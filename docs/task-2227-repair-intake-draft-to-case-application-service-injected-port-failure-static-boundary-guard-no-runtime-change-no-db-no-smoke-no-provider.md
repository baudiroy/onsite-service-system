# Task2227 Repair Intake Draft-to-Case Application Service Injected Port Failure Static Boundary Guard

## Scope

- Adds a no-runtime-change static boundary guard for the Task2226 application service injected-port failure normalizer.
- Reads source, test, and doc files only.
- Does not change runtime/source behavior.
- Does not authorize Task2228 or any future task.

## Guarded Boundary

- Application service calls injected ports only and does not import concrete DB, repository, provider, smoke, route exposure, or runtime implementations.
- `planDraftToCase()` and `submitDraftToCase()` keep catch/failure paths for injected-port failures.
- Case planner, case creator, and audit writer malformed/non-object outputs fail closed before success envelope construction.
- Draft reader malformed/null output remains routed to the existing sanitized draft-read failure behavior.
- Idempotency thrown/rejected failure remains routed to the sanitized idempotency failure behavior.
- The sanitizer denylist includes provider payload, audit internals, debug/internal, billing/settlement/invoice, password, rag, raw/error/stack/SQL-like markers, tokens, secrets, customer contact/address/private fields, and DB/env markers.
- Success envelopes remain explicitly shaped and do not spread raw port output wholesale.

## Static Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseApplicationServiceInjectedPortFailureBoundary.static.test.js` freezes the Task2226 source markers and test/doc evidence.
- The guard checks source text for injected-port calls, catch/failure behavior, malformed-output checks, sanitizer denylist markers, and explicit success envelope shaping.
- The guard checks Task2226 tests for coverage of thrown/rejected/malformed failures, unsafe leakage denial, success preservation, and mutation safety.
- The guard checks Task2226 docs for the recorded authorization boundary.
- The guard imports only Node core source-reading modules and does not import or execute runtime, DB, repository, provider, migration, env, Zeabur, smoke, server, endpoint, or route code.

## Runtime Authorization Boundary

Task2227 does not authorize Task2228, runtime/source behavior changes, DB commands, SQL execution, SQL runtime construction, transaction implementation, migrations, migration dry-runs/applies, DATABASE_URL/Zeabur/env/secrets inspection, concrete repository implementation behavior, audit persistence, route changes, public/open/customer route mounting, smoke probes, endpoint traffic, server/listener startup, shared runtime, deploys, staging/prod traffic, provider sending, auth/session middleware, rate limiting, payload-size/body-parser middleware, permission model changes, role expansion, organization isolation source changes, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, Customer Access, Engineer Mobile, package dependency changes, or any future task.
