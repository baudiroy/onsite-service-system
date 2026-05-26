# Task1622 Repair Intake Fake-Client Runtime File-Touch Planning

Status: docs-only planning, no runtime, no DB.

## PM Direction

Task1622 acceptance target:

- Exactly one new docs-only fake-client runtime file-touch planning doc.
- Leave the new file unstaged.
- No source, test, runtime, admin, migration, package, smoke, provider, AI, billing, or DB edits.

## Current Baseline

- Latest completed commit before this planning doc: `19f17c1 Document repair intake next runtime decision`.
- Candidate selected by PM: fake-client runtime planning path.
- Tracked source and test tree should remain unchanged in this task.
- The 7 held historical docs remain untracked and should remain untouched unless PM assigns a separate cleanup or staging task.

## Intended Next Bounded Runtime Slice

The next bounded task may add one no-DB fake-client runtime harness that proves the Repair Intake draft-to-Case injected route composition can be exercised through explicit fake clients only.

This is not a production route rollout.

The next slice should remain:

- opt-in;
- injected only;
- no global mount;
- no real repository client;
- no database connection;
- no provider sending;
- no customer-visible behavior;
- no API shape change.

## Proposed Exact File Touch Plan For Next Task

If PM approves the next runtime slice, the safest exact allowlist is:

- `tests/repairIntake/repairIntakeDraftToCaseFakeClientRuntimeHarness.unit.test.js`
- `docs/task-1623-repair-intake-draft-to-case-fake-client-runtime-harness-no-db-no-global-mount.md`

Optional source file only if PM specifically wants a reusable test helper instead of keeping the fake clients inside the test:

- `src/repairIntake/repairIntakeDraftToCaseFakeClientRuntimeHarness.js`

Recommended default:

- Do not add the optional source file yet.
- Keep fake clients local to the new test file.
- Use existing runtime entry points:
  - `createRepairIntakeDraftToCaseInjectedRouteComposition`
  - existing synthetic mount target pattern from current route composition tests.

## Proposed Test Scenario For Next Task

The next task should create fake clients that are explicitly not DB-backed:

- `draftClient.findDraftForConversion`
- `caseClient.createCaseFromDraft`
- `auditClient.recordDraftToCaseDecision`
- optional `idempotencyClient.findExistingDraftToCaseResult`
- optional `idempotencyClient.recordDraftToCaseResult`
- optional `planningClient.planCaseFromDraft`

The fake clients should be adapted into the already-supported injected runtime port shape:

- `draftRepository.findDraftForConversion`
- `caseCreationPort.createCaseFromDraft`
- `auditPort.recordDraftToCaseDecision`
- optional `idempotencyStore.findExistingDraftToCaseResult`
- optional `idempotencyStore.recordDraftToCaseResult`
- optional `planningPolicy.planCaseFromDraft`

The test should mount only onto an explicit synthetic target and dispatch:

- `POST /repair-intake/drafts/:draftId/case/plan`
- `POST /repair-intake/drafts/:draftId/case/submit`

Expected assertions:

- no downstream fake client calls when permission is denied;
- plan calls only draft + planning fake clients;
- submit call order remains idempotency find, draft read, plan, case create, audit, idempotency record;
- responses are sanitized;
- raw fake client internals, request headers, raw body, phone, address, LINE identifiers, token, secret, SQL, DB URL, stack trace, provider payload, and `finalAppointmentId` do not leak;
- no app/server/listen/global mount behavior is introduced.

## Files That Must Remain Untouched In The Next Task Unless PM Separately Approves

- `src/app.js`
- `src/server.js`
- `src/routes/**`
- `src/controllers/**`
- `src/repositories/**`
- `src/db/**`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- provider / LINE / SMS / email / webhook modules
- AI / RAG / vector modules
- billing / settlement / invoice / payment modules
- the 7 held historical untracked docs

## Explicit Non-Goals

- No DB connection.
- No `psql`.
- No SQL dry-run or apply.
- No migration dry-run or apply.
- No `npm run db:migrate`.
- No real repository-backed writer.
- No default audit writer.
- No global route mount.
- No smoke/shared runtime.
- No provider sending.
- No LINE/SMS/email/webhook action.
- No AI/RAG/vector action.
- No billing/settlement action.
- No admin/frontend action.
- No customer-visible rollout.
- No cleanup/reset/stash/revert/clean.

## Guardrails To Preserve

- One Case can have at most one formal Field Service Report.
- Do not create a second formal Field Service Report.
- Preserve `field_service_reports.case_id` uniqueness.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- Repair Intake draft-to-Case must not bypass Case creation rules.
- Organization isolation, permission checks, safe-deny behavior, and audit remain mandatory.
- AI remains advisory only.
- LINE/channel identity must not be hard-coded globally.
- SaaS/entitlement-safe boundaries remain mandatory.

## Recommended Verification For This Task1622

Because Task1622 is docs-only, recommended verification is:

```bash
git diff --check -- docs/task-1622-repair-intake-fake-client-runtime-file-touch-planning-no-runtime-no-db.md
git diff --cached --name-only
git diff --name-only -- src tests fixtures migrations admin package.json package-lock.json
git status --short -- docs/task-1622-repair-intake-fake-client-runtime-file-touch-planning-no-runtime-no-db.md
```

## Recommended Verification If PM Approves The Next Runtime Slice

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseFakeClientRuntimeHarness.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedRouteCompositionSmokeBoundary.static.test.js
git diff --check -- tests/repairIntake/repairIntakeDraftToCaseFakeClientRuntimeHarness.unit.test.js docs/task-1623-repair-intake-draft-to-case-fake-client-runtime-harness-no-db-no-global-mount.md
git diff --cached --name-only
```

## PM Decision Needed After Task1622

Please choose the next smallest bounded task:

- Option A: add the test-only fake-client runtime harness described above.
- Option B: require one more docs-only review before runtime test creation.
- Option C: switch module.
- Option D: pause and request cleanup/staging policy for the held historical docs.
