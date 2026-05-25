# Future Operations & Risk Control Extensions

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

The platform should preserve room for operations and risk-control capabilities without implementing them prematurely. These features should reduce service delay, billing disputes, missing evidence, complaint risk, repeat dispatch, and operational blind spots.

Future data models and workflow design must not block these extensions.

## 1. SLA / Service Timeliness

Track response, dispatch, visit, quote, parts, follow-up, complaint, LINE binding, and survey timing.

Possible fields include response_due_at, dispatch_due_at, visit_due_at, follow_up_due_at, quote_due_at, parts_due_at, sla_status, sla_breach_at, escalation_level, escalation_reason, and assigned_owner_id.

Rules should vary by case type, brand, vendor, customer tier, warranty, and contract. AI may flag risk but must not close or change formal case state.

## 2. Customer Approval Records

Customer fee approvals should be structured records, not notes. Applicable scenarios include floor/carrying fee, remote area fee, route surcharge, installation add-on, extra construction, on-site purchase, high-value repair quote, out-of-warranty fee, and second-visit fee.

Future records may track case, appointment, report, billing item, quote, approval type/status/amount/channel, approved_by_customer, evidence attachment, created_by, and note.

AI may remind missing approvals but must not approve for customers.

## 3. Parts Reservation / Vehicle Stock / Pending Parts

Support required parts estimates, reservations, engineer vehicle stock, warehouse stock, and pending parts tracking. Parts data impacts first-time fix rate, dispatch suggestion, engineer efficiency, and settlement evidence.

AI may suggest likely parts from history and RAG, but official inventory, reservation, and cost must remain deterministic and auditable.

## 4. Quote Approval

pending_quote should become a formal quote flow: draft -> review -> customer confirmation by allowed channel -> approval leads to appointment/continued work -> rejection records reason and next handling.

Quote amounts should connect to billing items and settlement rules. AI may draft explanations and check missing photos/serials, but must not approve official quote.

## 5. Customer Feedback / Quality Follow-up

Post-completion quality follow-up should support satisfaction survey, low-score escalation, complaint summary, repeat-repair supervisor follow-up, and brand/vendor quality reports.

Feedback should not live in service report internal note. AI may summarize and flag risk, but must not close complaints or hide negative feedback.

## 6. Case Type Checklist

Checklists should be short and necessary, varying by case_type/product_type. They may cover cooling test, photos, replaced parts, drainage, fixed installation, operation test, signature, arrival proof, contact record, or reschedule need.

AI may detect missing evidence, but checklist must not overburden engineers.

## 7. Exception Review

High-value quote, repeat repair, complaint, unable-to-repair, engineer anomaly, settlement anomaly, customer fee disagreement, unclear second-dispatch reason, missing photo/signature/serial may require supervisor review.

Exception review must be auditable. AI may flag review need but must not approve supervisor review.

## 8. Role-specific Dashboards

Future dashboards should be role-specific:

- customer service: contact, missing data, customer confirmation, LINE binding, upcoming overdue
- dispatch: scheduling, second dispatch, pending parts, route, unconfirmed appointment
- engineer: today, next stop, completion report, missing photo/signature
- supervisor: overdue, complaint risk, repeat dispatch, engineer anomaly, high-value quote, review queue
- finance: reconciliation, missing evidence, amount anomaly, vendor rules, billable/non-billable

Dashboards must obey role permission and organization scope. AI may rank and summarize but not bypass permission.

## 9. LINE Self-service Case Inquiry

After LINE binding, customers may query case progress, appointment time, appointment confirmation/change, upload photos, approve quotes, view completion summary, and answer survey.

Customer-visible data must be simplified and must not expose internal notes, audit logs, internal billing, engineer internal comments, or AI raw payload.

## 10. AI Risk Radar

AI may flag complaint risk, repeat dispatch risk, parts shortage, overdue, settlement anomaly, review need, missing evidence, long pending parts, on-site add-on without approval, high-value quote without review, and repeated inquiry without binding.

AI risk flags are suggestions that humans can confirm, ignore, or mark handled. AI must not change formal states, decide amounts, approve review, or send sensitive notifications.

## Recommended Priority

1. SLA / overdue reminder
2. customer approval records
3. parts reservation / pending parts
4. quote approval
5. quality follow-up / complaint risk
6. exception review
7. role dashboards
8. LINE self-service inquiry
9. AI risk radar
10. checklist

## Future Tasks

- SLA rule design
- approval record schema
- parts reservation design
- quote workflow design
- feedback/survey model
- checklist template model
- exception review workflow
- role dashboard permissions
- customer self-service policy
- AI risk flag review workflow
