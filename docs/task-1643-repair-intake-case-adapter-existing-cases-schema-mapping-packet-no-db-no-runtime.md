# Task1643 - Repair Intake Case Adapter Existing Cases Schema Mapping Packet / No DB No Runtime

Status: mapping packet only / no DB execution / no runtime change / no source change.

PM decision from Task1642: choose Option B. Adjust `repairIntakeCaseRepositoryAdapter` to the existing formal `cases` schema. Keep Repair Intake provenance in Migration 026 conversion, idempotency, and audit tables instead of adding Repair Intake-only columns directly to `cases`.

## Goal

Define the smallest future runtime contract for creating a formal Case from a Repair Intake draft without changing source code in this task.

This packet answers:

- exact `cases` field mapping,
- required input and block rules,
- `status`, `source`, `case_no`, and `customer_id` source strategy,
- how `sourceDraftId`, `requestId`, and `idempotencyKey` should move to Migration 026 provenance tables,
- next bounded runtime split.

## Existing `cases` Insert Shape

Future adapter should target the existing formal Case master fields rather than the previous Repair Intake-specific insert shape.

Minimum `cases` fields for create:

| `cases` column | Required | Source strategy |
| --- | --- | --- |
| `id` | yes | injected `idGenerator`; UUID only |
| `case_no` | yes | injected case number generator; must be unique and non-sensitive |
| `customer_id` | yes | resolved customer id from validated customer matching; block if absent |
| `organization_id` | yes | candidate or command organization scope; must match current actor context |
| `status` | yes | existing lifecycle value; recommended initial value `draft` |
| `priority` | yes | candidate priority if allowed, otherwise `normal` |
| `warranty_status` | optional/default | use DB default `unknown` unless validated warranty result exists |
| `appointment_status` | optional/default | use DB default `not_required`; dispatch is later |
| `completion_status` | optional/default | use DB default `not_started`; completion is later |
| `source` | yes | mapped from Repair Intake channel to existing allowed source |
| `brand` | yes | safe brand display text or normalized brand code; block if absent |
| `case_type` | optional/default | map `serviceType`; recommended `repair` for Repair Intake repair flow |
| `product_type` | yes | safe validated product category/type; block if absent |
| `model_no` | yes | safe validated model number or controlled unknown marker if PM approves |
| `serial_no` | optional | safe serial if validated; otherwise null |
| `problem_description` | yes | safe issue summary text from validated draft; block if blank |
| `service_region` | optional | safe region if validated; no full address |
| `customer_snapshot` | optional | masked/minimized customer-visible snapshot only; no phone/address raw |
| `metadata` | optional | safe operational metadata only; no raw row/token/phone/address |
| `created_at` | yes | injected clock or DB default; prefer injected clock for tests |
| `created_by` | optional | actor id only if it references an existing `users(id)`; otherwise null |

Do not write these previous adapter-only fields directly to `cases`:

```text
source_repair_intake_draft_id
brand_id
service_provider_id
intake_source
created_by_actor_id
request_id
idempotency_key
```

These belong in Migration 026 provenance records or future normalized brand/provider tables, not as required Case master columns in the next bounded runtime step.

## Status Strategy

Use existing `cases.status` values only.

Recommended first value:

```text
draft
```

Rationale:

- The Case exists but may still need dispatch intake, customer confirmation, and operational enrichment.
- It avoids expanding the status constraint with `created`.
- It keeps `submitted`, `reviewing`, and `accepted` available for later workflow gates.

Block rule:

- If PM wants immediate formal submission, require a separate bounded task to define when `submitted` is safe.
- Do not introduce `created` into `cases.status` in the adapter-alignment path.

## Source Strategy

Map Repair Intake source into existing `cases.source` allowed values.

Recommended mapping:

| Repair Intake source | `cases.source` |
| --- | --- |
| `web`, `website`, `open_web` | `website` |
| `api`, `brand_api`, `partner_api` | `api` |
| `phone`, `call`, `ai_call` | `phone` |
| `line`, `official_line` | `line` |
| `admin`, `manual`, `agent_assisted` | `admin` |
| `email` | `email` |

Block rule:

- Unknown source must block with `REPAIR_INTAKE_CASE_REPOSITORY_SOURCE_UNSUPPORTED`.
- Do not silently map unknown source to `admin`.

## Case Number Strategy

`case_no` must come from an injected generator or service, not be fabricated inside the repository.

Required future dependency:

```text
caseNumberGenerator.next({ organizationId, sourceDraftId, source })
```

Block rules:

- Missing generator blocks with `REPAIR_INTAKE_CASE_REPOSITORY_CASE_NO_GENERATOR_NOT_CONFIGURED`.
- Empty generated value blocks with `REPAIR_INTAKE_CASE_REPOSITORY_CASE_NO_MISSING`.
- Unique violation should become a sanitized retry/manual-review result, not leak SQL or DB details.

## Customer ID Strategy

`customer_id` is required by the current formal `cases` schema.

Source:

- resolved customer id from validated customer matching,
- created customer id from a separately approved customer creation task,
- or a verified existing customer id from admin/manual intake.

Block rules:

- Missing customer id blocks formal Case creation.
- Ambiguous customer match blocks formal Case creation.
- Phone-only, LINE-only, or raw external reporter data is not enough.
- Do not create placeholder customer ids inside this adapter.

Recommended reason codes:

```text
REPAIR_INTAKE_CASE_REPOSITORY_CUSTOMER_ID_MISSING
REPAIR_INTAKE_CASE_REPOSITORY_CUSTOMER_MATCH_AMBIGUOUS
REPAIR_INTAKE_CASE_REPOSITORY_CUSTOMER_SCOPE_MISMATCH
```

## Product And Issue Strategy

The current formal Case schema requires product and issue fields.

Required future input:

```text
brand
productType
modelNo
problemDescription
```

Block rules:

- Missing brand blocks.
- Missing product type blocks.
- Missing model number blocks unless PM approves a controlled non-sensitive marker such as `unknown`.
- Blank issue/problem description blocks.
- Raw customer address, full phone, raw imported row, provider payload, token, and secret remain forbidden.

## Provenance Split

Keep formal Case creation and Repair Intake provenance separate.

Future runtime split:

1. `repairIntakeCaseRepositoryAdapter`
   - creates one formal `cases` row using existing Case master fields;
   - returns only `{ id, organizationId, sourceDraftId, status: 'created' }` or a revised safe created result.

2. `repair_intake_draft_case_conversions`
   - records `draft_id`, `case_id`, `case_ref`, `conversion_status`, `idempotency_key`, `actor_id`, `request_id`, and `safe_metadata`.
   - This is the source of truth for draft-to-case provenance.

3. `repair_intake_idempotency_records`
   - prevents duplicate conversion side effects.

4. `repair_intake_audit_events`
   - records conversion decisions and outcomes with internal-only visibility.

Do not store full raw draft, customer phone, full address, token, provider payload, or AI raw payload in `cases.metadata` or provenance safe metadata.

## Future Adapter Input Shape

Future adapter candidate should require or derive:

```js
{
  sourceDraftId,
  organizationId,
  customerId,
  caseNo,
  source,
  brand,
  productType,
  modelNo,
  problemDescription,
  serviceType,
  priority,
  serviceRegion,
  safeCustomerSnapshot,
  safeMetadata
}
```

Command context:

```js
{
  draftId,
  organizationId,
  actorId,
  requestId,
  idempotencyKey
}
```

The adapter must verify `command.draftId === candidate.sourceDraftId` and `command.organizationId === candidate.organizationId`.

## Next Runtime Split

Recommended next bounded task:

```text
Task1644 - Repair Intake Case Adapter Existing Cases Schema Guard Unit Test / No DB No Route
```

Acceptance target:

- Modify/add only unit tests for `repairIntakeCaseRepositoryAdapter`.
- Define expected block behavior for missing `customerId`, missing `caseNo`, unsupported `source`, missing product/issue required fields, and command/candidate mismatch.
- Do not change source yet.
- No DB, SQL, migration, route, server, smoke, provider, AI, admin, package, staging, commit, or push.

After Task1644, a separate runtime task can update the adapter implementation against the new tests.
