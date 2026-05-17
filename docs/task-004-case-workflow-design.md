# Task 004 Case Workflow Design

## Scope

This document defines the phase 1 case workflow and status transition rules for the finalized `cases` v1 schema and the surrounding Task 002 and Task 003 tables.

It does not change existing schemas, implement APIs, implement a complete dispatch workflow, implement engineer on-site service, or implement billing reconciliation.

## Case Status Definitions

| Status | Purpose |
|---|---|
| `draft` | Case has been started but required intake data may be incomplete. Used during initial LINE, website, admin, or system-created intake. |
| `pending_customer` | System needs additional customer input, such as missing product data, photos, serial number evidence, invoice evidence, or contact/address confirmation. |
| `submitted` | Customer-provided intake is complete enough for admin review. The case has a case number and is ready for the backend queue. |
| `reviewing` | Admin, customer service, or dispatch manager is actively reviewing the submitted case. |
| `accepted` | Case has been accepted for service handling. This is a human-controlled phase 1 decision. |
| `rejected` | Case has been rejected after review, with reason stored in messages or audit context. |
| `cancelled` | Case was cancelled by customer, admin, or system policy before completion. |
| `dispatch_pending` | Accepted case is ready for dispatch preparation. Phase 1 may preview dispatch unit; full dispatch workflow is still future scope. |
| `assigned` | Reserved for phase 2. A dispatch record or engineer assignment exists. |
| `scheduled` | Reserved for phase 2. A visit schedule has been confirmed. |
| `on_site` | Reserved for phase 2. Engineer is currently performing on-site service. |
| `completed` | Reserved for phase 2. On-site service work is completed. |
| `closed` | Reserved for phase 2. Operational and billing closure is complete. |

## Phase 1 Status Transition Rules

| from_status | to_status | allowed_actor | required_permission | trigger | required_fields | audit_required | notes |
|---|---|---|---|---|---|---:|---|
| `draft` | `pending_customer` | `customer`, `ai`, `customer_service`, `system` | `cases.update` for backend users; customer/system intake may use channel authorization | Required data is missing after initial intake | `customer_id` if known, partial repair data, missing-field list in message or metadata | yes | AI may guide the customer but should not hide required fields. |
| `draft` | `submitted` | `customer`, `customer_service`, `system` | `cases.create` or `cases.update` | All submission requirements are satisfied during first intake | See submitted validation section | yes | Website or LINE may create and submit in one flow. |
| `pending_customer` | `submitted` | `customer`, `customer_service`, `system` | `cases.update` | Customer provides missing required information | See submitted validation section | yes | OCR pending can be acceptable for serial/invoice fields when photo evidence exists. |
| `submitted` | `reviewing` | `admin`, `customer_service`, `dispatch_manager`, `system` | `cases.review` | Backend user opens or claims the case for review; system may auto-mark review queue entry | Submitted case exists, not deleted, not cancelled | yes | This marks active review, not acceptance. |
| `reviewing` | `accepted` | `admin`, `customer_service`, `dispatch_manager` | `cases.accept` | Human accepts service request | Reviewed case, sufficient contact/address/product/fault data, rejection/cancellation not already applied | yes | AI cannot make final acceptance. |
| `reviewing` | `rejected` | `admin`, `customer_service`, `dispatch_manager` | `cases.reject` | Human rejects case | Reviewed case and rejection reason in `case_messages` or audit `metadata` | yes | AI may suggest rejection reasons but cannot make final rejection. |
| `submitted` | `cancelled` | `customer`, `customer_service`, `admin`, `system` | `cases.cancel` for backend users; customer cancellation uses channel authorization | Customer cancels before active review, or system policy cancels duplicate/spam case | Case not already accepted, completed, or closed | yes | Cancellation reason should be recorded in message or audit metadata. |
| `reviewing` | `cancelled` | `customer_service`, `admin`, `system` | `cases.cancel` | Customer cancels during review, or admin cancels because case should not proceed | Case not accepted, completed, or closed; cancellation reason | yes | Prefer `rejected` when the business rejects service; use `cancelled` for withdrawal or administrative cancellation. |
| `accepted` | `dispatch_pending` | `dispatch_manager`, `admin`, `system` | `cases.update` and optionally `dispatch_units.manage` when assigning dispatch preview | Accepted case moves to dispatch preparation | `accepted_at`, dispatch preview may be present but is not mandatory | yes | Phase 1 stops at dispatch preparation; no full dispatch history is created. |

## Reserved Phase 2 Status Transitions

| from_status | to_status | allowed_actor | required_permission | trigger | required_fields | audit_required | notes |
|---|---|---|---|---|---|---:|---|
| `dispatch_pending` | `assigned` | `dispatch_manager`, `admin`, `system` | future dispatch permission | Dispatch record or engineer assignment created | future `dispatches` record | yes | Reserved only. Do not implement full dispatch in phase 1. |
| `assigned` | `scheduled` | `dispatch_manager`, `engineer`, `admin`, `system` | future schedule permission | Visit schedule confirmed | future schedule fields | yes | Reserved only. |
| `scheduled` | `on_site` | `engineer`, `dispatch_manager`, `system` | future field service permission | Engineer starts on-site work | future field service context | yes | Reserved only. |
| `on_site` | `completed` | `engineer`, `dispatch_manager`, `admin` | future field service permission | Engineer completes work | future service report | yes | Reserved only. |
| `completed` | `closed` | `admin`, `dispatch_manager`, `system` | future closure/billing permission | Operational and billing closure finished | future billing/service records | yes | Reserved only. |

## Role And Permission Matrix

| Role | Create case | View case | Update case | Review case | Accept case | Reject case | Cancel case | Change dispatch unit | View attachments | View audit_logs | Manage users / roles / permissions |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `admin` | yes, `cases.create` | yes, `cases.read` | yes, `cases.update` | yes, `cases.review` | yes, `cases.accept` | yes, `cases.reject` | yes, `cases.cancel` | yes, `dispatch_units.manage` | yes, `attachments.read` | yes, `audit_logs.read` | yes, `users.manage`, `roles.manage`, `permissions.manage` |
| `customer_service` | yes, `cases.create` | yes, `cases.read` | yes, `cases.update` | yes, `cases.review` | yes, `cases.accept` if policy allows | yes, `cases.reject` if policy allows | yes, `cases.cancel` | limited, `cases.update`; final unit changes may require dispatch manager | yes, `attachments.read` | no by default | no |
| `dispatch_manager` | no by default | yes, `cases.read` | limited, `cases.update` | yes, `cases.review` | yes, `cases.accept` if dispatch review is part of policy | yes, `cases.reject` if dispatch issue prevents service | yes, `cases.cancel` if operationally required | yes, `dispatch_units.manage` | yes, `attachments.read` | limited or no by default | no |
| `engineer` | no | limited future visibility | no in phase 1 | no | no | no | no | no | limited future visibility | no | no |
| `auditor` | no | yes, `cases.read` | no | no | no | no | no | no | yes, `attachments.read` if audit policy allows | yes, `audit_logs.read` | no |
| `system` | yes, `cases.create` | yes, service account only | yes, service account only | yes, system queue movement only | no final human decision | no final human decision | yes, policy automation only | yes, rule result writeback only | yes, controlled service account | yes, append-only write | no direct human admin action |
| `ai` | no direct database ownership | no direct unrestricted access | suggestions only | suggestions only | no | no | no | suggest only | process allowed attachments only | no direct audit read | no |

Suggested permission keys that extend Task 003 examples:

- `cases.create`
- `cases.cancel`
- `cases.reject`
- `roles.manage`
- `permissions.manage`

These are permission definitions only. They do not require schema changes beyond the existing `permissions` table.

## AI Workflow Boundary

AI may:

- Guide customers to provide required repair request data.
- Generate or refresh `cases.ai_summary`.
- Generate `cases.ai_classification`.
- Suggest `cases.ai_suggested_dispatch_unit_id`.
- Assist OCR recognition for `serial_no` and `invoice_date` from `serial_photo` and `invoice_photo`.
- Suggest possible status transitions for human review.
- Produce low-confidence warnings or missing-data suggestions.

AI must not directly:

- Make final `accepted` decisions.
- Make final `rejected` decisions.
- Delete cases or attachments.
- Modify users, roles, permissions, or role assignments.
- Approve billing, settlements, claims, or reconciliation.
- Override manual dispatch or human review decisions.
- Treat `ai_confidence` as the only decision basis.

## Audit Strategy

The following actions must write `audit_logs`:

| Action | entity_type | entity_id | before_data / after_data guidance |
|---|---|---|---|
| Case created | `case` | `cases.id` | Store minimal created case fields and source. |
| Important case field changed | `case` | `cases.id` | Include masked/minimized changed fields only. |
| Case status changed | `case` | `cases.id` | Include old/new status and actor. |
| AI suggested dispatch unit | `case` | `cases.id` | Include suggested dispatch unit id and confidence/context. |
| Human overrides AI suggestion | `case` | `cases.id` | Include AI suggestion, final dispatch unit, and actor. |
| Customer data changed | `customer` | `customers.id` | Mask PII where possible; log field names and minimal before/after. |
| Attachment added | `attachment` | `case_attachments.id` | Include attachment type, storage provider, bucket/object key metadata if allowed. |
| Attachment deleted or soft-deleted | `attachment` | `case_attachments.id` | Include attachment id, case id, type, and actor. |
| Role assigned or revoked | `user` | `users.id` | Include role id and assignment/revocation timestamps. |
| Permission granted or revoked | `role` | `roles.id` | Include permission id and grant/revocation timestamps. |
| User login failed | `user` or `system` | user id if known; otherwise system event id | Include actor identifier, IP, user agent, and reason category. |
| User disabled | `user` | `users.id` | Include status change and actor. |

Audit log data should be minimized, masked where needed, and treated as append-only from application behavior.

## Required Fields Validation Before Submitted

A case may move from `draft` or `pending_customer` to `submitted` only when the system can validate enough data for admin review.

Required case fields:

- `customer_id`
- `brand`
- `case_type`
- `product_type`
- `model_no`
- `problem_description`, nonblank

Required customer/contact data:

- Customer must have at least one usable contact method.
- Preferred phase 1 contact rule: `customers.mobile` is required by schema.
- `customers.tel` may supplement but should not replace mobile unless the business explicitly changes policy later.
- `customers.city`
- `customers.address`

Preferred visit time:

- Recommendation: `preferred_visit_time` should be optional for phase 1 submission.
- If present, it helps triage and future scheduling.
- If absent, admin/customer service can collect it later during review.
- Future time-window support can use `preferred_visit_start` and `preferred_visit_end`.

Serial number:

- `serial_no` is preferred before submission.
- If `serial_no` is missing, submission may still be allowed when a `serial_photo` attachment exists and OCR is pending or manual review is expected.
- If neither `serial_no` nor serial evidence exists, the case should remain `pending_customer` unless admin policy allows exception.

Invoice date:

- `invoice_date` is preferred when warranty review matters.
- If `invoice_date` is missing, submission may still be allowed when an `invoice_photo` exists and OCR is pending or manual review is expected.
- If no invoice evidence exists, `warranty_status` should normally remain `unknown` or `pending_review`.

Attachments:

- `fault_photo` is recommended but not always mandatory, depending on product category and channel.
- Attachment upload failure should not corrupt case creation; keep the case `draft` or `pending_customer` and record a message/audit event.

## Dispatch Preview Workflow

Phase 1 dispatch behavior is preview-only. It can prepare cases for future dispatch without creating full dispatch history.

1. Rule engine evaluates first using available fields:
   - `service_region`
   - `city`
   - `product_type`
   - `case_type`
   - `warranty_status`
   - enabled `dispatch_units`
   - `dispatch_units.product_types`
   - `dispatch_units.routing_rules`

2. If the rule engine finds a confident match:
   - Set `cases.dispatch_unit_id`.
   - Set `cases.dispatch_assignment_source = 'rule'`.
   - Write audit log.

3. AI may provide auxiliary suggestion:
   - Set or update `cases.ai_suggested_dispatch_unit_id`.
   - AI suggestion should include explanation in audit metadata or case message summary.
   - AI suggestion does not equal final dispatch unit.

4. Human override is always allowed for authorized users:
   - Set `cases.dispatch_unit_id`.
   - Set `cases.dispatch_assignment_source = 'manual'`.
   - Write audit log with previous rule/AI suggestion and final human choice.

5. If no usable dispatch unit exists:
   - Keep case at `accepted` or `dispatch_pending` depending on admin queue policy.
   - Add admin-facing note in `case_messages`.
   - Write audit log or system event.

## Error And Exception Flows

| Scenario | Recommended handling | Status impact | Audit/message guidance |
|---|---|---|---|
| Insufficient data | Ask customer for missing fields through LINE/website/admin message. | `draft` -> `pending_customer`, or remain `pending_customer` | Message required; audit when status changes. |
| OCR failed | Mark attachment OCR status as `failed` or `manual_review`; request clearer photo or admin review. | Usually remain `pending_customer` or `submitted` if evidence exists | Message and attachment audit recommended. |
| Customer cancels | Confirm cancellation request and reason when possible. | `submitted`/`reviewing` -> `cancelled` | Audit required. |
| Duplicate case | Do not hard-delete. Mark duplicate in message/audit metadata; admin may cancel duplicate. | Usually `submitted`/`reviewing` -> `cancelled` | Audit required; future duplicate-link field may be added. |
| Attachment upload failed | Preserve case intake state; ask retry or allow admin upload. | Usually `draft` or `pending_customer` | Message required; audit if attachment metadata was created/deleted. |
| AI confidence insufficient | Treat AI output as advisory; route to manual review. | No automatic final status change | Audit AI suggestion if written to case. |
| No available dispatch unit | Keep for manual dispatch review. | `accepted` or `dispatch_pending` | Message or audit note required. |

## Customer Case Inquiry Flow

Customer case inquiry lets customers check their own case status through safe, minimal, customer-visible responses. It must not expose internal workflow, AI internals, dispatch rules, audit data, or billing data.

### Inquiry Entry Points

Phase 1 inquiry channels:

- LINE Official Account.
- Website inquiry page.

Future channels:

- Phone customer service.
- Email.
- WhatsApp.

### Inquiry Verification

Recommended phase 1 verification methods:

- `case_no` + `mobile`.
- LINE `userId` + `case_no`.

Rules:

- Never allow lookup by `case_no` alone.
- Never allow a customer to view a case that does not belong to them.
- Failed lookup responses must not reveal whether the case exists.
- LINE `userId` can be used as auxiliary verification, but it must not be treated as the only permanent identity proof.
- Mobile display should be masked in customer-facing responses, such as `0912****678`.

### Customer Visible Fields

Customers may see only:

- Case number.
- Customer-visible status.
- Created time.
- Product brand.
- Product type.
- Model number.
- Fault summary.
- Preferred visit time.
- Scheduled visit time, future.
- Engineer visit status, future.
- Missing-information or supplement-needed hints.

Customers must not see:

- Internal notes.
- Raw AI analysis.
- `ai_confidence`.
- Raw `ai_classification`.
- `audit_logs`.
- Permission or role data.
- Internal dispatch rules.
- Manufacturer, settlement, or billing data.

### Internal Status To Customer Visible Status Mapping

Internal status must not be directly exposed to customers. Responses must use a customer-visible mapping layer.

| Internal status | Customer visible status |
|---|---|
| `draft` | 資料填寫中 |
| `pending_customer` | 等待補件 |
| `submitted` | 案件已送出 |
| `reviewing` | 案件審核中 |
| `accepted` | 已受理 |
| `dispatch_pending` | 安排派工中 |
| `assigned` | 已指派工程師 |
| `scheduled` | 已預約到府 |
| `on_site` | 工程師處理中 |
| `completed` | 服務已完成 |
| `closed` | 案件已結案 |
| `rejected` | 案件未受理 |
| `cancelled` | 案件已取消 |

### Inquiry Flow

```text
Customer enters inquiry
↓
Verify identity using case_no + mobile or LINE userId + case_no
↓
Query cases and related customer ownership data
↓
Apply customer-visible status mapping
↓
Filter response to customer-visible fields only
↓
Reply through LINE or website page
↓
Record customer inquiry event in case_messages or audit_logs
```

### AI Role In Inquiry

AI may:

- Guide customers to enter case number or mobile.
- Explain the current customer-visible status.
- Remind customers when additional information is needed.
- Help transfer the customer to human customer service.

AI must not:

- Display internal data.
- Guess unconfirmed dispatch results.
- Promise a visit time.
- Display audit logs.
- Modify case status.
- Reveal whether a failed lookup matched an existing case.

### Inquiry Event Recording

Record in `case_messages`:

- Customer asks to query a case.
- System replies with a customer-visible result.
- Customer asks to supplement data.
- Customer asks to transfer to human customer service.

Record in `audit_logs`:

- Excessive failed inquiry attempts.
- Suspected non-owner inquiry.
- Customer data verification failure.
- Permission anomaly.
- Inquiry involving sensitive data masking.

### Inquiry Errors And Exceptions

| Scenario | Customer-facing response | Internal handling |
|---|---|---|
| `case_no` does not exist | Use a generic failed-verification message. Do not reveal existence. | Record failed inquiry if repeated or suspicious. |
| `mobile` does not match | Use a generic failed-verification message. | Record verification failure when rate or pattern is risky. |
| LINE `userId` does not match | Use a generic failed-verification message or ask for mobile verification. | Treat as failed verification; do not disclose ownership details. |
| Case is deleted or archived | Use generic unavailable/verification-failed message. | Record audit if the request is suspicious or repeated. |
| Too many inquiry attempts | Temporarily block or require human support. | Record audit log with IP/user agent/channel metadata if available. |
| System maintenance | Show a neutral maintenance message and suggest retry later. | No case data disclosure. |
| AI cannot understand request | Ask for case number/mobile again or transfer to human support. | Record message if linked to a verified case. |

### Future Inquiry Tables

Do not add tables for phase 1. The application layer can produce the customer-visible inquiry view from `cases`, `customers`, `case_messages`, and `case_attachments`.

Future tables to consider only if inquiry volume, audit needs, or public view complexity grows:

- `customer_case_views`.
- `customer_inquiry_logs`.
- `public_status_mappings`.

Public Inquiry Token:

- Future inquiry may support secure customer tracking links such as `/track/{token}`.
- Tokens must be short-lived or revocable.
- Tokens must not expose `case_id` directly.
- Token access must be limited to customer-visible fields.
- Token access should be recorded in `audit_logs` or a future inquiry log.
- Phase 1 should not implement public inquiry tokens; continue using `case_no` + `mobile` or LINE `userId` + `case_no`.

### Inquiry Security Principles

- Customers can only query their own cases.
- Query results must follow minimum disclosure.
- Mobile numbers must be masked in customer-facing output.
- Failed query messages must not reveal whether a case exists.
- Query behavior must be auditable.
- LINE `userId` is auxiliary verification, not the only permanent identity basis.

## Future Extension Notes

Record these as future enhancements only:

- `case_status_history` for durable status timelines.
- Workflow engine for configurable transitions and guards.
- SLA policy for urgency, service region, warranty, and product-specific deadlines.
- Appointment Workflow for requested, confirmed, rescheduled, and cancelled appointments. Full records should live in future `appointments`.
- Engineer Assignment Workflow for assigning and changing engineers. Full history should live in future `dispatches` or `dispatch_assignments`.
- Field Service Report Workflow for on-site notes, work performed, parts, photos, and signatures. Records should live in future `field_service_reports`.
- Completion Workflow for completion confirmation and disputes. `cases.completion_status` may remain only a summary.
- Customer Satisfaction Workflow for post-service feedback and ratings.
- Quote Workflow for repair quotations. Records should live in future `quotes` and `quote_items`.
- Billing / Settlement Workflow for manufacturer claims, engineer/vendor settlement, and reconciliation. Records should live in future `billing_records` and `settlements`.
- Notification Workflow for LINE, SMS, email, push, and escalation messages. Records and preferences should live in future `notification_logs` and `notification_preferences`.
- SLA / Escalation Workflow for overdue, VIP, no-dispatch, and complaint escalation.
- `dispatches` table for real dispatch assignment history.
- `field_service_reports` for engineer on-site reports.
- `billing_records` for billing and reconciliation workflow.
- `ai_logs` for prompt, model, tool call, confidence, token, and vendor traceability.
- Notification system for LINE, email, SMS, admin alerts, and escalation.

These workflows are not phase 1 implementation scope. Phase 1 schema and workflow should preserve extension paths without making `cases` a giant table: appointments belong in `appointments`; engineer dispatch history belongs in `dispatches` or `dispatch_assignments`; on-site records belong in `field_service_reports`; quotes belong in `quotes` and `quote_items`; billing belongs in `billing_records` and `settlements`; notifications belong in `notification_logs` and `notification_preferences`.

## Small Schema Suggestions For Later

No immediate schema change is required for Task 004.

Potential small future additions, if workflow complexity grows:

- `case_status_history` to avoid relying only on `audit_logs` for status timeline reporting.
- `cases.cancelled_reason` or structured cancellation reason table if cancellation reporting becomes frequent.
- `cases.rejected_reason` or structured rejection reason table if rejection analytics becomes important.
- `duplicate_of_case_id` if duplicate handling becomes common.

## Future Workflow Roadmap

These notes are future enhancements only. They should not change the phase 1 workflow or introduce a workflow engine, notification engine, analytics system, or event-sourcing model too early.

### Workflow Engine Abstraction

Future workflow may be abstracted into `workflow_definitions`, `workflow_transitions`, `transition_guards`, and `transition_actions`. Phase 1 does not need a workflow engine.

### Installation And Repair Workflow Boundary

Installation service and repair service should not be treated as two independent platform systems. They share the same underlying case lifecycle:

- Repair request and case creation.
- Dispatch workflow.
- Appointment workflow.
- Engineer on-site workflow.
- Completion workflow.
- Settlement workflow.
- Customer inquiry workflow.
- Audit workflow.

Use `cases.case_type` to branch the engineer-facing UI and on-site form behavior:

- `case_type = 'installation'` should show installation checklists.
- `case_type = 'repair'` should show repair diagnostics and parts replacement forms.

The underlying data model should remain shared as much as possible:

- `field_service_reports`
- `service_parts`
- `case_attachments`
- `customer_signatures`
- `billing_records`

Do not split too early into `installation_reports` and `repair_reports`. Only introduce separate report tables if future field differences become large enough that a shared field service model is no longer maintainable.

Case type should influence:

- Engineer task content.
- Required fields.
- Checklist.
- Service result template.
- Photo requirements.
- Whether parts fields are enabled.

Repair intake, dispatch, settlement, inquiry, and audit logic should remain shared first. The architecture principle is:

```text
Shared Field Service Workflow
+
Case-Type Specific Engineer UI
```

### SLA Policy Engine

Future SLA policy may calculate deadlines and escalations dynamically from `case_type`, `product_type`, `warranty_status`, `service_region`, and `priority`.

### Notification Orchestration

Future notification orchestration may support LINE notifications, SMS, email, push notifications, and escalation rules. Notification logic should not be embedded directly into workflow definitions.

### Workflow Idempotency

Future APIs must prevent duplicated transitions, repeated submit actions, and race conditions.

### Concurrency Handling

Future review and acceptance flows may need optimistic locking or version control to prevent conflicting updates.

### Duplicate Case Detection Engine

Future duplicate detection may use duplicate scoring, fuzzy matching, or AI duplicate detection. Phase 1 keeps duplicate handling as human review.

### Customer Visible Content Policy

Future customer-visible statuses and messages may need localization, template management, and tone policy.

### AI Policy Layer

Future AI behavior should include policy enforcement, hallucination guards, confidence thresholds, and escalation strategy.

### Workflow Analytics

Future analytics may include status duration, conversion rate, rejection reason analytics, and SLA breach analytics.

### Case Aging / Queue Monitoring

Future queue monitoring should track cases that are stuck too long in key states, including `pending_customer`, `submitted`, `reviewing`, and `dispatch_pending`. It should also monitor how long it has been since the last customer message and the last internal activity.

Phase 1 can use `cases.last_customer_message_at` and `cases.last_internal_activity_at` for queue sorting and basic timeout monitoring. A complete SLA and escalation engine should remain future scope.

### Escalation Workflow

Future escalation flows may include VIP escalation, overdue escalation, no-dispatch escalation, and complaint escalation.

### Inquiry Rate Limiting

Future customer inquiry should support throttling, abuse detection, and suspicious behavior monitoring.

### Human Override Governance

Future AI suggestion overrides may capture override reason, override category, and override analytics.

### Transition Reason Normalization

Future `rejected` and `cancelled` reasons may move into structured reason tables.

### Customer Notification Mapping

Future internal transition to customer notification behavior should be separated into a notification policy layer.

### Workflow Event Stream

If future workflows become complex, the system may introduce `case_events` or `workflow_events`. Phase 1 should not adopt event sourcing.
