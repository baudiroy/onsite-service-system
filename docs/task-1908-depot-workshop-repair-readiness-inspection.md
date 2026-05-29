# Task1908 Depot Workshop Repair Readiness Inspection

Status: readiness inspection only. No runtime source changes, DB execution, migration, seed, smoke, Zeabur action, deploy, provider sending, billing, AI/RAG execution, customer-visible publication, admin frontend, package, or lockfile changes were made for this task.

## Current Baseline

- Branch: `main`
- Current accepted synchronized baseline before Task1908: `515aeebaf3f5182fe2cb58150ffa595eaa249e1e`
- Local `main` tracks `origin/main`
- Phase 11 Depot / Workshop Repair Runtime is starting after accepted Admin / Dispatch / Operations no-DB closure.
- Seven held historical docs remain untracked and must stay untouched.

## Inspected Evidence

Planning and design docs:

- `docs/planning/future-task-master-roadmap-1877-2000/task-1908-depot-workshop-repair-readiness-inspection.md`
- `docs/planning/future-task-master-roadmap-1877-2000/task-1909-depot-intake-repository-adapter-injected-db-client.md`
- `docs/planning/future-task-master-roadmap-1877-2000/phase-11-tasks-1908-1918-phase-11-depot-and-workshop-repair-runtime.md`
- `docs/design/depot-workshop-repair.md`
- `docs/design/brand-service-provider-subcontractor-access.md`
- `docs/PROJECT_SHORT_INSTRUCTION.md`

Runtime and schema evidence:

- `src/security/fieldVisibilityPolicy.js`
- `src/security/fileAccessControlPolicy.js`
- `src/repairIntake/repairIntakeDraftRepository.js`
- `src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js`
- `src/repairIntake/repairIntakeDraftCaseEligibility.js`
- `migrations/026_create_repair_intake_persistence_tables.sql`
- `migrations/README.md`
- `package.json`

## Existing Design Position

- Depot / Workshop Repair is a second service workflow beside On-site Service, not a separate system.
- On-site Service is appointment-driven.
- Depot / Workshop Repair is receiving / diagnosis / quote / repair / QC / return-driven.
- Future workflow types may include `onsite`, `depot`, `carry_in`, `mail_in`, and `pickup_delivery`.
- Future data concepts include `repair_items`, `repair_receipts`, `repair_diagnoses`, `repair_quotes`, `repair_work_orders`, `repair_parts`, `repair_qc_checks`, and `repair_returns`.
- Those concepts are design-only today and do not authorize migration, API, runtime, or smoke work.

## Existing Runtime Modules

- There is no dedicated `src/depot`, `src/workshop`, or depot/workshop route module yet.
- Existing Repair Intake modules can provide safe intake precedent:
  - `repairIntakeDraftRepository` reads sanitized repair intake draft state through an injected `dbClient`.
  - `repairIntakeDraftCaseCandidateBuilder` preserves `brandId`, `serviceProviderId`, and `serviceType` as candidate metadata.
  - `repairIntakeDraftCaseEligibility` requires organization scope and service context before case creation.
- Existing access-control precedent exists:
  - `fieldVisibilityPolicy` includes `brand`, `serviceProvider`, and `subcontractor` roles.
  - `fileAccessControlPolicy` includes assignment-scope rules for subcontractors and external actors.

## Schema Readiness

- No dedicated depot/workshop tables exist in migrations.
- `migrations/026_create_repair_intake_persistence_tables.sql` defines inert repair intake persistence tables, including `repair_intake_drafts`.
- `repair_intake_drafts` has safe JSON fields:
  - `safe_summary`
  - `safe_metadata`
  - `validation_errors_safe`
- Existing repair intake runtime already reads service context from safe metadata/summary:
  - `brandId` / `brand_id`
  - `serviceProviderId` / `service_provider_id`
  - `serviceType` / `service_type`
- Migration 026 is documented as migration-file authoring only and requires separate explicit dry-run/apply approval before DB use.
- There is no approved DB-backed depot/workshop target.

## Permission And Access Boundary Readiness

- Brand, Service Provider, Subcontractor, Engineer, and Customer access must not be based on role alone.
- Access decisions must evaluate organization scope, case relationship / assignment scope, role permission, field-level visibility, and audit requirement.
- Brand / Vendor may see authorized brand cases and filtered status/reporting data, but must not see service-provider internal dispatch notes, engineer internal comments, internal costs, other brands' cases, AI raw payload, or full audit logs.
- Service Provider may see owned/managed/operated cases within its organization scope, but not other providers' data.
- Subcontractor must be minimum-permission by default and see only assigned cases and necessary execution data.
- Customer may see only verified / bound own cases and customer-visible data.

## Core Invariants Confirmed

- Depot/workshop repair is not the same as onsite appointment completion.
- Depot/workshop status must not pollute formal Completion Report / Field Service Report state.
- Customer-visible depot/workshop output must be filtered and explicitly scoped.
- Brand, service-provider, and subcontractor access must be scoped and organization-isolated.
- Subcontractors must not see customer-sensitive data unless explicitly authorized.
- Provider sending is not part of this branch.
- AI may assist only if explicitly scoped later; no AI provider execution is authorized here.
- Billing/settlement is not part of this branch.
- `finalAppointmentId` must not be mutated.
- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation is authorized here.

## Gaps

- No dedicated depot/workshop repository, service, status guard, route, or audit boundary exists yet.
- No depot/workshop DB-backed smoke has run.
- No depot/workshop migration exists or is approved for apply.
- No explicit depot/workshop customer-visible projection exists yet.
- No explicit brand/service-provider/subcontractor access guard exists for depot/workshop case visibility yet.
- No depot/workshop audit event catalog exists yet.

## Safest Next Implementation Target

Task1909 can safely start with a minimal repository adapter using an injected `dbClient` and synthetic tests only.

Recommended Task1909 scope:

- Create a `DepotIntakeSqlRepositoryAdapter` under `src/repositories`.
- Support read-only depot intake candidate lookup from existing `repair_intake_drafts` safe fields.
- Use organization predicate and optional tenant predicate.
- Use parameterized query specs only.
- Return normalized/sanitized envelopes only.
- Do not expose raw DB rows.
- Do not create/update depot status unless a later task formalizes schema and write semantics.
- Do not invent dedicated depot/workshop tables.

Unsafe for Task1909:

- Creating or applying depot/workshop migrations.
- Writing depot/workshop status into unapproved columns.
- Mutating Cases, Appointments, Field Service Reports, or customer-visible publication state.
- Provider sending, AI/RAG, billing, smoke, Zeabur, or runtime route work.

## Verification Notes

Existing relevant checks for this inspection branch:

- `git diff --check`
- `npm run check` if available
- package `check` equivalent fallback: `find src -name '*.js' -print0 | xargs -0 -n1 node --check`
- relevant security tests if needed:
  - `tests/security`

## Guardrail Confirmation

- No runtime source changes.
- No DB / SQL / psql / migration / seed.
- No depot/workshop smoke.
- No Zeabur probes.
- No Zeabur env changes.
- No deploy.
- No runtime server start.
- No provider sending.
- No billing/AI execution.
- No secrets printed.
- No assignment, appointment, case, or depot/workshop mutation in real runtime.
- No `finalAppointmentId` mutation.
- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- No customer-visible publication behavior.
- No admin frontend/package/lockfile changes.
- Seven held historical untracked docs remain untouched.
