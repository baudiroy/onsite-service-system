# Task458 - Engineer Mobile Workbench Completion Payload and File Evidence Boundary / No Runtime Change

## Status

Task458 is a docs-only / payload and evidence design memo / no runtime change task.

This memo defines the Phase 1 Engineer Mobile Workbench completion submission payload, photo evidence, signature evidence, parts evidence, and customer-facing visibility boundaries. It describes what future engineer completion submission may contain, which fields are required or optional, and which content must remain internal or excluded from customer-facing reports.

This task does not implement API, upload, signature capture, object/file storage, Field Service Report service changes, service parts runtime, inventory runtime, database schema, migration, fixture, test, smoke, provider sending, AI provider, RAG, or vector database behavior.

## 1. Completion Submission Payload Layers

Engineer completion submission should be structured as layered input, not a raw all-purpose payload.

| Payload layer | Purpose | Boundary |
| --- | --- | --- |
| Appointment / dispatch visit reference | Identifies the visit being submitted. | Required and must belong to the engineer's assigned or authorized task. |
| Case reference | Links field input to the service Case. | Required by backend context; must not allow cross-organization access. |
| Engineer reference | Identifies the submitting engineer. | Derived from authenticated user/session, not arbitrary client input. |
| Status outcome | Captures completed, unable-to-complete, pending parts, customer unavailable, or other visit result. | Appointment / dispatch visit layer; does not by itself close the Case. |
| Short completion note | Concise field summary. | Should be short and not force back-office style data entry. |
| Fault reason | Field-observed fault category or note. | May be normalized later by system or AI. |
| Resolution / handling method | What the engineer did on site. | Source for Field Service Report draft or completion summary. |
| Replaced parts | Parts used or replaced. | Future service_parts / inventory integration; not automatic billing approval. |
| Photos metadata | Evidence references and metadata. | Future object/file storage references only; no raw image blob in core payload. |
| Signature metadata or exception reason | Customer signature evidence or reason signature was not collected. | Future signature capture; exception reason must be explicit when needed. |
| Engineer internal note boundary | Optional internal field observation. | Must not leak to customer-facing report by default. |
| AI normalization future source | Input source for future AI structuring. | AI receives only authorized, minimized, masked context. |

Completion submission should be explicit enough for validation and review, but simple enough for mobile field use.

## 2. Required vs Optional Fields

Phase 1 future runtime should keep required fields minimal.

Required fields:

- Appointment / dispatch visit id.
- Engineer identity, derived from authentication and permission context.
- Outcome.
- Completion timestamp or server-side completion submission timestamp.
- Basic handling result or outcome reason.

Conditionally required fields:

- Signature or signature exception reason, if the workflow requires completion evidence.
- Unable-to-complete reason.
- Pending parts reason.
- Customer unavailable reason or contact/evidence note.
- Replaced parts record, if parts were used.
- Quote-needed reason, if the outcome is pending quote.

Optional fields:

- Supplemental explanation.
- Photos, subject to future object/file storage and privacy policy.
- On-site notes.
- Additional model / serial notes.
- Additional evidence metadata.

Design principles:

- Do not require engineers to fill too many fields.
- Required fields should support safety, traceability, and minimum completion quality.
- Optional fields should not become hidden mandatory back-office forms.
- High-risk or exception outcomes can require focused evidence without making the normal path heavy.

## 3. Field Service Report Data Source Boundary

Engineer submission is a source for the Field Service Report, not a second formal report.

Required boundaries:

- Engineer submitted data can become a Field Service Report draft source or completion source.
- Formal Field Service Report remains the Case-level final completion summary.
- One Case has one formal Field Service Report.
- Multiple appointments / dispatch visits must not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be weakened.
- `finalAppointmentId` is resolved by the system based on the final completed appointment.
- Engineers should not manually select or override `finalAppointmentId`.

Formal completion must still follow backend validation, one-report invariant, no-repeat-completion side-effect guard, and final appointment resolution contract.

## 4. Photos And File Evidence Boundary

Photos and field documents are evidence, not free-form core table blobs.

Future design principles:

- Photos should use object/file storage.
- Core records should store metadata and file references, not raw image content.
- Photo metadata may include file id, storage reference, captured_at, uploaded_by, related case/appointment/report, evidence type, and visibility.
- Do not put raw photo content in audit logs.
- Do not put raw photo content in notification payloads.
- Do not put raw photo content in AI context without explicit masking/redaction and authorization.
- Do not include unmasked photos in customer-facing service reports by default.
- Customer-facing reports should display only allowed evidence that satisfies customer visible data policy.

Example evidence categories:

- Fault photo.
- Before repair photo.
- After repair photo.
- Parts photo.
- Nameplate / model / serial photo.
- Installation or placement photo.
- Signature-related evidence, if applicable.

All photo access must respect organization scope, task assignment, role permission, field-level masking, and audit requirements.

## 5. Signature And Signature Exception Boundary

Customer signature is important completion evidence, but not an absolute requirement for every completion.

Future signature metadata may include:

- Signature file reference or evidence reference.
- Signed by / representative type, if policy allows.
- Signed_at.
- Captured_by engineer id.
- Related case id.
- Related appointment / final appointment id.
- Related Field Service Report id.
- Signature visibility policy.

Signature exception may include:

- Refused to sign.
- Unable to sign.
- Customer unavailable.
- Remote completion.
- Representative / agent signed.
- Time constraint.
- Other business-approved exception.

Exception records should include:

- Reason.
- Engineer note.
- Evidence metadata, if available.
- Contact history reference, if available.
- Review status, if future workflow requires review.

Signature capture is not implemented by Task458.

## 6. Parts Record Boundary

Engineer Mobile Workbench may collect parts usage input, but it must not become an uncontrolled inventory or settlement system.

Future parts input may include:

- Part name.
- Part code.
- Quantity.
- Old serial number.
- New serial number.
- Replacement reason.
- Returned old part indicator.
- Related photo metadata.
- Pending parts reason, if parts are unavailable.

Design principles:

- Engineer parts input can feed future `service_parts`, inventory, vehicle stock, or settlement evidence workflows.
- Formal inventory deduction should be deterministic and audited.
- AI may help normalize part names, suggest part codes, or summarize usage.
- AI must not automatically deduct inventory.
- AI must not approve parts cost.
- AI must not decide settlement amount.
- AI must not overwrite parts master data.
- Task458 does not modify parts, inventory, vehicle stock, or settlement runtime.

## 7. Customer-facing Data Policy

Customer-facing completion views and reports must not expose internal data by default.

Customer-facing reports must not include:

- Internal note.
- Audit log.
- AI raw payload.
- AI risk flag.
- Billing internal data.
- Settlement internal data.
- Engineer internal comments.
- Supervisor review content.
- Vendor contract rules.
- Internal cost.
- Unapproved quote or fee discussion.
- Raw channel ids.
- Token / secret.

Customer-facing reports may include only approved, customer-relevant content such as:

- Case number.
- Service date.
- Service item.
- Product type/model where appropriate.
- Fault summary.
- Repair result.
- Replaced part name/category where appropriate.
- Allowed completion photos where appropriate.
- Signature or signature exception summary where appropriate.
- Confirmed customer charge / approval / invoice information if applicable.
- Safe follow-up or support contact information.

If customer fees are involved, only confirmed customer-related charge / approval / invoice information should be shown.

## 8. Engineer Internal Note Boundary

Engineer notes may contain operational context and should not automatically become customer-facing content.

Design principles:

- Engineer internal notes must be separated from customer-facing completion summaries.
- Internal notes should avoid unnecessary sensitive data.
- Internal notes should not contain tokens, secrets, raw LINE ids, full customer mobile values, full raw payloads, or AI raw sensitive payload.
- AI may summarize internal notes only with permission-aware retrieval and redaction.
- Customer-facing content should be generated from approved report fields, not raw internal notes.

## 9. AI Boundary

AI may assist with completion payload normalization only under strict data protection rules.

AI may assist with:

- Turning short engineer input into standardized completion wording.
- Fault classification suggestions.
- Parts description normalization.
- Photo / nameplate / serial recognition as future design.
- Missing evidence reminders.
- Field Service Report draft wording.

AI must not:

- Require engineers to fill more AI-specific fields.
- Receive tokens or secrets.
- Receive complete customer mobile or address values without explicit authorization, masking, and need.
- Receive customer signature raw data.
- Receive unmasked photos by default.
- Receive full audit log text.
- Receive full internal note text by default.
- Receive full billing / settlement internal data by default.
- Automatically approve official completion, fees, settlement, quotes, or complaint handling.
- Write uncertain output directly into official records.

AI-assisted normalization must follow closed-domain, permission-aware, tenant-isolated, auditable, human-controlled, and RAG-grounded principles.

## 10. Safe Completion Payload Review

Future runtime should validate completion payloads before writing official records.

Recommended validation checks:

- Appointment belongs to the Case.
- Appointment belongs to the same organization.
- Engineer is assigned or authorized.
- Outcome is allowed for the appointment lifecycle.
- Required fields for the chosen outcome are present.
- Signature exception is explicit when signature is absent and policy requires evidence.
- Photo metadata references permitted files only.
- Parts data is scoped to the organization and assigned task.
- Customer-facing projection excludes internal-only fields.
- AI-derived fields are marked as suggestions or drafts until accepted.

Rejected submissions must not create duplicate Field Service Reports, close the Case incorrectly, or trigger future survey / notification side effects.

## 11. Explicit Non-goals For Task458

Task458 does not:

- Implement runtime.
- Add API.
- Add route / controller / resolver / repository.
- Implement mobile web.
- Implement PWA.
- Implement upload.
- Implement signature capture.
- Implement object/file storage.
- Add database schema.
- Add migration or index.
- Modify Migration020.
- Modify Field Service Report service behavior.
- Modify service_parts runtime.
- Modify inventory runtime.
- Add tests / fixtures / smoke.
- Add browser tests.
- Send notifications through LINE / SMS / Email / App.
- Call AI provider.
- Use RAG or vector database.
- Modify package files.
- Modify inventory docs.
- Access shared / production / Zeabur runtime.

## 12. Future Runtime Authorization Conditions

Any future runtime task for completion payload or file evidence requires separate, explicit authorization.

Future authorization should name:

- Whether backend `src/` may be modified.
- Whether admin `src/` or a mobile frontend may be modified.
- Whether API endpoints may be added.
- Whether upload and object/file storage may be implemented.
- Whether signature capture is in scope.
- Whether service parts or inventory runtime is in scope.
- Whether Field Service Report service behavior may be changed.
- Whether tests, fixtures, smoke, or browser tests may be added.
- Whether DB schema or migration is allowed.
- Whether local-only runtime testing is allowed.
- Whether provider sending is in scope.
- Whether AI/RAG/vector DB integration is in scope.

General continuation wording must not be treated as authorization for runtime, DB, migration, provider sending, AI/RAG/vector DB, upload, signature, inventory, service parts, mobile UI, or Field Service Report service implementation.

## 13. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Completion payload requires assigned appointment / dispatch visit id.
- Engineer identity is derived from authentication, not arbitrary payload input.
- Cross-organization completion submission is denied safely.
- Unassigned engineer cannot submit completion.
- Outcome-specific required fields are enforced.
- Signature exception can be recorded without blocking every completion.
- Photo metadata references safe file storage records only.
- Raw photo content is not included in audit log, notification payload, or customer-facing projection.
- Internal notes are excluded from customer-facing report.
- AI raw payload is excluded from customer-facing report.
- Billing / settlement internal data is excluded from customer-facing report.
- Parts input does not automatically deduct inventory.
- Engineer cannot override `finalAppointmentId`.
- Completion submission does not create a second formal Field Service Report.

These are future implementation tests only. Task458 does not add tests.

## 14. Completion Checklist For This Memo

Task458 completion should confirm:

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

No runtime behavior is changed by Task458.

## 16. Migration / Schema Decision

No migration, schema, or index change is introduced by Task458.
