# Task460 - Engineer Mobile Workbench Phase 1 API Contract Boundary Draft / No Runtime Change

## Status

Task460 is a docs-only / future API boundary draft / no runtime change task.

This memo proposes the future Engineer Mobile Workbench Phase 1 API contract boundaries. It defines possible endpoint categories, request/response principles, permission boundaries, safe-deny behavior, payload minimization, and forbidden fields before any API implementation starts.

This task does not add API, route, controller, resolver, repository, login/session runtime, permission runtime, upload, signature capture, object/file storage, database schema, migration, fixture, test, smoke, provider sending, AI provider, RAG, vector database, admin runtime, or backend runtime behavior.

## 1. API Contract Positioning

This document is a future API boundary draft only.

Positioning:

- Proposal-only.
- Not runtime approval.
- Not route/controller/resolver/repository implementation.
- Not permission middleware implementation.
- Not database access.
- Not shared/prod/Zeabur runtime access.
- Not fixture creation.
- Not test or smoke implementation.

Future runtime work requires a separate explicit implementation task that names allowed files, endpoint scope, permission model, tests, and whether any database or frontend changes are permitted.

## 2. Future Possible API Types

The following are possible future API categories, not implemented endpoints.

| API category | Purpose | Boundary |
| --- | --- | --- |
| Engineer session / current engineer context | Return the authenticated engineer context and safe organization membership summary. | Must derive identity from auth/session, not arbitrary payload. |
| Today / upcoming task list | Return assigned or authorized appointments / dispatch visits. | Must be scoped to engineer assignment and organization. |
| Task detail | Return minimum necessary visit details. | Must exclude internal, financial, audit, raw provider, and unrelated data. |
| Arrived status report | Mark on-site arrival. | Appointment / dispatch visit layer only. |
| Started status report | Mark work started. | Appointment / dispatch visit layer only. |
| Completion submission | Submit concise completion input. | Field Service Report draft/source data; formal completion remains backend-controlled. |
| Unable to complete / pending parts / customer unavailable outcome submission | Submit exception or follow-up outcome. | Does not close the Case as completed by itself. |
| Photo metadata registration | Register future object/file storage metadata. | Proposal-only; no raw file upload in Task460. |
| Signature metadata or signature exception submission | Register future signature evidence or exception reason. | Proposal-only; no signature capture in Task460. |
| Draft save | Future weak-network draft support. | Proposal-only; must avoid duplicate writes when implemented. |

Endpoint names, URLs, methods, and payload schemas should be decided in a future implementation-specific task.

## 3. Common Request Boundary

Every future Engineer Mobile Workbench request must be permission-aware and tenant-scoped.

Required request principles:

- Must have authenticated engineer context.
- Must check organization scope.
- Must check engineer task assignment or explicit authorization.
- Must check role permission.
- Must check feature entitlement where applicable.
- Must not treat token/link alone as engineer identity.
- Must not treat `line_user_id` as a global identity.
- Must not accept raw provider payload.
- Must not accept arbitrary `organizationId` override from the client.
- Must not accept engineer-supplied `finalAppointmentId`.
- Must not accept fields that imply direct quote approval, fee approval, settlement approval, complaint closure, or provider sending.

Identity and organization context should be derived from trusted authentication/session/membership context, not from client-provided identifiers.

## 4. Common Response Boundary

Responses should be allow-list first and minimum necessary.

Responses must not include:

- Internal note.
- Audit log.
- AI raw payload.
- Billing internal data.
- Settlement internal data.
- Raw channel ids.
- Token / secret.
- Raw provider payload.
- Unrelated customer history.
- Other engineer tasks.
- Cross-organization data.
- Vendor contract rules.
- Supervisor review notes.
- Complaint internal handling notes.

Responses may include only data required for the specific engineer field workflow and allowed by permission, assignment, customer-visible/internal policy, and field-level masking rules.

## 5. Task List Response Boundary

Future task list response should be lightweight.

Allowed fields, proposal-only:

- Task id / appointment or dispatch visit reference.
- Appointment time.
- Task status.
- Short area/location cue, if allowed.
- Product or service category summary.
- Reported issue summary.
- Safe priority or attention indicator, if allowed.

Task list must not include:

- Full internal report data.
- Billing / settlement internal data.
- Internal notes.
- Audit logs.
- AI raw payload.
- Full unrelated customer history.
- Other engineers' task details.
- Cross-organization task details.

The task list should let an engineer choose the next assigned visit without overexposing sensitive data.

## 6. Task Detail Response Boundary

Future task detail response may include minimum necessary service context.

Allowed fields, proposal-only:

- Appointment time.
- On-site contact information, minimum necessary and masked where appropriate.
- Address and access instructions, minimum necessary.
- Product information.
- Reported issue summary.
- Necessary service reminder.
- Safe prior service summary, only if future policy allows.
- Parts-to-bring or pending parts hint, only if future parts policy allows.

Task detail must not include:

- Internal note.
- Audit log.
- AI raw payload.
- Raw LINE / provider channel ids.
- Token / secret.
- Billing internal data.
- Settlement internal data.
- Vendor contract rules.
- Supervisor review notes.
- Complaint internal handling notes.
- Unrelated customer history.

Task detail must remain a field-work screen, not a full back-office case dump.

## 7. Status Operation Boundary

Future status-operation APIs should operate on the appointment / dispatch visit layer.

Supported concepts, proposal-only:

- Arrived.
- Started.
- Completion submitted.
- Unable to complete.
- Pending parts.
- Customer unavailable.
- Cancellation or reschedule field report.

Boundaries:

- Arrived / started / completion submitted belong to appointment / dispatch visit progress.
- Engineer must not directly create arbitrary new appointments.
- Engineer must not formally reassign dispatch.
- Cancellation or reschedule field report must not automatically become official appointment change.
- One Case should not have multiple unfinished appointments at the same time.
- Backend must validate assignment, organization, current lifecycle, and idempotency.

Status operations must not bypass dispatcher/customer service review for official appointment changes.

## 8. Completion Submission Boundary

Future completion submission API should collect field input while preserving formal completion controls.

Boundaries:

- Engineer submitted data is Field Service Report draft/source data.
- Formal Field Service Report remains Case-level final completion summary.
- One Case has one formal Field Service Report.
- Multiple appointments must not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be weakened.
- `finalAppointmentId` is system-determined based on final completed appointment.
- Admin override requires future permission, reason, and audit design.
- Engineer general API must not accept `finalAppointmentId` as an override.

Possible completion fields, proposal-only:

- Outcome.
- Short completion note.
- Fault reason.
- Handling method.
- Replaced parts.
- Photo metadata references.
- Signature metadata or exception reason.
- Engineer note, with internal/sensitive boundary.

The API should validate outcome-specific required fields and reject unsafe or unauthorized writes without creating side effects.

## 9. Safe-deny / Failure Behavior

Safe-deny behavior must prevent resource enumeration and sensitive leakage.

Safe-deny scenarios:

- Not logged in.
- Session expired.
- Missing role permission.
- Missing feature entitlement.
- Task not found.
- Task not assigned to the engineer.
- Cross-organization access.
- Appointment lifecycle does not allow requested operation.
- Completion validation failed.

Response principles:

- Use generic safe-deny messages.
- Do not reveal whether a forbidden task exists.
- Do not reveal whether a Case / customer / appointment exists.
- Do not expose DB errors.
- Do not expose provider errors.
- Do not expose stack traces.
- Do not expose internal permission rules.
- Do not include raw payload, token, secret, raw LINE id, or customer personal data.

Response equivalence should be a future test requirement for not-found vs forbidden task access.

## 10. AI Boundary

Future API contracts should not widen data exposure just because AI may normalize the input.

AI may:

- Use authorized engineer completion input as a future normalization source.
- Suggest standardized completion wording.
- Suggest fault classification.
- Suggest parts normalization.
- Identify missing evidence.

AI must not:

- Add extra engineer-required fields.
- Bypass permission.
- Read unauthorized tasks.
- Receive tokens or secrets.
- Receive complete customer mobile/address values by default.
- Receive raw signature data.
- Receive unmasked photos by default.
- Receive full audit log text.
- Receive full internal note text by default.
- Receive full billing / settlement internal data by default.
- Automatically approve formal completion, fees, settlement, quotes, or complaint handling.
- Trigger provider sending.

AI-normalized fields should remain suggestions or draft values until accepted by authorized workflow or deterministic business logic.

## 11. Forbidden Request Fields

Future Engineer Mobile Workbench APIs should reject or ignore fields that create unsafe authority.

Forbidden request fields, proposal-only:

- Arbitrary `organizationId` override.
- Client-supplied `engineerId` override when identity should come from session.
- Client-supplied `finalAppointmentId`.
- Raw provider payload.
- Raw LINE user id used as identity.
- Token / secret.
- Customer fee approval flag.
- Quote approval flag.
- Settlement amount.
- Complaint closure flag.
- Survey trigger flag.
- Notification provider-send flag.
- Internal note intended for customer-facing report.
- AI raw payload intended for official record.

Future runtime should validate these explicitly to prevent accidental authority expansion.

## 12. Explicit Non-goals For Task460

Task460 does not:

- Implement API.
- Modify backend `src/`.
- Modify admin `src/`.
- Add route / controller / resolver / repository.
- Add login/session runtime.
- Add permission runtime.
- Add upload.
- Add signature capture.
- Add object/file storage.
- Add database schema.
- Add migration or index.
- Modify Migration020.
- Modify Field Service Report runtime.
- Modify appointment runtime.
- Add tests / fixtures / smoke.
- Add browser tests.
- Send notifications through LINE / SMS / Email / App.
- Call AI provider.
- Use RAG or vector database.
- Modify package files.
- Modify inventory docs.
- Access shared / production / Zeabur runtime.

## 13. Future Runtime Authorization Conditions

Any future implementation of these API concepts requires separate explicit authorization.

Future authorization should name:

- Exact endpoints or modules.
- Whether backend `src/` may be modified.
- Whether admin `src/` or mobile frontend may be modified.
- Whether route/controller/resolver/repository files may be added.
- Whether permission middleware may be implemented.
- Whether upload/signature/object storage is in scope.
- Whether tests, fixtures, smoke, or browser tests may be added.
- Whether DB schema or migration is allowed.
- Whether local-only runtime testing is allowed.
- Whether provider sending is in scope.
- Whether AI/RAG/vector DB integration is in scope.

General continuation wording must not be treated as authorization for API implementation, DB, migration, provider sending, AI/RAG/vector DB, upload, signature, mobile UI, or permission runtime.

## 14. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Engineer context comes from authenticated session.
- Task list includes only assigned or authorized tasks.
- Task detail rejects cross-organization access safely.
- Unassigned task and nonexistent task responses do not leak resource existence.
- Requests cannot override `organizationId`.
- Requests cannot override engineer identity.
- Requests cannot supply `finalAppointmentId`.
- Responses exclude internal notes, audit logs, AI raw payload, billing internal data, settlement internal data, raw channel ids, and unrelated customer history.
- Arrived/started/completion submitted can only affect authorized appointment / dispatch visit records.
- Completion submission cannot create duplicate formal Field Service Reports.
- Completion submission does not directly trigger provider sending.
- AI normalization uses only authorized, minimized, redacted context.

These are future implementation tests only. Task460 does not add tests.

## 15. Completion Checklist For This Memo

Task460 completion should confirm:

- Modified files.
- Whether the task is docs-only.
- Implementation summary.
- Non-implemented scope.
- Verification results.
- Whether `docs/PROJECT_GUARDRAILS.md` was violated.
- Whether any data table, API, permission logic, audit log, smoke test, test, or fixture was added or modified.
- Whether any sensitive data, token, secret, personal data, LINE logic, or runtime provider was touched.
- Whether customer channel identity, organization isolation, SaaS-ready, entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO behavior was affected.

## 16. Runtime Decision

No runtime behavior is changed by Task460.

## 17. Migration / Schema Decision

No migration, schema, or index change is introduced by Task460.
