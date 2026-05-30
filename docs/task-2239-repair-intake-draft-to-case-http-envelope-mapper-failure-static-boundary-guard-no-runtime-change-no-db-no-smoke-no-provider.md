# Task2239 - Repair Intake Draft-to-Case HTTP Envelope Mapper Failure Static Boundary Guard

Status: implemented

Scope:
- Added a focused static guard for the Task2238 HTTP envelope mapper failure normalization boundary.
- The guard reads source, test, and doc files as text only.
- No runtime/source behavior was changed.

Static boundary coverage:
- Confirms HTTP mapper public envelope fields remain exactly `ok`, `status`, `messageKey`, `reasonCode`, `caseId`, and `repairIntakeDraftId`.
- Confirms malformed/null/non-object mapper inputs fail closed through `REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_RESULT_MAPPER_INVALID_RESULT`.
- Confirms unsafe success-shaped `ok:true` / 201 results with missing or unsafe `messageKey` / `reasonCode` fail closed.
- Confirms unsafe scalar markers include `postgres://`, `postgresql://`, `process.env`, `database_url`, `openai`, and `vector`.
- Confirms unsafe `caseId` / `repairIntakeDraftId` values are stripped to `null` through `safePublicString()`.
- Confirms allowed success output remains explicitly shaped and does not spread raw route-facing result wholesale.
- Confirms existing denied/unavailable/failed/invalid/skipped envelopes remain covered by mapper tests and docs.
- Confirms Task2238 tests/docs and existing mapper static/unit guards record failure, leakage, success-path, and scope evidence.

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
- `node --test tests/repairIntake/repairIntakeDraftToCaseHttpEnvelopeMapperFailureBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseHttpEnvelopeMapperFailureNormalizer.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseHttpResultMapper.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseHttpResultMapperBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePublicSuccessEnvelopeFinalAllowlist.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
