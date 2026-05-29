# Task1916 Depot Workshop Smoke Readiness

Status: readiness-only / docs-only. No smoke, Zeabur probe, DB connection, SQL, migration, seed, deploy, route mount, runtime source change, depot/workshop record mutation, provider sending, billing, AI/RAG execution, customer-visible publication, Completion Report / Field Service Report behavior, or secret printing is approved by this document.

## Current Branch State

Baseline at task start:

- `origin/main`: `7e3547b65c6c72d5d065105a050a5ad87c54f697`
- Local `main` was synchronized with `origin/main`

Accepted depot/workshop runtime boundaries already in `origin/main`:

- Task1908 Depot Workshop Repair readiness inspection
- Task1909 DepotIntakeSqlRepositoryAdapter
- Task1910 DepotRepairStatusBoundary
- Task1911 WorkshopAssignmentService
- Task1912 DepotAccessScopeGuard
- Task1913 Depot repair route permission boundary
- Task1914 Depot Repair customer-visible data filter
- Task1915 Depot Workshop audit boundary

Current boundary summary:

- Depot intake repository exists but is injected `dbClient` only and read-only over existing `repair_intake_drafts` safe fields.
- Depot write scope is not approved and fail-closes.
- Depot repair status boundary exists and separates depot/workshop lifecycle from onsite appointment completion and formal Completion Report / Field Service Report behavior.
- Workshop assignment service exists but is prepare-only and returns `written: false`.
- Depot access scope guard exists and enforces brand/service-provider/subcontractor scope.
- Depot repair route boundary exists but no DB-backed smoke has run.
- Customer-visible data filter exists as filtered DTO policy only, not publication.
- Audit boundary exists as internal-only/sanitized.
- No dedicated depot/workshop write schema or migration/table is approved.
- No depot/workshop smoke has run.
- No provider sending has run.

## Preconditions Before Task1917

Task1917 must not run until all relevant preconditions are explicitly satisfied:

- Exact approved target URL or target name must be named.
- Route mount status must be explicitly confirmed.
- DB target approval is required for any DB-backed path.
- Test data approval is required if smoke uses depot intake/workshop assignment fixtures.
- Provider sending must remain disabled.
- No write-path smoke is allowed unless write schema/scope is explicitly approved.
- No customer-visible publication smoke is allowed unless explicitly scoped.
- Subcontractor/customer-sensitive data rules must be preserved.

## Future Smoke Categories

Allowed only after the matching gate is approved:

- Public `/healthz` smoke: allowed only after target approval.
- Unmounted route expectation check: allowed only after target approval and route-mount expectation is named.
- Mounted safe read/preflight safe-deny check: allowed only if route is mounted and target is approved.
- Synthetic local handler smoke: allowed only if explicitly scoped as local/synthetic and no runtime server is started unless separately approved.
- DB-backed read-only smoke: allowed only after DB target and test data approval.
- Write-path smoke: allowed only after schema/write-scope approval.
- Authenticated allow-path smoke: allowed only after target, auth, and test data approval.

## Forbidden Future Smoke Without Explicit Approval

The following remain forbidden unless separately and explicitly approved:

- Depot/workshop write mutation.
- finalAppointmentId mutation.
- Completion Report / Field Service Report behavior.
- Customer-visible depot/workshop publication.
- Provider sending.
- AI provider calls.
- Billing provider calls.
- Destructive fixture smoke.
- Seed/migration in the same smoke task.
- Printing DATABASE_URL or secrets.
- Exposing subcontractor-forbidden customer-sensitive data.

## Stop Conditions

Any future smoke must stop immediately if any of these occurs or appears likely:

- Route unexpectedly writes a depot/workshop record.
- Route mutates appointment lifecycle or finalAppointmentId.
- Route triggers Completion Report / Field Service Report behavior.
- Route bypasses brand/service-provider/subcontractor access guard.
- Route exposes customer-sensitive data to subcontractor scope.
- Route exposes raw DB rows, raw phone/address, provider tokens, SQL, stack traces, or secrets.
- Route provider-sends.
- Route reaches customer-visible publication behavior.
- DB/migration/seed target is unclear.

## Exact Task1917 Approval Phrase

Task1917 requires the user to name the target and approve it with this exact phrase:

> I approve running Depot Workshop smoke against the explicitly named target: `<TARGET_NAME>`. Do not use any other target. Do not run DB/migration/seed unless separately approved. Do not write depot/workshop records unless write scope is explicitly approved. Do not mutate finalAppointmentId, trigger provider sending, AI, billing, Completion Report / FSR behavior, or customer-visible publication.

## Recommended Task1917 Shape

Task1917 should start with the narrowest safe sequence:

1. `/healthz` only.
2. Route mount/safe-deny check only if route is mounted.
3. No authenticated allow-path smoke until target/auth/test data approval.
4. No DB-backed smoke unless target is explicitly approved.
5. No write-path smoke unless write scope is explicitly approved.
6. No migration or seed in the smoke task.

## Explicit Non-Actions In Task1916

This task did not and must not:

- run smoke
- probe Zeabur public endpoints
- connect to DB
- run SQL
- run migration
- run seed
- deploy or redeploy
- modify Zeabur env vars
- mount routes
- modify runtime source
- modify tests
- modify package or lockfile
- modify admin frontend
- mutate appointment lifecycle
- mutate depot/workshop records
- mutate finalAppointmentId
- create, approve, publish, revoke, or mutate Completion Report / Field Service Report
- create customer-visible depot/workshop publication behavior
- provider-send LINE, SMS, email, app push, or webhook
- execute AI/RAG or billing providers
- print secrets
- bypass organization isolation
- expose customer-sensitive data to subcontractor scope

## Verification

Readiness verification for this docs-only task:

- `git diff --check`
- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`
- `npm run check`

If `npm` is unavailable in the active shell, the npm project check cannot run there; the `node --check` syntax/static fallback above is the documented replacement for this docs-only task.

## Next Step Recommendation

Ask PM to review Task1916. If accepted, sync the docs-only commit to GitHub. Do not start Task1917 without the exact approved target phrase and all required smoke gates.
