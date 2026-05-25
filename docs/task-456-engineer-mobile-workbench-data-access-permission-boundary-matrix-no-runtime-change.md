# Task456 - Engineer Mobile Workbench Data Access / Permission Boundary Matrix / No Runtime Change

## Status

Task456 is a docs-only / permission design memo / no runtime change task.

This memo defines the Phase 1 Engineer Mobile Workbench data visibility, action permission, state operation, AI, SaaS, and security boundaries before any runtime implementation starts.

This task does not implement permission runtime, login, session handling, API, route, controller, resolver, repository, database schema, migration, mobile web, PWA, upload, signature capture, object/file storage, notification sending, AI provider, RAG, vector database, test, fixture, smoke, or browser behavior.

## 1. Role Scope

The Engineer Mobile Workbench must be designed around clear role boundaries.

Relevant roles:

- Engineer.
- Dispatcher.
- Admin.
- Supervisor.
- Customer service.
- System / AI assistant, advisory only.

Role positioning:

- Engineer handles assigned field work and submits concise field completion input.
- Dispatcher handles dispatch planning, appointment assignment, routing, proposed time confirmation, and non-field scheduling changes.
- Admin handles account, permission, configuration, exception, and override governance.
- Supervisor handles exception review, complaint escalation, abnormal completion, signature exception review, and operational risk.
- Customer service handles customer contact, missing intake data, customer clarification, complaint intake, and human follow-up.
- System / AI assistant may summarize, suggest, warn, and draft, but must not execute official decisions by itself.

## 2. Engineer Visible Data Matrix

Engineers should see only the minimum data needed to safely complete assigned field visits.

| Data category | Engineer visibility | Boundary |
| --- | --- | --- |
| Assigned appointment / dispatch visit | Allowed | Only if the engineer is assigned or explicitly authorized. |
| Today / upcoming task list | Allowed | Must be scoped to assigned or authorized tasks. |
| Task status | Allowed | Only for assigned or authorized appointment / dispatch visit records. |
| Appointment time | Allowed | Minimum scheduling data required for field work. |
| Customer on-site contact information | Allowed with masking policy | Show only what is necessary for the visit and permitted by role. |
| Address and on-site notes | Allowed with minimum necessary scope | Must not include unrelated internal notes. |
| Product information | Allowed | Limit to service-relevant product, model, serial, and reported issue context. |
| Reported issue summary | Allowed | Use customer-facing or field-safe summary, not raw internal payload. |
| Required service history summary | Future conditional | If enabled, provide only minimum necessary prior service context. |
| Service parts needed for the assigned visit | Future conditional | Should be limited to assigned task and inventory/parts permissions. |
| Photos required for completion | Future conditional | File access must use object/file storage references and permission checks. |
| Customer signature or signature exception input | Future conditional | Capture only for the assigned completion workflow. |

Engineer visibility must never include cross-organization data, unassigned appointments, unrelated customer history, or other engineer tasks unless a separate explicit authorization model exists.

## 3. Engineer Non-visible Data Matrix

Engineers should not see internal, high-risk, financial, audit, or unrelated data by default.

| Data category | Engineer default visibility | Reason |
| --- | --- | --- |
| Internal note | Not visible | Internal operations and escalation context should stay role-limited. |
| Audit log | Not visible | Audit logs are governance records, not field work data. |
| AI raw payload | Not visible | Raw AI context may contain sensitive or internal-only data. |
| Billing internal data | Not visible | Field work does not require internal billing details by default. |
| Settlement internal data | Not visible | Settlement and reconciliation are finance/admin workflows. |
| Vendor contract rules | Not visible | Contract rules are controlled settlement governance data. |
| Supervisor review notes | Not visible | Exception review notes require supervisor/admin scope. |
| Customer complaint internal handling notes | Not visible | Complaint handling should stay with customer service/supervisor roles. |
| Raw channel ids | Not visible | Raw LINE or channel identifiers must not be exposed. |
| Token / secret | Never visible | Credentials and verification secrets must never surface in UI. |
| Unrelated customer history | Not visible | Violates minimum necessary and customer privacy principles. |
| Other engineer tasks | Not visible | Unless explicitly authorized by assignment or supervisor workflow. |
| Cross-organization records | Never visible | Tenant isolation is mandatory. |

Exceptions require explicit future design, permission, audit log, and data minimization review.

## 4. Engineer Action Permission Matrix

Engineers may execute field-progress and completion-input actions for assigned or authorized tasks only.

| Action | Engineer allowed? | Boundary |
| --- | --- | --- |
| View own assigned tasks | Yes | Must pass organization scope, identity, role, and assignment checks. |
| Mark arrival | Yes | Appointment / dispatch visit layer only. |
| Mark start handling | Yes | Appointment / dispatch visit layer only. |
| Fill short completion input | Yes | Input source for service report draft/completion workflow; not a second report. |
| Upload photos | Future conditional | Must use object/file storage, metadata, permission, and audit policy. |
| Record replaced parts | Future conditional | Must link to case / appointment / report context and parts rules. |
| Record fault reason and repair action | Yes | Concise field input, later structured by system or AI if authorized. |
| Collect customer signature | Future conditional | Signature capture must follow privacy, storage, and evidence policies. |
| Record signature exception reason | Future conditional | Must include reason/evidence policy and possible review workflow. |
| Submit completion input | Yes | Only as Field Service Report draft/source data according to backend contract. |

Engineer actions must be scoped to the assigned appointment / dispatch visit and the related Case.

## 5. Engineer Forbidden Action Matrix

Engineers must not use the workbench to bypass dispatch, admin, supervisor, finance, customer service, or system-owned responsibilities.

| Action | Engineer allowed? | Required owner |
| --- | --- | --- |
| Create a formal Case | No | Customer service, intake, admin, or approved system flow. |
| Arbitrarily change dispatch data outside visit result | No | Dispatcher/admin. |
| Select or override `finalAppointmentId` | No | System-owned; admin exception/override only if separately designed. |
| Create a second formal Field Service Report for the same Case | No | Forbidden by core invariant. |
| Modify settlement amount | No | Finance/admin/deterministic settlement workflow. |
| Approve quote | No | Customer, customer service, supervisor, or finance according to policy. |
| Close complaint | No | Customer service/supervisor workflow. |
| Cross-organization search | Never | Forbidden by tenant isolation. |
| Act as customer fee approval | No | Customer approval records require explicit customer consent evidence. |
| Directly trigger LINE/SMS/Email/App provider sending | No | Notification workflow/system-owned provider integration. |
| Read token, secret, raw LINE id, or provider credentials | Never | Forbidden sensitive data exposure. |

Supplied field input cannot become a manual override path for financial, customer consent, survey, notification, or final appointment decisions.

## 6. State Operation Boundary

Engineer state actions are field-progress signals, not unrestricted workflow control.

State boundaries:

- Arrival, start handling, and completion status are appointment / dispatch visit layer progress signals.
- Field Service Report remains the Case-level formal completion summary.
- One Case can have multiple appointments / dispatch visits.
- One Case must have only one formal Field Service Report.
- The one-open-appointment invariant must not be weakened.
- `finalAppointmentId` should be resolved by the system based on the final completed appointment.
- Engineer normal flow must not include manual `finalAppointmentId` selection.
- Admin override for `finalAppointmentId`, if ever allowed, requires a separate audited exception design.

Engineer completion input should support the formal report workflow, but must not create a per-visit formal report model.

## 7. AI Boundary

AI in Engineer Mobile Workbench must remain advisory and permission-aware.

AI may assist with:

- Summarizing short engineer input.
- Suggesting fault classification.
- Organizing parts replacement information.
- Drafting completion wording.
- Highlighting missing photo, signature, serial, or parts evidence.
- Extracting information from photo/nameplate/serial labels in a future authorized runtime.

AI must not:

- Bypass engineer permission.
- Read unauthorized tasks.
- Read cross-organization data.
- Increase field form burden.
- Automatically approve official completion.
- Automatically change Case / Appointment / Field Service Report status.
- Automatically select or override `finalAppointmentId`.
- Automatically approve fees, quotes, settlement, or customer approvals.
- Automatically close complaints.
- Trigger LINE/SMS/Email/App provider sending.
- Write uncertain content directly into official records.

AI output must remain separate from official records until accepted by authorized workflow or deterministic business logic.

## 8. Security, SaaS, And Data Access Boundary

Engineer Mobile Workbench must follow the shared platform data access model.

Required boundaries:

- Organization isolation.
- Engineer task isolation.
- User identity.
- Role and permission checks.
- Feature entitlement where applicable.
- Subscription status where applicable.
- Minimum necessary data.
- Customer visible data policy.
- Internal data policy.
- Field-level masking and sensitive data redaction.
- Audit log future requirement.
- SaaS usage tracking where applicable.

SaaS and permission principles:

- Entitlement is not permission.
- An organization may be entitled to Engineer Mobile Workbench, but an engineer must still have permission and assignment scope.
- Usage tracking must not include unnecessary sensitive payload.
- Field photos, signatures, and documents should use object/file storage references in future runtime.
- No production data, raw provider payload, raw LINE user id, token, secret, or full customer phone/mobile should appear in test output, logs, docs, or AI context.

## 9. Permission Failure Behavior

Future runtime should fail safely when permission checks fail.

Recommended behavior:

- Unassigned appointment access should be denied without exposing whether the appointment exists.
- Cross-organization access should be denied safely.
- Missing feature entitlement should return an entitlement-safe response, not internal implementation details.
- Missing role permission should not leak sensitive task details.
- Expired or invalid session should require re-authentication.
- AI retrieval denied events should not provide unauthorized source snippets.

Safe denial must not reveal tokens, raw channel identifiers, customer mobile values, internal notes, or raw payloads.

## 10. Future Audit And Evidence Requirements

When runtime is authorized in the future, important engineer actions should be auditable.

Potential future audit events:

- engineer_task_viewed, if view auditing is required.
- engineer_arrival_marked.
- engineer_work_started.
- engineer_completion_input_submitted.
- engineer_photo_uploaded.
- engineer_signature_captured.
- engineer_signature_exception_recorded.
- engineer_parts_recorded.
- engineer_permission_denied.
- engineer_cross_scope_access_denied.

Audit events should record safe metadata such as organization, actor, role, target resource type, target id, action, timestamp, and result. Audit events must not record tokens, secrets, raw LINE ids, full customer mobile values, complete signatures, unmasked photos, or unnecessary AI raw payload.

## 11. Explicit Non-goals For Task456

Task456 does not:

- Implement runtime permission checks.
- Implement login.
- Implement session handling.
- Add API.
- Add route / controller / resolver / repository.
- Add database schema.
- Add migration.
- Modify Migration020.
- Implement mobile web.
- Implement PWA.
- Implement upload.
- Implement signature capture.
- Implement object/file storage.
- Implement notification sending.
- Implement LINE / SMS / Email / App provider sending.
- Call AI provider.
- Use RAG or vector database.
- Add tests / fixtures / smoke.
- Modify package files.
- Modify inventory docs.
- Access shared / production / Zeabur runtime.

## 12. Future Runtime Authorization Conditions

Any future runtime task for this boundary must be separately authorized and should name:

- Whether backend `src/` may be touched.
- Whether admin `src/` or a new mobile frontend may be touched.
- Whether API endpoints may be added.
- Whether permission middleware may be implemented.
- Whether file upload or signature capture is in scope.
- Whether object/file storage is in scope.
- Whether tests, fixtures, smoke, or browser tests may be added.
- Whether DB schema or migration is allowed.
- Whether local-only runtime testing is allowed.
- Whether notification provider integration is allowed.
- Whether AI/RAG/vector DB integration is allowed.

General continuation wording must not be treated as authorization for runtime, DB, migration, provider sending, AI/RAG/vector DB, upload, signature, mobile UI, or permission implementation.

## 13. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Engineer can see assigned tasks.
- Engineer cannot see unassigned tasks.
- Engineer cannot see other engineers' tasks unless explicitly authorized.
- Cross-organization access is denied safely.
- Engineer cannot see internal notes, audit logs, AI raw payload, billing internal data, or settlement internal data.
- Engineer can mark arrival/start/completion only for assigned or authorized appointments.
- Engineer cannot manually select or override `finalAppointmentId`.
- Engineer completion input does not create a second formal Field Service Report.
- Photos/signatures use file/object storage references and safe metadata.
- Permission denial does not reveal whether a forbidden record exists.
- AI suggestion uses only authorized engineer task context.
- LINE push is not required for engineer task visibility.

These are future implementation tests only. Task456 does not add tests.

## 14. Completion Checklist For This Memo

Task456 completion should confirm:

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

No runtime behavior is changed by Task456.

## 16. Migration / Schema Decision

No migration, schema, or index change is introduced by Task456.
