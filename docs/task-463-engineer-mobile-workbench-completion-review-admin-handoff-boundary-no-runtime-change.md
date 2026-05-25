# Task463 - Engineer Mobile Workbench Completion Review and Admin Handoff Boundary / No Runtime Change

## Status

Task463 is a docs-only / product workflow design memo / no runtime change task.

This memo defines the future handoff boundary after an engineer submits a completion submission from Engineer Mobile Workbench. It clarifies how the submitted field information may be reviewed by dispatcher, admin, supervisor, or customer service before becoming Field Service Report draft/source data or customer-facing report content.

Task463 does not authorize runtime. Current state remains `NO RUNTIME AUTHORIZATION`.

## 1. Non-authorization Statement

Task463 is not:

- Runtime approval.
- Route/controller skeleton approval.
- API approval.
- Admin UI approval.
- Database approval.
- Migration approval.
- Migration020 approval.
- Fixture or test approval.
- Provider sending approval.
- AI/RAG/vector database approval.
- Shared/prod/Zeabur access approval.

Task463 only records a future product workflow boundary.

## 2. Completion Submission Handoff Positioning

Engineer Mobile Workbench submission is a `completion submission`.

Boundary:

- `completion submission` can only serve as Field Service Report draft/source data.
- Formal Field Service Report remains the Case-level final completion summary.
- One Case ultimately has one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Multiple visits, pending parts, quote needed, customer unavailable, cancellation, unable-to-repair, and follow-up needs remain appointment / dispatch visit layer outcomes.
- Engineer submission does not automatically mean a formal Field Service Report has been completed.
- Engineer submission does not automatically create customer-facing report content.

The handoff workflow should help transform field facts into reliable records without weakening core invariants.

## 3. Review Roles And Responsibility Boundary

Future review and handoff responsibilities should be role-aware.

| Role | Responsibility | Boundary |
| --- | --- | --- |
| Engineer | Submit necessary on-site facts and evidence. | Does not approve formal report, quote, settlement, complaint closure, or `finalAppointmentId`. |
| Dispatcher | Check whether appointment / dispatch visit result is operationally consistent. | Handles dispatch follow-up, reschedule, pending customer confirmation, or re-dispatch needs. |
| Admin | Organize or confirm Field Service Report draft when needed. | Must preserve one Case / one formal Field Service Report. |
| Supervisor | Review exceptions, disputes, refused signature, major complaint, high-risk completion, or unclear responsibility. | Must not bypass organization isolation or audit requirements. |
| Customer service | Handle customer follow-up, problem report, complaint, callback, or missing confirmation. | Owns customer communication and customer-visible follow-up. |
| System | Assist with validation, status hints, draft organization, and risk flags. | Must follow deterministic rules and safe boundaries. |
| AI assistant | Advisory summary/classification only. | Cannot approve official results or write uncertain content directly into official records. |

Roles must remain scoped by organization, permission, entitlement, and allowed data access.

## 4. Normal Completion Path

Future normal path, proposal-only:

```text
Engineer completion submission
-> system validates minimal payload in future runtime
-> creates or updates FSR draft/source data in future design
-> system infers finalAppointmentId from completed appointment
-> admin/dispatcher can review if needed
-> official Field Service Report remains one per Case
-> customer-facing report uses only allowed visible fields
```

Design principles:

- This path is future design only.
- Task463 does not implement validation, draft creation, final appointment inference, review, or report generation.
- Formal Field Service Report completion must remain backend-controlled.
- Repeat completion and already-completed reports must remain side-effect safe.
- Customer-facing report content must come from allowed fields, not raw engineer/internal notes.

## 5. Exception Review Path

Some completion submissions should enter future review queue, follow-up, or escalation rather than normal completion handling.

Potential review-triggering scenarios:

- Unable to obtain signature.
- Refused signature.
- Representative / agent signature.
- Remote completion.
- Customer unavailable.
- Pending parts.
- Unable to repair.
- Engineer-reported result conflicts with dispatch data.
- Customer later reports issue not resolved.
- Low rating / negative feedback / complaint.
- Possible fee dispute.
- Possible warranty or responsibility dispute.
- Missing required photos, serial, parts, or evidence.
- High-value quote or charge-related completion.

Future exception handling may include:

- Review queue.
- Follow-up task.
- Customer service callback.
- Supervisor escalation.
- Re-dispatch evaluation.
- Quote workflow.
- Customer approval record review.
- Billing/settlement evidence review.

AI may summarize and classify exception reasons, but AI must not hide negative feedback, close complaints, modify ratings, approve customer fees, approve settlement, or decide responsibility.

## 6. Field Service Report Boundary

The handoff workflow must preserve the formal report invariant.

Required boundaries:

- One Case has one formal Field Service Report.
- Multiple appointments do not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be weakened.
- Field Service Report is the Case-level final completion summary, not one report per visit.
- Engineer `completion submission` is not the formal Field Service Report.
- Admin/supervisor review must not create a second formal Field Service Report.
- Review and correction flows must not silently rewrite already completed reports.

If a future correction workflow is needed, it must be designed separately with permission, reason, audit, versioning, and customer-facing impact review.

## 7. `finalAppointmentId` Boundary

`finalAppointmentId` must remain system-determined in the normal flow.

Required boundaries:

- `finalAppointmentId` should be resolved by the system based on the final completed appointment.
- Engineers should not manually select `finalAppointmentId`.
- Engineer completion submission may identify the appointment context, but does not own final appointment authority.
- Admin override is an exception-only future path.
- Any admin override requires future permission, reason, audit log, and safe evidence policy.
- Task463 does not implement override.

Review workflows must not reintroduce a hidden manual final appointment picker for engineers.

## 8. Customer-facing Report Data Boundary

Customer-facing report content must be projection-based and allow-listed.

Candidate customer-facing content:

- Completion date / service time.
- Product information.
- Issue summary.
- Handling method summary.
- Replaced parts summary, limited to customer-visible content.
- Photos or attachments only if allowed and compliant with customer visible data policy.
- Customer-related and confirmed charge / approval / invoice information.
- Safe follow-up or support information.

Not allowed in customer-facing report:

- Internal note.
- Audit log.
- AI raw payload.
- Billing internal data.
- Settlement internal data.
- Vendor contract rules.
- Supervisor internal review notes.
- Engineer internal comments.
- Raw LINE / provider channel ids.
- Token / secret.
- Unmasked photos.
- Raw signature file or unnecessary sensitive evidence.
- Unrelated customer history.
- Internal complaint handling notes.
- Internal risk flags.

Customer-facing content should be generated from approved visible fields, not raw completion submission.

## 9. Data Access And Organization Isolation

Future review / handoff workflow must preserve the shared data access model.

Principles:

- Review and handoff workflows must follow organization isolation.
- Dispatcher, admin, supervisor, and customer service can see only authorized data within their organization scope.
- Engineer task isolation must not be broken by review workflow.
- Entitlement is not permission.
- Even if an organization has a feature entitlement, a user still needs role permission.
- Usage tracking must not include unnecessary sensitive payload.
- Admin permission must not be used to hide or bypass isolation problems.
- Customer-facing projections must follow customer visible data policy.
- Internal review content must not leak into customer-facing reports.

Review workflows must be auditable when implemented in the future.

## 10. AI Boundary

AI can support review and handoff only as an assistant layer.

AI may:

- Summarize completion submission.
- Generate Field Service Report draft wording.
- Classify fault reason.
- Organize parts description.
- Classify exception reason.
- Flag complaint or follow-up risk.
- Suggest missing evidence checks.

AI must not:

- Automatically create the formal Field Service Report.
- Automatically close the Case.
- Automatically resolve or override `finalAppointmentId`.
- Automatically approve customer fees.
- Automatically approve quotes.
- Automatically approve settlement.
- Automatically close complaints.
- Modify survey rating or customer feedback.
- Hide negative feedback.
- Bypass permission or organization scope.
- Receive tokens or secrets.
- Receive complete customer mobile/address values by default.
- Receive raw signature data.
- Receive unmasked photos by default.
- Receive full audit log text.
- Receive full internal note text by default.
- Receive full billing/settlement internal data by default.

AI-generated drafts must remain separate from official records until accepted by authorized workflow or deterministic business logic.

## 11. Future Runtime Sequencing Notes

This section is proposal only and does not authorize implementation.

If future runtime is explicitly authorized, recommended sequence:

1. Runtime authorization evidence.
2. Exact file touch plan.
3. Route/controller skeleton only.
4. Engineer auth/session boundary.
5. Task list/detail resolver boundary.
6. Completion submission skeleton.
7. Field Service Report draft/source data handoff skeleton.
8. Review queue / admin handoff design.
9. Synthetic fixtures only if separately authorized.
10. Tests only if separately authorized.
11. Database/repository only if separately authorized.

Do not skip directly from docs readiness into DB-backed review queues, admin UI, provider sending, AI/RAG, or formal report mutation without explicit scoped authorization.

## 12. Explicit Non-goals For Task463

Task463 does not:

- Implement runtime.
- Modify backend `src/`.
- Modify admin `src/`.
- Add API.
- Add route / controller / resolver / repository.
- Add mobile web.
- Add PWA.
- Add UI components.
- Add login/session runtime.
- Add permission runtime.
- Add review queue runtime.
- Add Field Service Report draft runtime.
- Add upload.
- Add signature capture.
- Add object/file storage.
- Add database schema.
- Add migration or index.
- Touch Migration020.
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

## 13. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Engineer completion submission creates only draft/source data, not a second formal Field Service Report.
- Normal completion path preserves one Case / one formal Field Service Report.
- Exception outcomes enter review/follow-up instead of false completion.
- Admin/supervisor review cannot create duplicate formal reports.
- `finalAppointmentId` remains system-determined.
- Engineer cannot manually select `finalAppointmentId`.
- Customer-facing report excludes internal notes, audit log, AI raw payload, billing/settlement internal data, raw channel ids, tokens/secrets, unmasked photos, and raw signature files.
- Cross-organization review access is denied safely.
- AI summary uses only authorized, minimized, redacted context.
- Negative feedback and complaint risk cannot be hidden or auto-closed by AI.

These are future implementation tests only. Task463 does not add tests.

## 14. Completion Checklist For This Memo

Task463 completion should confirm:

- Modified files.
- Whether the task is docs-only.
- Implementation summary.
- Non-implemented scope.
- Verification results.
- Whether `docs/PROJECT_GUARDRAILS.md` was violated.
- Whether any data table, API, permission logic, audit log, smoke test, test, or fixture was added or modified.
- Whether any sensitive data, token, secret, personal data, LINE logic, or runtime provider was touched.
- Whether customer channel identity, organization isolation, SaaS-ready, entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO behavior was affected.
- Whether `NO RUNTIME AUTHORIZATION` remains true.

## 15. Runtime Decision

No runtime behavior is changed by Task463.

`NO RUNTIME AUTHORIZATION` remains in effect.

## 16. Migration / Schema Decision

No migration, schema, or index change is introduced by Task463.
