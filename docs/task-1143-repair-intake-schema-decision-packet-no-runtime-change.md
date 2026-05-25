# Task1143 - Repair Intake Schema Decision Packet / No Runtime Change

## Status

Completed locally. Not staged.

This packet is a schema decision proposal only.

It does not authorize DB execution, SQL, migration creation, migration dry-run, migration apply, `psql`, `db:migrate`, repository implementation, repository writer, API expansion, provider work, admin work, AI/RAG work, billing work, staging, or commit.

## Decision Legend

- `accepted_proposal`: safe as a proposed direction for a future bounded migration proposal.
- `needs_decision`: requires PM/product/engineering decision before migration proposal.
- `blocked`: must not proceed until a separate gate resolves the issue.

## `repair_intake_drafts`

| Area | Proposed decision | Status |
| --- | --- | --- |
| Purpose | Store validated or pending Repair Intake draft records before formal Case creation. Drafts can originate from API, Excel/CSV import, Web/App, LINE-assisted intake, phone/AI call, or assisted customer service entry. | `accepted_proposal` |
| Primary key | Use a stable draft id. Exact type remains open until migration convention is confirmed. | `needs_decision` |
| Organization / tenant isolation | Every row must include organization scope. Tenant isolation must be query-enforced and index-supported. | `accepted_proposal` |
| Draft status | Keep draft lifecycle separate from Case status. Candidate statuses: `received`, `validated`, `needs_review`, `ready_for_conversion`, `converted`, `rejected`, `expired`. | `needs_decision` |
| Source fields | Store intake source family and source reference separately. Candidate fields: source, source_ref, intake_source, import_batch_id, channel_context_ref. | `needs_decision` |
| Safe summary / metadata posture | Store safe, minimized summary fields needed for dedupe, planning, and review. Avoid customer-facing leakage of internal notes or raw payload. | `accepted_proposal` |
| Raw payload / PII policy | Raw payload should not be stored by default in this table. If future retention is required, it needs a separate encrypted/minimized payload policy with retention and masking. | `needs_decision` |
| Timestamps | Include created, updated, validated, converted, rejected, and expired timestamps as applicable. | `accepted_proposal` |
| Suggested indexes | Organization + status + created time; organization + source + source_ref; organization + import_batch_id; organization + normalized customer phone hash if approved. | `needs_decision` |
| Open questions | Exact id type, draft status enum, raw payload retention, source field naming, phone hash policy, and import batch linkage. | `needs_decision` |

## `repair_intake_draft_case_conversions`

| Area | Proposed decision | Status |
| --- | --- | --- |
| Purpose | Record draft-to-case conversion attempts and outcomes without making the draft row itself the only audit source. | `accepted_proposal` |
| Draft id linkage | Link to the Repair Intake draft id and organization scope. Cross-organization linkage must be impossible. | `accepted_proposal` |
| Case id / case reference | Store the created or reused Case reference. Do not expose or depend on `finalAppointmentId`. | `accepted_proposal` |
| Conversion status | Candidate statuses: `planned`, `submitted`, `converted`, `duplicate_replayed`, `conflict`, `failed`, `cancelled`. | `needs_decision` |
| Idempotency key | Store the idempotency key or reference used for submit operations. Full request bodies must not be stored here. | `accepted_proposal` |
| Actor / context reference | Store safe actor/context references such as actor id, actor type, request context id, or import job id. Avoid token, secret, full LINE id, or raw credential values. | `accepted_proposal` |
| Organization / tenant isolation | Include organization scope in every row and uniqueness/index decisions. | `accepted_proposal` |
| Conflict / duplicate handling | Duplicate replay should return a safe prior result. Conflicts should be explicit and not create another Case silently. | `accepted_proposal` |
| Timestamps | Include planned/submitted/converted/failed timestamps as applicable. | `accepted_proposal` |
| Suggested indexes | Organization + draft id; organization + case id; organization + idempotency key; organization + conversion status + created time. | `needs_decision` |
| Open questions | Whether conversion rows are one row per attempt or one canonical row per draft; whether conflict details belong here or in audit events. | `needs_decision` |

## `repair_intake_idempotency_records`

| Area | Proposed decision | Status |
| --- | --- | --- |
| Purpose | Prevent duplicate draft-to-case submit behavior and support safe replay of prior results. | `accepted_proposal` |
| Idempotency key | Store a bounded idempotency key, scoped by organization and operation type. | `accepted_proposal` |
| Operation type | Candidate operation type: `repair_intake_draft_to_case_submit`. Additional operation types need explicit approval. | `accepted_proposal` |
| Organization / tenant scope | Uniqueness must include organization or tenant scope. A key must not be global across tenants. | `accepted_proposal` |
| Safe request fingerprint / hash concept | Store a safe request fingerprint or hash only, not raw request payload or PII. | `accepted_proposal` |
| Replay result / case reference | Store safe replay metadata and Case reference sufficient to return deterministic results. Do not store customer-sensitive raw output. | `accepted_proposal` |
| Expiration / retention | Define retention before implementation. Candidate: keep completed submit idempotency records long enough for operational retry windows, then archive or expire. | `needs_decision` |
| Uniqueness scope | Candidate unique scope: organization + operation type + idempotency key. Include draft id only if PM chooses draft-bound keys. | `needs_decision` |
| Timestamps | Include created, first_seen, completed, last_replayed, expires, and updated timestamps as applicable. | `accepted_proposal` |
| Suggested indexes | Unique organization + operation type + idempotency key; organization + draft id; organization + expires; organization + created time. | `needs_decision` |
| Open questions | Retention duration, replay payload shape, whether draft id participates in uniqueness, and stale in-flight handling. | `needs_decision` |

## `repair_intake_audit_events`

| Area | Proposed decision | Status |
| --- | --- | --- |
| Purpose | Record safe Repair Intake decision and conversion audit events without exposing raw payloads or sensitive internal data. | `accepted_proposal` |
| Event type | Candidate event types: `repair_intake_draft_to_case_plan`, `repair_intake_draft_to_case_submit`, `repair_intake_draft_to_case_decision`, `repair_intake_draft_to_case_replay`, `repair_intake_draft_to_case_conflict`. | `needs_decision` |
| Draft id / case reference | Include draft id and Case reference when available, always scoped by organization. | `accepted_proposal` |
| Actor / context | Store safe actor id/type and request context references. Do not store token, secret, full credential, full LINE id, or raw headers. | `accepted_proposal` |
| Decision / outcome | Store normalized outcome, reason key, and safe metadata. Do not store AI raw payload or internal-only notes in customer-visible form. | `accepted_proposal` |
| Safe metadata | Metadata must be minimized, redacted, and safe for internal audit only. | `accepted_proposal` |
| Customer-visible vs internal-only posture | Audit events are internal-only by default. Any future customer-visible summary must be separately projected and filtered. | `accepted_proposal` |
| PII / raw data policy | No raw payload, full phone, full address, full LINE id, token, secret, stack trace, SQL text, or full `DATABASE_URL`. | `accepted_proposal` |
| Timestamps | Include created time and event occurred time if distinct. | `accepted_proposal` |
| Suggested indexes | Organization + event type + created time; organization + draft id; organization + case id; organization + actor id. | `needs_decision` |
| Open questions | Whether to reuse a platform audit table or create Repair Intake-specific audit events; retention duration; export/view permission requirements. | `needs_decision` |

## Cross-Table Decisions

| Decision | Proposed posture | Status |
| --- | --- | --- |
| Organization isolation | Every table must include organization or tenant scope. | `accepted_proposal` |
| Tenant / SaaS readiness | No table may rely on single-tenant assumptions, single LINE channel assumptions, or single brand assumptions. | `accepted_proposal` |
| Idempotency uniqueness | Idempotency uniqueness must include organization/tenant scope. | `accepted_proposal` |
| Case linkage | Case linkage must not expose or depend on `finalAppointmentId`. | `accepted_proposal` |
| LINE identity | LINE identity must not be global identity. Future references must be scoped by organization + channel where applicable. | `accepted_proposal` |
| Audit traceability | Draft, conversion, idempotency, and audit records must support safe traceability without raw sensitive payloads. | `accepted_proposal` |
| Submit transaction boundary | Future submit flow should decide whether draft status update, case creation, idempotency record, and audit event are in one transaction or use an outbox/recovery model. | `needs_decision` |
| Retention / archival | Draft, idempotency, conversion, audit, and raw payload retention must be explicitly decided before migration. | `needs_decision` |

## Migration Readiness

- Proposed migration name only: `create_repair_intake_persistence_tables`.
- Exact migration number remains open unless separately reserved.
- No migration file is created by this task.
- No DDL or SQL is included in this task.
- Disposable DB authorization remains required before any dry-run or apply.
- Repository implementation remains unauthorized until exact source/test files and DB boundaries are approved.

## Decision Output

| Schema area | Decision output |
| --- | --- |
| `repair_intake_drafts` | `needs_decision` |
| `repair_intake_draft_case_conversions` | `needs_decision` |
| `repair_intake_idempotency_records` | `needs_decision` |
| `repair_intake_audit_events` | `needs_decision` |
| Cross-table organization isolation | `accepted_proposal` |
| Cross-table idempotency tenant scope | `accepted_proposal` |
| Raw payload / PII retention | `needs_decision` |
| Migration execution | `blocked` |
| Repository implementation | `blocked` |

## Recommended Next Task

Recommended next task: migration file proposal only after explicit PM approval.

The next task must still forbid DB execution, SQL execution, migration dry-run, migration apply, `psql`, `db:migrate`, repository implementation, provider work, admin work, AI/RAG work, billing work, broad staging, cleanup, revert, reset, and stash unless PM explicitly scopes otherwise.
