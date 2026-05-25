# Data Correction Persistence Schema Proposal

This document is a future schema proposal for Data Correction / Amendment Governance persistence.

It does not authorize a migration, does not connect to a database, and does not execute SQL. A future migration task must be separately approved before any DDL, `psql`, migration apply, local dry-run, or shared DB action.

## Purpose

Data Correction persistence should record governance decisions, manual contact requirements, dispatch notes, engineer notification intents, appointment terminal results, evidence references, follow-up drafts, and safe correction applications without silently mutating the original Case / Appointment / Field Service Report records.

The schema should preserve auditability while enforcing data minimization:

- no raw phone or full phone value storage in these tables
- no full address storage in these tables
- no raw LINE user id storage in these tables
- no token, secret, binding token, access token, channel secret, webhook secret, password, or DB URL storage
- no raw `fromValue` or `toValue` storage
- no AI raw payload storage
- no full request or response dump storage
- no table mutates Case / Appointment / Field Service Report
- no table creates a second formal Field Service Report
- no table stores or changes `finalAppointmentId`
- follow-up draft records do not create formal appointments
- appointment result records do not create Field Service Reports
- phone changes require a re-verification flow and must not be persisted as a direct overwrite record

## Common Required Fields

All proposed tables should include the safest possible subset of these common fields:

- id
- organization_id
- case_id
- appointment_id nullable only where the record can be case-level
- actor_user_id nullable for system-generated records
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Design rules:

- `organization_id` is required for every record.
- `case_id` is required for every record.
- `appointment_id` is required for appointment-scoped records.
- `record_type` stores the safe normalized writer / persistence record type.
- `safe_metadata` may contain only allow-listed non-sensitive keys.
- `occurred_at` may store the safe business-event timestamp supplied by the workflow.
- `created_at` stores when the persistence record is created.
- Raw request bodies, raw responses, raw phone, raw address, raw LINE id, raw AI payload, and raw before/after values must not be stored.

## Proposed Tables

### data_correction_audit_events

Purpose: Store safe audit events for correction decisions, denied actions, writer failures, and governance outcomes.

Common fields:

- id
- organization_id
- case_id
- appointment_id nullable
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- Audit events should describe the governance outcome, not raw sensitive values.
- Audit events must not replace the platform-wide audit log if that exists later; they can be a domain-specific audit trail.

### data_correction_contact_logs

Purpose: Store safe contact history requirements for post-departure manual handling.

Common fields:

- id
- organization_id
- case_id
- appointment_id
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- Contact logs may reference that manual customer or engineer contact is required.
- Contact logs must not store raw phone values or full call transcripts by default.

### data_correction_dispatch_notes

Purpose: Store safe dispatch notes created by correction governance, post-departure freeze, or follow-up proposal flows.

Common fields:

- id
- organization_id
- case_id
- appointment_id
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- Dispatch notes are operational notes, not silent mutation of the original dispatch payload.
- Dispatch notes must not contain internal raw payloads or full customer identity data.

### data_correction_engineer_notification_intents

Purpose: Record safe intent to notify or require engineer reconfirmation after pre-departure corrections.

Common fields:

- id
- organization_id
- case_id
- appointment_id
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- This table records an intent, not provider sending.
- It must not include LINE/SMS/App provider tokens, raw channel ids, or message payload dumps.

### data_correction_appointment_results

Purpose: Record safe unable-to-complete or non-completion appointment result decisions.

Common fields:

- id
- organization_id
- case_id
- appointment_id
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- Appointment result records may reference terminal states such as `pending_parts`, `quote_required`, `customer_not_home`, `unable_to_complete`, or `follow_up_required`.
- Appointment result records do not create Field Service Reports.
- Appointment result records do not change `finalAppointmentId`.

### data_correction_evidence_refs

Purpose: Store safe references to evidence records connected to an appointment result or correction governance event.

Common fields:

- id
- organization_id
- case_id
- appointment_id
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- Evidence records should store safe references only, not raw photos, signatures, files, or binary data.
- Files should remain in object/file storage with proper access control.

### data_correction_follow_up_drafts

Purpose: Store a draft for follow-up / second-dispatch planning after a terminal appointment result.

Common fields:

- id
- organization_id
- case_id
- appointment_id
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- Follow-up draft records are not formal appointments.
- A separate future appointment creation task must decide how a draft becomes an appointment.
- Follow-up drafts do not create a second formal Field Service Report.

### data_correction_application_records

Purpose: Store safe pre-departure correction application records for non-phone operational fields.

Common fields:

- id
- organization_id
- case_id
- appointment_id
- actor_user_id nullable
- actor_role
- action_type
- decision
- reason_code
- safe_message_key
- record_type
- occurred_at
- created_at
- safe_metadata

Rules:

- Correction application records may store safe field categories such as `fieldKey` and `fieldGroup`.
- Correction application records must not store raw `fromValue` or raw `toValue`.
- Phone identity changes are excluded and must use re-verification instead.

## Mapping to Task675 Record Types

Future persistence should map current Task675 record types to proposed conceptual tables:

- audit -> `data_correction_audit_events`
- contact_log -> `data_correction_contact_logs`
- dispatch_note -> `data_correction_dispatch_notes`
- engineer_notification_intent -> `data_correction_engineer_notification_intents`
- appointment_result -> `data_correction_appointment_results`
- evidence -> `data_correction_evidence_refs`
- follow_up_draft -> `data_correction_follow_up_drafts`
- correction_application -> `data_correction_application_records`

If future runtime table hints differ from this proposal, a bounded compatibility task should reconcile naming before any migration is authored.

## Conceptual Index Proposal

At minimum, future migration design should consider conceptual indexes for:

- organization_id, case_id
- organization_id, appointment_id
- organization_id, action_type
- organization_id, created_at

Index rules:

- Indexes must preserve organization scope.
- Indexes should support case timeline, appointment timeline, governance review, and audit search without encouraging cross-tenant queries.

## Migration Boundary

This document does not authorize migration.

A future migration task must be separate and explicitly approved. It must include:

- migration SQL
- rollback plan
- local dry-run plan if approved
- no shared DB apply unless separately approved
- no `psql` unless separately approved
- no secret logging
- no token, password, DB URL, LINE access token, or provider credential output
- static and runtime tests appropriate to the migration scope

General "continue", "go ahead", or "do next task" instructions must not be treated as migration approval.
