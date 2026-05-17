# Task 002 Core Tables Design

## Scope

This design adds the first-phase tables around the finalized `cases` v1 table:

- `customers`
- `case_attachments`
- `case_messages`
- `audit_logs`

These tables support LINE and website repair request intake, Cloudflare R2 attachment metadata, conversation history, and ISO 27001-oriented traceability. They do not implement full dispatch, on-site service, billing, or API behavior.

## Migration Order Note

`cases` references `customers(id)`, while `case_attachments` and `case_messages` reference `cases(id)`. In a fresh database baseline, create `customers` before `cases`, then create `case_attachments`, `case_messages`, and `audit_logs`. Because `001_create_cases.sql` is already finalized as a design artifact, this Task 002 migration documents the surrounding tables without refactoring `cases`.

## customers

### Purpose

`customers` stores customer master data used by repair requests from LINE, website, admin entry, or future channels. It is the current customer profile table. Historical customer data for a case should be copied only as a minimal `cases.customer_snapshot` at case creation.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `customer_name` | `text` | no | Customer display/legal name needed for repair handling. |
| `mobile` | `text` | no | Required mobile phone for contact and lookup. |
| `tel` | `text` | yes | Optional landline. |
| `line_user_id` | `text` | yes | LINE user identifier when customer enters through LINE. |
| `city` | `text` | no | City for service area and admin review. |
| `address` | `text` | no | Full address. GPS/geocoding can be added later outside first-phase input. |
| `source` | `text` | no | First or primary source channel for the customer record. |
| `metadata` | `jsonb` | yes | Low-risk channel or migration metadata. Must not hide formal customer fields. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `cases.customer_id` references `customers.id`.
- `cases.customer_snapshot` may store a minimal point-in-time copy of `customer_name`, `mobile`, `tel`, `city`, and `address`.

### What Should Not Be Placed In `customers`

- Repair request details such as brand, model, product type, problem description, case status, or priority.
- Attachments, photos, R2 object keys, or OCR outputs.
- Message history or AI conversation logs.
- Full dispatch, field service, or billing details.

### Future Extension Notes

Customer deduplication, consent records, address geocoding, and multiple address support can be added later through dedicated tables. Do not turn `customers` into a CRM table in phase 1.

## case_attachments

### Purpose

`case_attachments` stores metadata for files uploaded or generated during a case. Files live in Cloudflare R2 or another future object storage provider; PostgreSQL stores metadata, OCR status, and AI extraction results only.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `case_id` | `uuid` | no | Links the attachment to `cases`. |
| `attachment_type` | `text` | no | Business purpose of the file, such as fault photo, serial photo, invoice photo, completion photo, signature, or other. `completion_photo` and `signature` are phase 1.5 reservations for field service report and completion workflow support. |
| `storage_provider` | `text` | no | Object storage provider. Defaults to `cloudflare_r2`. |
| `bucket` | `text` | no | R2 bucket name or logical bucket. |
| `object_key` | `text` | no | R2 object key. This is the durable storage reference. |
| `object_version` | `text` | yes | Optional object version or ETag-like storage metadata. |
| `original_filename` | `text` | yes | Original uploaded filename for admin review. |
| `content_type` | `text` | yes | MIME type. |
| `byte_size` | `bigint` | yes | File size, if known. |
| `checksum_sha256` | `text` | yes | Optional integrity check value. |
| `uploaded_by_type` | `text` | no | Actor type that uploaded the file. |
| `uploaded_by_id` | `uuid` | yes | Optional actor id where the actor has a UUID. |
| `source_channel` | `text` | no | Upload channel, such as LINE, website, admin, or future channel. |
| `ocr_status` | `text` | no | OCR lifecycle state. |
| `ai_extraction_result` | `jsonb` | yes | Structured OCR or AI extraction result, such as serial number or invoice date candidates. |
| `ai_extraction_confidence` | `numeric(5,4)` | yes | Advisory confidence score from AI extraction. |
| `last_signed_url_issued_at` | `timestamptz` | yes | Last time a signed URL was issued. |
| `last_signed_url_expires_at` | `timestamptz` | yes | Expiry time for the last signed URL. |
| `metadata` | `jsonb` | yes | Low-risk storage metadata or migration data. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `case_attachments.case_id` references `cases.id`.
- `case_messages.attachment_id` may reference `case_attachments.id` when a message points to an uploaded image, file, audio, or video.
- The migration uses a composite foreign key on `(attachment_id, case_id)` so messages can only reference attachments from the same case.

### What Should Not Be Placed In `case_attachments`

- File binary content.
- Permanent public URLs as the only access mechanism.
- Full conversation text.
- Case master data such as status, priority, customer profile, or product fields.
- Final field service report details or billing evidence beyond first-phase attachment metadata.

### Future Extension Notes

Cloudflare R2 remains the phase 1 storage target. Future storage providers can be represented through `storage_provider`. Signed URLs should be generated by the backend when needed; this table only tracks lifecycle metadata and durable object references.

`completion_photo` and `signature` attachment types are reserved for phase 1.5 field service report and completion workflow support. They do not mean phase 1 implements full on-site service records; those details should move to future `field_service_reports` and related tables.

## case_messages

### Purpose

`case_messages` stores conversation and event history for a case across LINE, website, admin, API, and reserved future channels. It supports customer, AI, admin, system, and future engineer messages without storing attachments directly.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `case_id` | `uuid` | no | Links message to `cases`. |
| `attachment_id` | `uuid` | yes | Optional reference to `case_attachments` for media/file messages. |
| `sender_type` | `text` | no | Message sender category. |
| `sender_id` | `uuid` | yes | Optional internal sender id. |
| `sender_display_name` | `text` | yes | Display name for external or system senders. |
| `channel` | `text` | no | Channel where the message occurred. |
| `message_type` | `text` | no | Message format or system event marker. |
| `body_text` | `text` | yes | Text content for text or event messages. |
| `external_message_id` | `text` | yes | LINE, website, email, or provider message id for deduplication and traceability. |
| `raw_payload` | `jsonb` | yes | Minimal provider payload needed for debugging or replay. Avoid excessive sensitive data. |
| `metadata` | `jsonb` | yes | Low-risk message metadata. |
| `created_at` | `timestamptz` | no | Message creation timestamp. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker for moderation or retention policy. |

### Relationships

- `case_messages.case_id` references `cases.id`.
- `case_messages.attachment_id` optionally references `case_attachments.id`.
- When `attachment_id` is present, the referenced attachment must belong to the same `case_id`.

### What Should Not Be Placed In `case_messages`

- Attachment binary content.
- Durable R2 object metadata when it belongs in `case_attachments`.
- Case status, warranty status, priority, or product master fields.
- Full AI vendor logs, prompt traces, or token usage. Use future `ai_logs` for vendor usage logging.

### Future Extension Notes

Future AI provider logs, token usage, prompt templates, and model traces should move to `ai_logs`. Engineer communication can use `sender_type = 'engineer'`, but full engineer on-site reports belong in future field service tables.

## audit_logs

### Purpose

`audit_logs` stores immutable audit events for traceability. It supports changes to cases, customers, attachments, messages, and future entities while keeping sensitive data minimized or masked.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `actor_type` | `text` | no | Actor category, such as customer, admin, AI, system, engineer, or API. |
| `actor_id` | `uuid` | yes | Optional actor id when available. |
| `actor_display_name` | `text` | yes | Optional human-readable actor label. |
| `action` | `text` | no | Auditable action name. |
| `entity_type` | `text` | no | Entity affected by the event. |
| `entity_id` | `uuid` | no | UUID of the affected entity. |
| `before_data` | `jsonb` | yes | Minimal masked pre-change data. |
| `after_data` | `jsonb` | yes | Minimal masked post-change data. |
| `ip_address` | `inet` | yes | Request IP where available. |
| `user_agent` | `text` | yes | Request user agent where available. |
| `metadata` | `jsonb` | yes | Low-risk trace metadata. |
| `created_at` | `timestamptz` | no | Audit event creation timestamp. |

### Relationships

- `audit_logs.entity_type` and `audit_logs.entity_id` form a polymorphic reference to entities such as `cases`, `customers`, `case_attachments`, and `case_messages`.
- No foreign key is used for `entity_id` because the table must support multiple entity types and future modules.

### What Should Not Be Placed In `audit_logs`

- Full unmasked sensitive data, full files, or complete message payloads.
- Operational workflow state that belongs in the source table.
- Large AI prompts, raw vendor responses, or token-level logs.

### Future Extension Notes

Audit events should be append-only from application behavior. Updates to audit rows should be avoided except by controlled retention or masking jobs. As the system grows, additional entity types can be accepted without changing the core table shape.

## Future Enhancement Roadmap

These notes are future enhancements only. They should not change the phase 1 schema or turn the first release into a CRM, workflow engine, AI runtime store, or document retention system.

### Customer Deduplication Strategy

Future customer identity work may need normalized mobile numbers, normalized addresses, duplicate merge workflows, and customer identity resolution. Phase 1 should not implement CRM-grade deduplication.

### Customer Multiple Addresses

Future versions may add a `customer_addresses` table to support address types such as home, billing, installation, and office. Phase 1 keeps a single `customers.address` field.

### Attachment Malware Scanning

Future attachment handling should support antivirus scans, malware quarantine, file validation pipelines, and MIME verification before files are trusted by admin or downstream workflows.

### Attachment OCR Job Table

Future OCR processing should not rely only on fields in `case_attachments`. A future `attachment_processing_jobs` table can support queues, retries, async workers, and failure reasons.

### Signed URL Policy

Future signed URLs should be short-lived, dynamically issued by the backend, and auditable. Access audit records may be added when attachment access control becomes more mature.

### Message Threading

Future `case_messages` may need `parent_message_id`, `thread_id`, or reply-chain support. Phase 1 keeps conversation history linear.

### Message Direction

Future `case_messages` may need `message_direction` with values such as incoming, outgoing, and system. This can support customer service conversation ordering, message statistics, reply SLA, and notification records. Phase 1 keeps the existing `sender_type`, `channel`, and `message_type` design.

### AI Conversation Separation

Future AI runtime concerns should move into dedicated tables such as `ai_logs`, `ai_conversations`, and `ai_tool_calls`. `case_messages` should not take on full AI provider logging, prompt tracing, tool call, or token usage responsibilities.

### Audit Log Masking Policy

Future audit work should define a PII masking policy, retention policy, encryption strategy, and export policy. Audit logs should keep sensitive data minimized.

### Immutable Audit Strategy

Future `audit_logs` behavior should be append-only. Updates should be avoided except controlled retention, masking, or purge jobs.

### Attachment Lifecycle Retention

Future attachment governance should support retention policies, legal hold, archive tiers, and purge strategies.

### Attachment Visibility

Future `case_attachments` may need `attachment_visibility` with values such as customer_visible, engineer_only, internal_only, and billing_only. This can control which roles may view which files. Phase 1 keeps the current attachment metadata design and should not turn attachment metadata into a full access-control system.

### Event Sourcing Consideration

If future workflows become complex, the system may consider event tables such as `case_events`, `dispatch_events`, and `service_events`. Phase 1 should not adopt event sourcing.

### Message Search Optimization

If message volume grows, search may evolve toward trigram indexes, Elasticsearch/OpenSearch, or vector search. PostgreSQL remains sufficient for phase 1.
