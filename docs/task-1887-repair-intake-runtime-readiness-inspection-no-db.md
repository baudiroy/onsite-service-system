# Task1887 Repair Intake Runtime Readiness Inspection / No DB

Status: inspection completed. No runtime/source changes.

Accepted baseline:
- `origin/main`: `7d0897a26c4f01ed11d7f8da18cdc21e5c7d1958`
- Local `main`: synchronized with `origin/main` before this task.
- Branch: Repair Intake -> Case runtime branch start.

## Scope

This task inspected existing Repair Intake draft, matching, duplicate, draft-to-Case, repository, route, and test boundaries without executing DB, migration, seed, smoke, deploy, provider, AI, or billing work.

## Existing Runtime and Route Evidence

- `src/repairIntake/repairIntakeDraftRepository.js`
  - Injected `dbClient` read repository for `repair_intake_drafts`.
  - Uses parameterized `SELECT` statements.
  - Maps only sanitized draft fields for conversion.
  - No global pool, `DATABASE_URL`, app/server import, provider, AI, or billing dependency.
- `src/repairIntake/repairIntakeDraftRepositoryAdapter.js`
  - Existing injected adapter for marking a draft linked to a Case after a Case exists.
  - Uses injected client or transaction-like client only.
  - This adapter is post-case-linking oriented and must not be treated as authority to create a formal Case in Task1888.
- `src/repairIntake/repairIntakeDraftRepositoryContract.js`
  - Contract wrapper around `findDraftForConversion`.
  - Returns normalized safe envelopes and strips unsafe lookup/result fields.
- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`
  - Existing application boundary for draft-to-Case flow.
  - Contains precondition and idempotency behavior, but Task1887 did not execute it.
- `src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js`
- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`
- `src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js`
- `src/routes/repairIntakeDraftToCase.routes.js`
  - Existing route/bootstrap skeletons and composition points for admin/internal draft-to-Case paths.
  - These are not authorization to run smoke or create a formal Case in this batch.

## Existing Test Evidence

- `tests/repairIntake/repairIntakeDraftRepository.unit.test.js`
  - Synthetic `dbClient` tests for parameterized read, scoped lookup, sanitized mapping, not-found, and sanitized query failure.
- `tests/repairIntake/repairIntakeDraftRepositoryBoundary.static.test.js`
  - Static guard for select-only repository behavior and no runtime/provider coupling.
- `tests/repairIntake/repairIntakeDraftRepositoryContract.unit.test.js`
  - Contract-level normalized envelope and unsafe-field stripping coverage.
- `tests/repairIntake/repairIntakeDraftRepositoryContractIntegration.unit.test.js`
  - Synthetic integration from contract to injected dbClient repository.
- `tests/repairIntake/repairIntakeDraftToCaseApplicationService.unit.test.js`
  - Existing application service precondition/idempotency behavior.
- `tests/repairIntake/*Boundary.static.test.js`
  - Broad static guard coverage for no global runtime, no provider, no DB execution, route/mount boundaries, and runtime port contracts.

## Core Invariants Confirmed

- `repair_intake_draft` is not a formal Case.
- `service_request` is not a Case.
- Duplicate candidate is not a confirmed duplicate.
- Reporter, customer, billing contact, and on-site contact override must remain distinct.
- AI may assist classification/dedupe only if explicitly scoped, but must not auto-create a Case in this branch.
- No provider sending is in scope.
- No customer-visible publication is in scope.
- No billing/settlement behavior is in scope.
- Organization isolation is mandatory.
- LINE must not be treated as global identity.
- One Case still equals one formal Completion Report / Field Service Report.
- No `finalAppointmentId` mutation is in scope.

## Readiness Findings

- The safest immediate Task1888 target is the existing injected `dbClient` draft read repository and its contract boundary, not a new parallel repository module.
- Existing read repository already supports `findDraftForConversion(input)` for draft lookup using a synthetic/injected `dbClient`.
- Existing contract already normalizes repository output into safe envelopes.
- Existing adapter for `markDraftLinkedToCase` is a later-stage link-after-case operation and must not be expanded into formal Case creation in Task1888.
- Existing smoke tests reference Zeabur/DB paths, but they are out of scope for this batch and must not be run.
- Existing route/runtime composition is already broad; Task1888 should avoid mounting, deployment, or runtime-server changes.

## Gaps for Task1888

- Add or strengthen synthetic tests proving the injected draft repository never exposes raw DB rows.
- Add or strengthen synthetic tests proving query failures are sanitized at both repository and contract boundaries.
- Add or strengthen tests for parameterized query usage and organization/tenant scoping.
- Add static guard coverage specific to Task1888 for:
  - no `DATABASE_URL`
  - no global pool
  - no app/server import
  - no migration execution
  - no provider sending
  - no formal Case creation
  - no Completion Report / Field Service Report creation
  - no `finalAppointmentId` mutation
  - no customer-visible publication behavior
  - no billing or AI provider execution

## Recommended Task1888 Target

Recommended implementation target:
- Harden `src/repairIntake/repairIntakeDraftRepository.js`.
- Harden `src/repairIntake/repairIntakeDraftRepositoryContract.js` only if needed for normalized envelope safety.
- Add focused tests under `tests/repairIntake/` using synthetic `dbClient` only.
- Add Task1888 evidence doc.

Task1888 must not:
- Create a formal Case.
- Mutate a formal Case table.
- Apply migration 026 or any other migration.
- Use `DATABASE_URL`.
- Construct a global pool.
- Import app/server/routes/controllers.
- Run Zeabur or local runtime smoke.
- Run provider, AI, or billing code.

## Verification

- This task did not modify runtime/source files.
- This task did not execute DB, SQL, migration, seed, smoke, deploy, provider, AI, billing, or Zeabur commands.
- The intended project check is `npm run check`; in this shell `npm` is unavailable, so the package.json-equivalent `find src -name '*.js' -exec /Applications/Codex.app/Contents/Resources/node --check {} +` should be used.
