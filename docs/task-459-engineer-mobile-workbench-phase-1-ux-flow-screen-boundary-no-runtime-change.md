# Task459 - Engineer Mobile Workbench Phase 1 UX Flow and Screen Boundary / No Runtime Change

## Status

Task459 is a docs-only / UX flow design memo / no runtime change task.

This memo defines the Phase 1 Engineer Mobile Workbench mobile UX flow and screen boundaries. It describes the minimal engineer journey from login/session state, task list, task detail, arrival, start work, completion submission, photo/signature/exception handling, and submission feedback.

This task does not implement mobile web, PWA, UI components, login, session handling, API, route, controller, resolver, repository, upload, signature capture, object/file storage, offline sync, draft saving, database schema, migration, fixture, test, smoke, provider sending, AI provider, RAG, or vector database behavior.

## 1. Phase 1 UX Principles

Engineer Mobile Workbench Phase 1 should be simple enough for real field use.

UX principles:

- Mobile-first.
- Large buttons.
- Few fields.
- Short text.
- Fast completion.
- Minimal page depth.
- Clear next action.
- Future weak-network draft save support.
- No back-office style form burden.
- No requirement to fill extra AI-specific fields.
- AI should help behind the scenes by normalizing and summarizing concise input.

The workbench should reduce field friction. It should not turn engineers into data-entry clerks for finance, supervisor, AI, or back-office workflows.

## 2. Minimal Screen List

Phase 1 UX should focus on a small set of screens.

| Screen | Purpose | Boundary |
| --- | --- | --- |
| Engineer login / session state | Let engineer authenticate or see session status. | Task459 does not implement login/session. |
| Today / upcoming task list | Show assigned or authorized tasks. | Must not show other engineers' tasks or cross-organization data. |
| Task detail | Show minimum necessary visit information. | Must exclude internal, financial, audit, and raw provider data. |
| Arrival / start work action area | Record on-site progress. | Appointment / dispatch visit layer only. |
| Completion submission form | Collect concise field completion input. | Source/draft data for Field Service Report, not a second report. |
| Photo attachment area | Future photo evidence workflow. | Object/file storage references only in future runtime. |
| Parts replacement area | Future parts input workflow. | Does not automatically deduct inventory or approve costs. |
| Signature or exception area | Future signature/evidence workflow. | Signature capture not implemented by this task. |
| Submission result / failure / draft feedback | Show clear outcome after submit attempt. | Must avoid duplicate formal report creation and sensitive error leakage. |
| Safe-deny UX | Generic error for permission failure, missing task, or not-owned task. | Must not reveal whether a forbidden task exists. |

These are product boundaries only. Task459 does not build screens.

## 3. End-to-end Phase 1 Flow

Recommended minimal flow:

1. Engineer opens Engineer Mobile Workbench.
2. System shows login/session state.
3. Engineer lands on today / upcoming task list.
4. Engineer opens one assigned task.
5. Task detail shows minimum necessary context.
6. Engineer marks arrived.
7. Engineer marks started, if the workflow uses a separate start action.
8. Engineer selects outcome.
9. Engineer fills short completion or exception input.
10. Engineer adds photos, parts, signature, or exception information when required by the outcome and future runtime.
11. Engineer reviews a short submission summary.
12. Engineer submits.
13. UI shows success, safe failure, or future draft-saved state.

The normal path should be short. Exception paths should be available without making every visit feel like an exception case.

## 4. Task List UX Boundary

Task list should show only what the engineer needs to choose the next task.

Allowed task list content:

- Today tasks.
- Upcoming tasks.
- Appointment time.
- Short area/location cue, if permitted.
- Task status.
- Product or service category summary.
- Safe priority/attention indicator, if permitted.

Must not show:

- Cross-organization tasks.
- Other engineers' tasks.
- Internal notes.
- Billing or settlement internal data.
- Audit logs.
- AI raw payload.
- Raw channel identifiers.
- Tokens or secrets.
- Unrelated customer history.

LINE push must not be the required entry point. Engineers should be able to actively log into the workbench to see their assigned tasks.

## 5. Task Detail UX Boundary

Task detail should show minimum necessary data for the assigned visit.

Allowed task detail content:

- Appointment time.
- Customer on-site contact information, with role/masking policy.
- Address and relevant access instructions.
- Product information.
- Reported issue summary.
- Necessary service reminders.
- Safe prior service summary only if future policy allows minimum necessary history.
- Parts-to-bring or pending-parts hint, if future parts workflow allows.

Must not show:

- Internal note.
- Audit log.
- AI raw payload.
- Raw channel ids.
- Token / secret.
- Billing internal data.
- Settlement internal data.
- Vendor contract rules.
- Supervisor review notes.
- Customer complaint internal handling notes.
- Unrelated customer history.

Task detail should keep the primary action visible and avoid dense back-office information.

## 6. Status Operation UX Boundary

Status actions should be simple, obvious, and safe.

Engineer-operable status actions:

- Arrived / 到府.
- Started / 開始處理.
- Completion submitted / 完工送出.
- Unable to complete / 無法完工.
- Pending parts / 待料.
- Customer unavailable / 客戶不在.
- Cancellation or reschedule field report.

UX boundaries:

- Arrival and start are appointment / dispatch visit progress signals.
- Completion submission is field input for report workflow, not automatic duplicate report creation.
- Unable-to-complete, pending parts, customer unavailable, cancellation, and reschedule should ask for focused reasons.
- Cancellation or reschedule is a field report signal, not direct official dispatch mutation.
- Engineers must not create arbitrary new appointments from this screen.
- Engineers must not manually select `finalAppointmentId`.

State actions should avoid ambiguous labels that make the engineer think they are closing the entire Case unless backend validation and formal completion flow actually allow it.

## 7. Completion Form UX Boundary

Completion form should be short and outcome-sensitive.

Potential fields:

- Short completion description.
- Fault reason.
- Handling method.
- Replaced parts.
- Photo metadata / future upload reference.
- Customer signature or signature exception reason.
- On-site note, with sensitive-data reminder.

Design principles:

- Keep fields minimal.
- Show only outcome-relevant fields.
- Use clear labels.
- Avoid large text areas as the default.
- Avoid asking engineers for financial, settlement, supervisor, or AI-specific fields.
- Support future AI normalization without making engineers fill additional AI fields.
- Mark customer-facing vs internal content clearly in future UX.

The form should support formal data quality without making the field workflow feel heavy.

## 8. Signature And Exception UX

Signature UX should treat signature as important evidence, not as an absolute blocker for every completion.

Future UX should support:

- Customer signature.
- Refused to sign.
- Unable to sign.
- Customer unavailable.
- Remote completion.
- Representative / agent signed.
- Other business-approved exception.

Design principles:

- Signature capture is future runtime and not implemented by Task459.
- Signature exception reason should be selectable and concise.
- High-risk signature exception can route to future supervisor/customer service review.
- Exception reason should be visible to authorized internal users, not automatically customer-facing.
- Missing signature must not disappear into an unstructured note.

## 9. Submission Success, Failure, And Draft Feedback

Submission feedback should be clear and safe.

Success state:

- Confirm that field completion input was submitted.
- Show next step if formal review or backend completion remains pending.
- Avoid implying false Case closure when only field input was submitted.

Failure state:

- Use safe generic messages for permission or ownership failures.
- Avoid revealing whether an unauthorized task exists.
- Do not expose DB, provider, raw payload, token, or internal error details.
- Prevent accidental repeated submission that could risk duplicate formal report side effects.

Future weak-network draft state:

- May show draft saved locally or pending sync when runtime is explicitly authorized.
- Must avoid duplicate writes when network returns.
- Must not be treated as implemented by this task.

## 10. Field Service Report UX Boundary

Engineer UX must preserve the Field Service Report model.

Required boundaries:

- Engineer completion submission is Field Service Report draft/source data.
- Formal Field Service Report remains the Case-level completion summary.
- One Case has one formal Field Service Report.
- Multiple appointments / dispatch visits must not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be weakened.
- `finalAppointmentId` is system-determined.
- Engineers do not manually choose `finalAppointmentId`.

If the UX later shows Field Service Report status, it must distinguish field input submitted from formal report completed.

## 11. Safe-deny UX

Safe-deny UX must protect data visibility.

Safe-deny scenarios:

- Task not assigned to engineer.
- Task belongs to another organization.
- Task no longer exists or is unavailable.
- Session expired.
- Feature entitlement missing.
- Role permission missing.

Safe-deny principles:

- Use generic language.
- Do not reveal whether a forbidden task exists.
- Do not include customer information.
- Do not include raw ids or provider details.
- Do not expose internal permission rules.
- Offer a safe action such as return to task list or contact dispatcher/customer service.

## 12. AI UX Boundary

AI should reduce engineer effort, not add visible complexity.

AI may appear as:

- Suggested completion summary after the engineer submits concise input.
- Missing evidence reminder.
- Fault classification suggestion.
- Parts normalization suggestion.
- Draft wording for Field Service Report.

AI should not appear as:

- Extra required AI fields.
- Autonomous completion approval.
- Autonomous Case closure.
- Autonomous fee/settlement/quote approval.
- Hidden cross-task retrieval.
- Customer-visible raw AI response.

AI suggestions should be clearly separate from official records until accepted by authorized workflow.

## 13. Explicit Non-goals For Task459

Task459 does not:

- Implement runtime.
- Implement mobile web.
- Implement PWA.
- Implement UI components.
- Implement login.
- Implement session handling.
- Add API.
- Add route / controller / resolver / repository.
- Implement upload.
- Implement signature capture.
- Implement object/file storage.
- Implement offline sync.
- Implement draft saving.
- Add database schema.
- Add migration or index.
- Modify Migration020.
- Modify Field Service Report service behavior.
- Modify appointment runtime behavior.
- Add tests / fixtures / smoke.
- Add browser tests.
- Send notifications through LINE / SMS / Email / App.
- Call AI provider.
- Use RAG or vector database.
- Modify package files.
- Modify inventory docs.
- Access shared / production / Zeabur runtime.

## 14. Future Runtime Authorization Conditions

Any future runtime or UI task for Engineer Mobile Workbench UX requires separate, explicit authorization.

Future authorization should name:

- Whether a mobile frontend may be created.
- Whether admin `src/` may be touched.
- Whether backend `src/` may be touched.
- Whether API endpoints may be added.
- Whether login/session behavior is in scope.
- Whether upload, signature, object/file storage, or draft save is in scope.
- Whether tests, fixtures, smoke, or browser tests may be added.
- Whether DB schema or migration is allowed.
- Whether local-only browser testing is authorized.
- Whether provider sending is in scope.
- Whether AI/RAG/vector DB integration is in scope.

General continuation wording must not be treated as authorization for UI implementation, runtime, DB, migration, provider sending, AI/RAG/vector DB, upload, signature, or offline sync.

## 15. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Task list shows only assigned or authorized tasks.
- Task list does not show cross-organization or other engineer tasks.
- Task detail excludes internal notes, audit logs, AI raw payload, billing internal data, and settlement internal data.
- Arrived/start/completion actions apply only to authorized appointment / dispatch visit records.
- Completion submit does not create duplicate formal Field Service Reports.
- UI distinguishes field input submitted from formal report completed.
- Engineer cannot manually select `finalAppointmentId`.
- Signature exception can be submitted with reason when signature is absent.
- Permission failure uses safe-deny copy.
- Network retry or future draft sync does not duplicate completion.
- LINE push is not required for task visibility.
- AI suggestion UI remains optional and separate from official records.

These are future implementation tests only. Task459 does not add tests.

## 16. Completion Checklist For This Memo

Task459 completion should confirm:

- Modified files.
- Whether the task is docs-only.
- Implementation summary.
- Non-implemented scope.
- Verification results.
- Whether `docs/PROJECT_GUARDRAILS.md` was violated.
- Whether any data table, API, permission logic, audit log, smoke test, test, or fixture was added or modified.
- Whether any sensitive data, token, secret, personal data, LINE logic, or runtime provider was touched.
- Whether customer channel identity, organization isolation, SaaS-ready, entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO behavior was affected.

## 17. Runtime Decision

No runtime behavior is changed by Task459.

## 18. Migration / Schema Decision

No migration, schema, or index change is introduced by Task459.
