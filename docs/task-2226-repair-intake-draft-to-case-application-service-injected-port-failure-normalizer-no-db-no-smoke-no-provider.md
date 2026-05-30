# Task2226 Repair Intake Draft-to-Case Application Service Injected Port Failure Normalizer

## Scope

- Hardens the existing Repair Intake draft-to-case application service injected-port boundary.
- Adds focused unit coverage for thrown, rejected, malformed, and non-object injected port outputs.
- Keeps the change inside `src/repairIntake/repairIntakeDraftToCaseApplicationService.js` and `tests/repairIntake/`.
- Does not add DB execution, repository implementation behavior, migrations, smoke probes, providers, route exposure, public/open routes, auth/session changes, rate limiting, payload-size middleware, package changes, or environment inspection.

## Boundary Changed

- `planDraftToCase()` now fails closed when `casePlanner.planCaseFromDraft()` returns a non-object output after sanitization.
- `submitDraftToCase()` now fails closed when `casePlanner.planCaseFromDraft()`, `caseCreator.createCaseFromDraft()`, or `auditWriter.recordDraftToCaseDecision()` returns a non-object output after sanitization.
- The existing catch paths still convert thrown/rejected injected-port failures into generic sanitized failure envelopes.
- The sanitizer denylist now removes additional private/system fields such as provider payload, audit internals, debug/internal, billing/settlement/invoice, password, and related unsafe markers from application service payloads/results.

## Final Behavior

- Draft reader thrown/rejected failures return sanitized plan/submit failure envelopes.
- Draft reader malformed/null output fails closed through the existing draft-read failure envelope.
- Case planner, case creator, and audit writer thrown/rejected/malformed outputs fail closed with generic application service failure reason codes.
- Idempotency port thrown/rejected failures fail closed with the existing idempotency failure reason code.
- Raw exception messages, stack traces, SQL, DB URLs, env markers, secrets, tokens, passwords, provider payloads, raw draft data, customer private fields, audit internals, debug/internal fields, AI/RAG, billing/settlement/invoice, and unsafe raw output fields are not exposed.
- Existing successful submit behavior remains unchanged except for stronger sanitization of unsafe private/system fields.
- Input objects and injected port result objects are not mutated.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceInjectedPortFailureNormalizer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleApplicationServiceAdapter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseControllerAdapter.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`

## Runtime Authorization Boundary

Task2226 does not authorize Task2227, DB commands, SQL execution, SQL runtime construction, transaction implementation, migrations, migration dry-runs/applies, DATABASE_URL/Zeabur/env/secrets inspection, concrete repository implementation behavior, audit persistence, route changes, public/open/customer route mounting, smoke probes, endpoint traffic, server/listener startup, shared runtime, deploys, staging/prod traffic, provider sending, auth/session middleware, rate limiting, payload-size/body-parser middleware, permission model changes, role expansion, organization isolation source changes, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, Customer Access, Engineer Mobile, package dependency changes, or any future task.
