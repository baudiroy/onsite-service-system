# Engineer Mobile Read Model Schema Proposal

Status: read model schema proposal / no migration / no DB execution.

This document defines a future read-side row shape, conceptual view boundary, and query boundary for Engineer Mobile task list and task detail reads. It does not authorize migration, DDL, schema changes, DB connection, SQL execution, provider integration, UI work, or runtime writes.

## Scope

The Engineer Mobile read model is a future read-only projection for mobile workbench list/detail screens. It should provide the minimum safe data an assigned engineer needs to see their own tasks.

This proposal does not:

- modify core Case, Appointment, Customer, or Field Service Report tables
- create a migration
- create a DB view
- execute SQL
- change app/server/routes/controllers
- create a formal Field Service Report
- change appointment lifecycle behavior
- change `finalAppointmentId`
- enable provider sending or AI/RAG runtime

Future DB execution requires a separate bounded task and explicit DB/runtime authorization.

## Proposed Source Concepts

The future read model may be assembled from controlled read-side joins or projections based on:

- `cases`
- `appointments`
- dispatch assignments / engineer assignment source
- customers / masked customer contact projection
- repair intake / product issue summary
- safe appointment checklist summary
- safe evidence reference metadata

These are conceptual sources only. This proposal does not modify those core tables and does not grant permission to read unsafe raw fields.

## Proposed Read Model Fields

Common list/detail fields:

- `organization_id`
- `case_id`
- `appointment_id`
- `assigned_engineer_id`
- `scheduled_start`
- `scheduled_end`
- `status`
- `customer_name_masked`
- `customer_phone_masked`
- `address_summary`
- `product_summary`
- `issue_summary`
- `service_type`
- `service_summary`

Detail-only or richer safe fields:

- `site_note_safe`
- `checklist_summary`
- `evidence_refs`

`evidence_refs` must be metadata only. It must not contain signed URLs, object storage paths, direct file URLs, raw tokens, or customer signature raw data.

## Forbidden Fields

The Engineer Mobile read model and query output must not contain:

- `raw_phone`
- `raw_address`
- `raw_line_user_id`
- `line_user_id`
- `token`
- `secret`
- `password`
- `DATABASE_URL`
- `internal_note`
- `audit_log`
- `ai_raw_payload`
- `billing_internal`
- `settlement_internal`
- `final_appointment_id`
- `finalAppointmentId`
- `full_customer_payload`
- signed evidence URLs
- storage paths
- customer signature raw data
- billing or settlement internal rules

## Required Invariants

- Every read model row must include `organization_id`.
- Every engineer-visible task row must include `assigned_engineer_id`.
- List queries must be organization-scoped and engineer-assigned.
- Detail queries must be organization-scoped, engineer-assigned, and appointment-specific.
- `appointment_id` is required for detail query.
- Customer contact fields must be masked or summarized only.
- Address fields must be safe summaries only.
- Evidence references must be metadata-only safe references.
- The read model is read-only and must not mutate Case, Appointment, or Field Service Report data.
- Task detail is not a Field Service Report.
- Task detail route must not expose `finalAppointmentId`.
- Task list and detail responses must not expose internal notes, audit logs, billing internal data, settlement internal data, AI raw payload, or raw identity fields.
- AI may not generate or approve official task data.

## Query Boundary

Task692 list mapper/query spec and Task709 detail mapper/query spec remain the current pre-DB query boundaries.

Rules:

- query specs remain `executable:false` by default
- query specs use placeholders
- query specs must not interpolate raw values into SQL text
- query specs must not request forbidden fields
- future DB execution requires separate authorization
- shared DB and production DB access are forbidden without an explicit task
- migration apply or dry-run is forbidden without an explicit DB approval packet

## Conceptual Index Proposal

Future DB-backed read paths may need indexes or equivalent read-side support for:

- `organization_id`, `assigned_engineer_id`, `scheduled_start`
- `organization_id`, `assigned_engineer_id`, `appointment_id`
- `organization_id`, `case_id`

These are conceptual query needs only. This proposal does not create indexes or migrations.

## Mapping To Existing Tasks

- Task692: Engineer Mobile task list read model mapper and query spec.
- Task693: Engineer Mobile task list read repository with injected executor.
- Task709: Engineer Mobile task detail read model mapper and query spec.
- Task710: Engineer Mobile task detail read repository with injected executor.
- Task712: Engineer Mobile composite read repository for list/detail.
- Task713: Engineer Mobile composite read repository E2E compatibility test.

## Future Tasks

- Define executable query specs only after explicit DB/runtime approval.
- Add a DB-backed repository adapter only after a scoped task.
- Add migration or DB view design only after a separate migration task.
- Add disposable local DB dry-run only after explicit local-only approval.
- Add Engineer Mobile UI detail/list screen only under a frontend scope task.
