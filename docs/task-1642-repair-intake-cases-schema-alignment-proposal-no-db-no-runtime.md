# Task1642 - Repair Intake Cases Schema Alignment Proposal / No DB No Runtime

Status: proposal only / no DB execution / no runtime change / no source change.

## Scope

Task1642 reviews the Zeabur `cases` schema mismatch proven by Task1641 smoke and proposes the smallest next schema alignment direction for Repair Intake Draft to Case.

Allowed evidence read:

- `migrations/002_create_cases.sql`
- `migrations/003_create_case_activity_tables.sql`
- `migrations/008_create_field_service_tables.sql`
- `migrations/016_add_cases_closed_at.sql`
- `migrations/026_create_repair_intake_persistence_tables.sql`
- `src/repairIntake/repairIntakeCaseRepositoryAdapter.js`
- `tests/repairIntake/repairIntakeCaseRepositoryAdapter.zeabur-db-smoke.test.js`

No SQL, migration, DB mutation, route mount, source edit, staging, commit, or push was performed for this proposal.

## Evidence

Task1641 committed a Zeabur DB smoke that safe-skips before writing because the current `cases` table does not match `repairIntakeCaseRepositoryAdapter`.

Safe-skip evidence:

```text
cases_required_columns_missing;
missing=source_repair_intake_draft_id,brand_id,service_provider_id,intake_source,service_type,created_by_actor_id,request_id,idempotency_key
```

The adapter currently inserts these columns into `cases`:

```text
id
organization_id
source_repair_intake_draft_id
brand_id
service_provider_id
intake_source
service_type
priority
status
created_by_actor_id
created_at
request_id
idempotency_key
```

The existing `cases` schema from `002_create_cases.sql` is a broader Case master table. It requires core case fields such as:

```text
case_no
customer_id
source
brand
product_type
model_no
problem_description
```

It also constrains `status` to existing Case lifecycle values such as `draft`, `submitted`, `reviewing`, `accepted`, `dispatch_pending`, `assigned`, `scheduled`, `completed`, and `closed`. The adapter currently writes `status = created`, which is not part of that lifecycle.

Migration 026 already creates Repair Intake-specific persistence tables:

- `repair_intake_drafts`
- `repair_intake_draft_case_conversions`
- `repair_intake_idempotency_records`
- `repair_intake_audit_events`

This means the system already has a dedicated place to record draft-to-case provenance, idempotency, conversion status, request id, actor, and safe metadata without adding every Repair Intake runtime field directly onto `cases`.

## Option A - Add Columns To `cases`

Add the adapter-required Repair Intake columns to the canonical `cases` table:

```text
source_repair_intake_draft_id
brand_id
service_provider_id
intake_source
service_type
created_by_actor_id
request_id
idempotency_key
```

This option would also need to resolve the adapter's `status = created` mismatch and the existing `cases` required fields.

Minimum additional decisions before Option A can safely execute:

- Whether `status = created` should be added to the Case lifecycle, or the adapter should write an existing value such as `draft` or `submitted`.
- Whether `case_no`, `customer_id`, `source`, `brand`, `product_type`, `model_no`, and `problem_description` must be supplied by the adapter before insert.
- Whether `source_repair_intake_draft_id` should reference `repair_intake_drafts(id)` or remain nullable text/uuid provenance.
- Whether `brand_id` and `service_provider_id` reference future organization/vendor tables or remain nullable uuids until those tables are formalized.
- Which indexes are needed for organization-scoped draft-to-case lookups and idempotency.

Risk:

- Adding columns alone will not make the adapter insert succeed because existing non-null Case master fields still need values.
- Adding `created` to `cases.status` may blur Case lifecycle semantics.
- Duplicating conversion/idempotency data between `cases` and Migration 026 tables creates two sources of truth.
- It increases schema surface area on the canonical Case table before the Repair Intake conversion boundary is fully settled.

## Option B - Adjust Adapter To Existing `cases` Schema

Keep `cases` as the canonical Case master table and change the Repair Intake case adapter to write the existing `cases` shape.

The adapter would map or require:

```text
case_no
customer_id
status
priority
source
brand
case_type
product_type
model_no
problem_description
metadata
organization_id
created_at
created_by
```

Recommended mapping direction:

- `status`: use an existing lifecycle value, likely `draft` or `submitted`, not `created`.
- `source`: map `intakeSource` into the existing allowed source set, for example `website`, `api`, `phone`, or `admin`.
- `serviceType`: map to existing `case_type` where possible, for example `onsite repair` should usually become `repair`.
- `sourceDraftId`, `requestId`, and `idempotencyKey`: keep primary structured tracking in `repair_intake_draft_case_conversions` / `repair_intake_idempotency_records`; optionally place safe pointers in `cases.metadata` only as secondary metadata.
- `brandId` / `serviceProviderId`: do not force new `cases` columns until the brand/service-provider access model is formalized. Use existing `brand` text for Case master display and keep future ids in conversion metadata if needed.
- `customer_id`: require a resolved customer before formal Case creation. If customer matching is incomplete, block conversion instead of creating a partial formal Case.
- `case_no`: generate through the existing Case numbering strategy or a new bounded deterministic generator task.

Risk:

- The adapter needs stricter input and may block until customer matching and case number generation are available.
- Some Repair Intake provenance is not directly queryable from `cases` unless joined through Migration 026 tables.
- A later reporting task may need read models or indexes over the conversion tables.

## Recommendation

Prefer Option B first.

Reason:

- `cases` should remain the canonical Case master table, not a Repair Intake staging table.
- Migration 026 already supplies dedicated Repair Intake draft, conversion, idempotency, and audit tables.
- The Case master table already has lifecycle, customer, product, issue, and service fields that a real formal Case should satisfy.
- A formal Case should not be created until the system has enough safe, validated data to fill the required Case master fields.
- This direction better preserves the project guardrail that Repair Intake sources converge into Case without making another partial Case-like shape inside `cases`.

Option A should be used only if PM explicitly decides that Repair Intake provenance must live directly on `cases`. Even then, Option A still needs an adapter update to supply existing required Case fields and should not rely on nullable/default placeholders that create weak formal Cases.

## Next Small Bounded Task

Recommended next task:

```text
Task1643 - Repair Intake Case Adapter Existing Cases Schema Mapping Packet / No DB No Runtime
```

Acceptance target:

- No source/runtime changes.
- No DB/SQL/migration execution.
- Create a docs-only mapping packet that defines the exact adapter input needed for Option B:
  - required customer id source,
  - case number generation source,
  - allowed `status`,
  - `intakeSource` to `source` mapping,
  - `serviceType` to `case_type` mapping,
  - required safe product/issue fields,
  - where `sourceDraftId`, `requestId`, and `idempotencyKey` are stored.
- Confirm whether a future runtime adapter task should block when required Case master fields are absent.

Do not proceed directly to migration or adapter runtime until PM chooses Option A or Option B.
