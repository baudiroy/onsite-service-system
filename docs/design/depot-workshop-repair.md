# Depot / Workshop Repair / 非到府維修模組

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

Depot / Workshop Repair is a second service workflow beside On-site Service. It is not a separate system. It must reuse Case, Customer, Customer Channel Identity, Contact History, Notification, File/Object Storage, Parts/Inventory, Billing/Settlement, AI governance, Audit Log, organization scope, permission, and SaaS-ready foundations.

## Workflow Difference

On-site Service is appointment-driven.

Depot / Workshop Repair is receiving / diagnosis / quote / repair / QC / return-driven.

Future `service_type` / `workflow_type` may include:

- onsite
- depot
- carry_in
- mail_in
- pickup_delivery

## Conceptual Flow

Repair Intake -> Case Created -> Repair Receiving -> Diagnosis -> Quote -> Customer Approval / Rejection -> Repair Work -> Parts Usage -> Quality Check -> Completion Notice -> Pickup / Shipping / Return -> Case Close -> Billing / Settlement

## Future Data Concepts

Future concepts may include:

- `repair_items`
- `repair_receipts`
- `repair_diagnoses`
- `repair_quotes`
- `repair_work_orders`
- `repair_parts`
- `repair_qc_checks`
- `repair_returns`

These are design concepts only and do not authorize migration, API, or runtime changes.

## Completion Boundary

Depot workflow must not break the one Case / one formal completion report principle. Future abstraction may use Service Completion Report with workflow-specific variants:

- Field Service Report for on-site service
- Workshop / Depot Repair Report for depot workflow

The same Case must not produce conflicting formal completion reports.

## Customer-facing Timeline

Customer-visible statuses may include:

- case created
- waiting for receipt
- received
- diagnosis in progress
- pending quote approval
- quote approved
- repair in progress
- quality check
- completed
- pending pickup / shipped back
- closed

Customer-facing surfaces must not show internal notes, audit logs, AI raw payload, internal costs, internal settlement rules, technician internal comments, supervisor review, or cross-organization data.

## AI Boundary

AI may help summarize intake, OCR serial/model evidence, standardize diagnosis notes, draft quotes, summarize QC, flag missing data, classify faults, and build repair knowledge.

AI must not decide warranty, approve quotes, decide formal fees, modify completion results, skip human diagnosis, close complaints, or access cross-organization data.

## Future Tasks

- service workflow abstraction
- receiving and diagnosis model
- quote approval boundary
- depot customer-facing timeline
- depot completion report design
- parts/inventory integration
- QC evidence and audit policy
