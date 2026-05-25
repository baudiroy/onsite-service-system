# Task457 - Engineer Mobile Workbench Status Transition and Completion Submission Boundary / No Runtime Change

## Status

Task457 is a docs-only / workflow design memo / no runtime change task.

This memo defines the Phase 1 Engineer Mobile Workbench status-operation and completion-submission boundaries. It clarifies which actions engineers can perform on mobile, which layer each action belongs to, how engineer completion input can become a Field Service Report data source, and which formal state transitions must remain system-owned or admin / dispatcher / supervisor controlled.

This task does not implement runtime, mobile web, PWA, API, route, controller, resolver, repository, status transition service, Field Service Report service changes, upload, signature capture, object/file storage, database schema, migration, fixture, test, smoke, provider sending, AI provider, RAG, or vector database behavior.

## 1. Status Layer Definitions

Engineer Mobile Workbench status operations must respect platform layers.

| Layer | Purpose | Engineer Mobile Workbench boundary |
| --- | --- | --- |
| Case | Service responsibility, customer issue, operational lifecycle, and final completion context. | Engineers do not directly create or close Cases in the normal field flow. |
| Appointment / Dispatch Visit | Per-visit schedule, arrival, work progress, visit result, no-show, pending parts, quote-needed, cancellation, or unable-to-complete outcome. | Engineer field status actions primarily belong here. |
| Field Service Report | Case-level formal completion summary used for operations, billing/settlement context, and final service record. | Engineer completion input can feed the report, but does not create multiple formal reports. |
| Service Parts | Parts usage, replacement, serials, returned parts, pending parts, and future inventory/billing evidence. | Engineer may record parts used as future field input, subject to permission and validation. |
| Photos / Signature | Evidence layer for photos, customer signature, and signature exception evidence. | Future runtime should use object/file storage references and safe metadata. |
| Completion Confirmation | Customer-facing completion report, problem reporting, survey, and customer-visible follow-up. | Not owned by engineer status actions; future customer flow is separate. |

The workbench should make the field workflow easy without collapsing these layers into one free-form status field.

## 2. Engineer-operable Statuses

Engineers may operate only field-progress and visit-outcome states for assigned or authorized appointments.

| Engineer action/status | Layer | Meaning | Boundary |
| --- | --- | --- | --- |
| Arrived / 到府 | Appointment / Dispatch Visit | Engineer has arrived at the service location. | Does not complete the Case or Field Service Report. |
| Started / 開始處理 | Appointment / Dispatch Visit | Engineer has started on-site service work. | Does not imply final repair result. |
| Completion submitted / 完工送出 | Appointment / Dispatch Visit + report source | Engineer submits field completion input. | Becomes Field Service Report source/draft data; formal completion remains backend/system controlled. |
| Unable to complete / 無法完工 | Appointment / Dispatch Visit | Visit could not be completed. | Requires reason and may trigger follow-up, review, or re-dispatch. |
| Pending parts / 待料 | Appointment / Dispatch Visit | Service cannot finish because parts are needed. | Should support pending parts tracking and future appointment planning. |
| Customer unavailable / 客戶不在 | Appointment / Dispatch Visit | Engineer could not complete because customer/on-site contact was unavailable. | Requires contact/evidence notes and should not close the Case as completed. |
| Cancellation or reschedule report / 取消或改期現場回報 | Appointment / Dispatch Visit input | Engineer reports a field condition requiring cancellation or reschedule. | Does not directly create official reschedule or new appointment unless future authorized workflow exists. |

Engineer status operations must be scoped to the assigned appointment and related Case only.

## 3. Appointment / Dispatch Visit Boundary

Multi-visit outcomes belong to the appointment / dispatch visit layer.

Design principles:

- Multiple visits, pending parts, quote needed, customer unavailable, cancellation, no-show, unable-to-repair, and follow-up needs should be recorded on appointment / dispatch visit records.
- One Case can have multiple appointments / dispatch visits.
- One Case should not have multiple unfinished or open appointments at the same time.
- A new appointment should be created only after the previous appointment has a clear terminal or follow-up state.
- Engineer Mobile Workbench should not let engineers directly create arbitrary new appointments unless a future explicit authorization workflow exists.
- Cancellation or reschedule input from the engineer should become a field report signal for dispatcher/customer service review, not an automatic dispatch mutation.

This preserves dispatch control while still allowing engineers to report on-site realities quickly.

## 4. Field Service Report Boundary

Field Service Report remains the Case-level formal completion summary.

Required invariants:

- One Case has one formal Field Service Report.
- Field Service Report is not one report per visit.
- Engineer completion submission is a Field Service Report data source or draft source.
- Multiple appointments must not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be weakened.
- Formal completion should occur through the backend completion contract, not through an uncontrolled mobile client write.

Engineer Mobile Workbench should help collect the field evidence needed for completion. It should not become a bypass around the formal report workflow.

## 5. `finalAppointmentId` Boundary

`finalAppointmentId` must remain system-determined in the normal flow.

Design principles:

- `finalAppointmentId` should be resolved by the system based on the final completed appointment.
- Engineers should not manually select `finalAppointmentId` in the normal mobile workflow.
- Completion submission from a current appointment may provide context for system resolution, but the engineer does not own the final appointment authority.
- Manual selection or correction of `finalAppointmentId` should be limited to a future admin override / exception path.
- Any future override requires permission, reason, audit log, and safe non-sensitive evidence.

This boundary prevents Engineer Mobile Workbench from becoming a hidden manual final appointment picker.

## 6. Completion Submission Data Source

Engineer completion submission should collect concise field input that can later feed the formal report and related records.

Potential completion input:

- Short completion description.
- Fault reason.
- Repair action.
- Replaced parts.
- Service parts quantity and serial information, if authorized.
- Photos as future object/file storage references.
- Customer signature or signature exception reason.
- Engineer note, with clear internal/sensitive-data limits.
- On-site evidence for unable-to-complete, customer unavailable, pending parts, or quote-needed outcomes.

Design principles:

- Engineers should enter only necessary field information.
- AI may later help structure or summarize the input.
- AI must not increase the engineer's on-site form burden.
- Formal report writes should be controlled by backend business logic and permission checks.
- Sensitive or internal-only information must not leak into customer-facing completion summaries.

## 7. Signature And Exception Boundary

Customer signature is important evidence, but not an absolute precondition for every completion.

Design principles:

- Customer signature can support completion evidence for the final appointment and Field Service Report.
- Signature capture is future runtime and is not implemented by Task457.
- If signature cannot be obtained, the workbench should support a future signature exception reason.
- Signature exception cases may include refusal, customer unavailable, representative signature, remote completion, time constraint, or other business-approved exceptions.
- Signature exception should record reason and supporting evidence.
- High-risk exception cases may require future supervisor or customer service review.
- A missing signature should not automatically block every completion, but it should not disappear into an unstructured note.

Signature and signature exception evidence must follow privacy, file storage, and audit requirements.

## 8. AI Boundary

AI may assist completion submission, but it must not own official state transitions.

AI may:

- Convert short engineer input into standardized completion wording.
- Suggest fault classification.
- Organize parts replacement information.
- Highlight missing photo, signature, serial, or parts evidence.
- Draft a Field Service Report candidate for human/system review.

AI must not:

- Automatically create the formal Field Service Report.
- Automatically close the Case.
- Automatically resolve or override `finalAppointmentId`.
- Automatically approve fees, settlement, quotes, or complaint handling.
- Bypass engineer task isolation.
- Bypass organization isolation.
- Write uncertain content directly into official records.
- Trigger provider sending.

AI output must remain advisory until accepted by authorized human workflow or deterministic business logic.

## 9. Formal State Transitions Not Owned By Engineer

The following transitions should not be directly controlled by the engineer mobile workflow without a separate future authorization design:

- Formal Case creation.
- Formal Case closure.
- Formal Field Service Report completion when backend validation fails.
- Repeat completion of an already completed Field Service Report.
- Manual `finalAppointmentId` override.
- Appointment reassignment.
- Official reschedule creation.
- Quote approval.
- Customer fee approval.
- Settlement amount update.
- Complaint closure.
- Survey trigger.
- Notification provider sending.

The engineer can provide field facts and evidence; the system, dispatcher, admin, supervisor, customer service, finance, or customer-facing workflows handle the formal decisions depending on policy.

## 10. Safe Failure And Review Paths

Future runtime should distinguish normal field completion from exception paths.

Examples:

- No eligible completed visit should not complete the Field Service Report.
- Pending parts should keep the Case open for follow-up.
- Customer unavailable should support re-contact and re-dispatch, not false completion.
- Unable to complete should require reason and may need supervisor review.
- Signature exception may require review depending on policy.
- Quote-needed should route to quote workflow, not completed report closure.
- High-risk or complaint-related completion should route to customer service or supervisor review.

Rejected or exception completion flows must not display false success, create duplicate reports, or trigger future surveys.

## 11. Explicit Non-goals For Task457

Task457 does not:

- Implement runtime.
- Implement mobile web.
- Implement PWA.
- Add API.
- Add route / controller / resolver / repository.
- Implement status transition service.
- Modify Field Service Report service behavior.
- Modify appointment runtime behavior.
- Implement upload.
- Implement signature capture.
- Implement object/file storage.
- Add database schema.
- Add migration or index.
- Modify Migration020.
- Add tests / fixtures / smoke.
- Add browser tests.
- Send notifications through LINE / SMS / Email / App.
- Call AI provider.
- Use RAG or vector database.
- Modify package files.
- Modify inventory docs.
- Access shared / production / Zeabur runtime.

## 12. Future Runtime Authorization Conditions

Any future runtime task for Engineer Mobile Workbench status and completion submission requires separate, explicit authorization.

Future authorization should name:

- Whether backend `src/` may be modified.
- Whether admin `src/` or a mobile frontend may be modified.
- Whether API endpoints may be added.
- Whether appointment status runtime may be changed.
- Whether Field Service Report runtime may be changed.
- Whether upload, signature, or object/file storage is in scope.
- Whether tests, fixtures, smoke, or browser tests may be added.
- Whether DB schema or migration is allowed.
- Whether local-only runtime testing is authorized.
- Whether notification sending or provider integration is in scope.
- Whether AI/RAG/vector DB is in scope.

General continuation wording must not be treated as authorization for runtime, DB, migration, provider sending, AI/RAG/vector DB, upload, signature, mobile UI, or status transition implementation.

## 13. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Engineer can mark arrival/start/completion only on assigned or authorized appointments.
- Engineer cannot manipulate unassigned appointments.
- Cross-organization status operations are denied safely.
- Completion submission cannot create a second formal Field Service Report.
- `finalAppointmentId` remains system-determined.
- Engineer cannot manually select or override `finalAppointmentId`.
- Pending parts does not close the Case.
- Customer unavailable does not close the Case.
- Unable-to-complete requires a reason.
- Signature exception records reason/evidence when enabled.
- Repeat completion remains blocked before side effects.
- No eligible completed visit remains rejected.
- Future survey trigger fires only after first successful formal completion transition, not engineer field submit alone.
- Notification sending is not triggered directly by engineer status actions.

These are future implementation tests only. Task457 does not add tests.

## 14. Completion Checklist For This Memo

Task457 completion should confirm:

- Modified files.
- Whether the task is docs-only.
- Implementation summary.
- Non-implemented scope.
- Verification results.
- Whether `docs/PROJECT_GUARDRAILS.md` was violated.
- Whether any data table, API, permission logic, audit log, smoke test, test, or fixture was added or modified.
- Whether any sensitive data, token, secret, personal data, LINE logic, or runtime provider was touched.
- Whether customer channel identity, organization isolation, SaaS-ready, entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO behavior was affected.

## 15. Runtime Decision

No runtime behavior is changed by Task457.

## 16. Migration / Schema Decision

No migration, schema, or index change is introduced by Task457.
