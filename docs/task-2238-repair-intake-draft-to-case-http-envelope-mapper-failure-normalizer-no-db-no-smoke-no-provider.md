# Task2238 - Repair Intake Draft-to-Case HTTP Envelope Mapper Failure Normalizer

Status: implemented

Scope:
- Hardened the existing Repair Intake draft-to-case HTTP result mapper boundary.
- Added focused unit coverage for malformed input, unsafe success-shaped route-facing results, unsafe scalar normalization, sanitized denied/unavailable paths, success-path preservation, and mutation safety.
- Kept the change inside `src/repairIntake/`, `tests/repairIntake/`, and this task doc.

Runtime behavior:
- Malformed/null/non-object route-facing results fail closed to the existing sanitized HTTP unavailable envelope with `REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_RESULT_MAPPER_INVALID_RESULT`.
- Unsafe success-shaped route-facing results with unsafe or missing core `messageKey` / `reasonCode` no longer produce a 201 HTTP envelope; they fail closed to the sanitized unavailable envelope.
- HTTP mapper unsafe scalar detection now explicitly covers `postgres://`, `postgresql://`, `process.env`, `database_url`, `openai`, and `vector` markers in addition to the existing private/system markers.
- Unsafe public scalar IDs continue to normalize to `null` according to the existing public envelope contract.
- Existing allowed success output remains unchanged.
- Existing sanitized denied, unavailable, failed, invalid, and skipped/not-created paths remain unchanged.
- Input objects are not mutated and returned bodies remain detached from input objects.

Final HTTP envelope mapper behavior:
- HTTP response bodies remain limited to `ok`, `status`, `messageKey`, `reasonCode`, `caseId`, and `repairIntakeDraftId`.
- Raw/private/system fields are never copied into the HTTP body.
- Unsafe SQL, DB URL, env, secrets, token/password, provider, AI/RAG, billing/settlement/invoice, audit/internal/debug, stack/raw error, customer private/contact/address markers are dropped or normalized.
- Route-facing malformed or unsafe success-shaped results fail closed instead of producing unsafe 201 responses.

Verification:
- `node --test tests/repairIntake/repairIntakeDraftToCaseHttpEnvelopeMapperFailureNormalizer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseHttpResultMapper.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseHttpResultMapperBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePublicSuccessEnvelopeFinalAllowlist.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterHandlerFailureNormalizer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePublicSuccessEnvelopeFinalAllowlist.static.test.js`
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
