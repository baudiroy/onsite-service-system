# Task2188 - Repair Intake Public/Open Intake Request DTO Allowlist Guard

## Status

- Added a focused Repair Intake public/open intake request DTO allowlist boundary guard.
- This task is tests-plus-doc only.
- No source/runtime behavior changed.
- No DB, SQL, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, env inspection, smoke, endpoint probe, server/listener startup, shared runtime, `/healthz`, staging/production traffic, provider sending, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, Customer Access, Engineer Mobile, or package dependency work was performed.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Repo: `/Users/global/Documents/Codex/onsite service system/codex-ready-ai-field-service-docs`
- Branch: `main`
- Starting HEAD/origin/main: `fcbc2a000146bf4c8de52de1d456316f3021dd56`
- Local `main` equaled `origin/main`.
- Tracked tree was clean before Task2188 work.
- Only the same 7 held historical docs were untracked and untouched.
- Task2187 was accepted, pushed, and synced.

## Inspected Surface

Task2188 inspected the current Repair Intake-only surface requested by PM:

- `src/repairIntake/`
- `src/routes/repairIntakeDraftToCase.routes.js`
- existing `tests/repairIntake/`

Focused files used by the new guard:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js`
- `src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js`
- `src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js`
- `src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js`
- `src/routes/repairIntakeDraftToCase.routes.js`

Current absence preserved:

- `src/openRepairIntake/` is not present.
- `tests/openRepairIntake/` is not present.
- No Repair Intake controller exists under `src/controllers/`.

## Added Guard

Added:

- `tests/repairIntake/repairIntakePublicOpenRequestDtoAllowlistBoundary.static.test.js`

Guard coverage:

- Confirms Task2188 targets only current Repair Intake surface and remains compatible with absent Open Repair Intake directories.
- Confirms request shaping files keep explicit sanitizer and override-deny markers.
- Confirms public/open request shaping files do not spread raw request bodies or raw inputs directly into downstream payloads.
- Confirms client-controlled system fields remain denylisted or output-blocked before public/open DTO expansion.
- Confirms public result presenter remains a small explicit allowlist.
- Confirms presenter does not expose raw identity/contact/private/provider/debug/SQL/token fields.
- Confirms current Repair Intake route file does not add public/open route expansion and does not import app/server/providers/DB package.

## Behavior Change

- No source/runtime behavior changed.
- No route behavior changed.
- No public/open runtime behavior was added.
- No new route was mounted.
- No helper source was added because existing sanitization boundaries were sufficient for a static allowlist guard.

## Recommended Next Bounded Runtime Task

Recommended next exact task:

- Repair Intake draft intake HTTP boundary safe-deny guard.

Reason:

- Task2188 now locks public/open request DTO allowlist expectations.
- The next safe step is to add a narrow HTTP-boundary safe-deny guard around draft intake/open intake behavior without DB, migration, smoke, provider sending, or route expansion.

Alternative next bounded task:

- Repair Intake route registration injected-only composition adapter.

## Verification

Commands:

```sh
node --test tests/repairIntake/repairIntakePublicOpenRequestDtoAllowlistBoundary.static.test.js
git diff --check
git status --short --branch
```

Results:

- `node --test tests/repairIntake/repairIntakePublicOpenRequestDtoAllowlistBoundary.static.test.js`: PASS, 6/6 tests.
- `git diff --check`: PASS.
- `git status --short --branch`: `main...origin/main` with this Task2188 doc, the new Task2188 static guard, and the same 7 held historical docs untracked before commit.
