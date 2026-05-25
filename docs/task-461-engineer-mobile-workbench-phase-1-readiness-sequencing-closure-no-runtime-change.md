# Task461 - Engineer Mobile Workbench Phase 1 Readiness and Sequencing Closure / No Runtime Change

## Status

Task461 is a docs-only / readiness closure / sequencing memo / no runtime change task.

This memo closes the current Engineer Mobile Workbench Phase 1 design branch by summarizing Task455 through Task460, confirming the accepted baseline, preserving the no-runtime authorization state, and defining the minimum future cutline if runtime skeleton work is explicitly authorized later.

Current state:

- Engineer Mobile Workbench Phase 1 design branch has completed one docs-readiness pass.
- Current status is `NO RUNTIME AUTHORIZATION`.
- Task461 does not grant runtime approval.
- Task461 does not grant fixture or test implementation approval.
- Task461 does not grant database, migration, provider, or AI approval.
- Task461 does not authorize shared/prod/Zeabur runtime access.

## 1. Task455-Task460 Summary

Completed design memos:

- Task455: Phase 1 scope boundary.
- Task456: Data access / permission boundary matrix.
- Task457: Status transition and completion submission boundary.
- Task458: Completion payload and file evidence boundary.
- Task459: UX flow and screen boundary.
- Task460: Future API contract boundary draft.

Together, these documents define the minimum Phase 1 product, data, permission, workflow, UX, evidence, and future API boundaries for Engineer Mobile Workbench before implementation.

## 2. Phase 1 Accepted Design Baseline

Phase 1 accepted baseline:

- The first stage is Engineer Mobile Workbench / 工程師手機工作台.
- Prefer mobile web, PWA, LIFF-like mobile entry, or installable Web App.
- Do not prioritize a full native iOS / Android App first.
- Do not depend on LINE push notifications as the required engineer task management channel.
- LINE may be a future quick login, identity binding, or shortcut entry only.
- Engineers should actively log into the workbench to see assigned tasks.
- The workbench must be simple, mobile-first, low-burden, and role-scoped.

Phase 1 should focus on the smallest useful field workflow, not a complete engineer app ecosystem.

## 3. Core Workflow Invariants

Engineer Mobile Workbench must preserve the core field service model.

Required invariants:

- One Case ultimately has one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- One Case should not have multiple unfinished appointments at the same time.
- Engineer completion submission is Field Service Report draft/source data.
- Multiple appointments must not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be weakened.
- `finalAppointmentId` is resolved by the system based on the final completed appointment.
- Engineers do not manually select `finalAppointmentId` in the normal flow.
- Admin override, if ever allowed, requires future permission, reason, evidence, and audit design.

These invariants are implementation blockers. Runtime tasks must not weaken them.

## 4. Data Access Baseline

Engineer data access must remain assignment-scoped and tenant-isolated.

Baseline:

- Engineers can see only their assigned or explicitly authorized appointments / dispatch visits.
- Organization isolation is mandatory.
- Engineer task isolation is mandatory.
- Responses should be allow-list first.
- Responses should include only minimum necessary data.
- Cross-organization task access must be denied safely.
- Unassigned task access must be denied safely.

Engineer-facing responses must not expose:

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

Future runtime should include response equivalence tests for forbidden vs not-found scenarios before broad release.

## 5. UX And Payload Baseline

Phase 1 UX and payload should stay small.

UX baseline:

- Mobile-first.
- Large buttons.
- Few fields.
- Short text.
- Fast completion.
- Clear next action.
- Minimal page depth.
- No back-office style form burden.
- Future weak-network draft save is only a design idea, not an implemented feature.

Payload baseline:

- Completion submission should be concise.
- Required fields should be limited to assignment reference, engineer context, outcome, timestamp, and basic handling result.
- Outcome-specific evidence may be required for unable-to-complete, pending parts, customer unavailable, and signature exception cases.
- Photos, parts, signature, and signature exception remain future runtime design.
- Photos and signatures should use object/file storage in future runtime.
- Raw photo or signature data should not appear in audit log, notification payload, AI context, or customer-facing report by default.

## 6. AI Boundary Baseline

AI can assist but must not own official field decisions.

AI may assist with:

- Summarizing short engineer input.
- Fault classification suggestions.
- Parts organization.
- Completion wording drafts.
- Missing evidence reminders.
- Future photo/nameplate/serial extraction if separately authorized.

AI must not:

- Increase engineer form burden.
- Bypass permission.
- Read unauthorized tasks.
- Read cross-organization data.
- Receive token, secret, complete customer mobile/address, raw signature, unmasked photo, full audit log text, full internal note text, or full billing/settlement internal data by default.
- Automatically create a formal Field Service Report.
- Automatically close a Case.
- Automatically resolve or override `finalAppointmentId`.
- Automatically approve fees, settlement, quotes, or complaint handling.
- Trigger provider sending.

AI output must remain separate from official records until accepted by authorized workflow or deterministic business logic.

## 7. Future Runtime Sequencing Proposal

This is proposal only and does not authorize implementation.

If the user later explicitly authorizes runtime work, recommended sequencing is:

1. Runtime authorization evidence confirmation.
2. File touch plan.
3. Route/controller skeleton only.
4. Engineer auth/session boundary skeleton.
5. Task list resolver skeleton.
6. Task detail resolver skeleton.
7. Permission / assignment guard skeleton.
8. Projection DTO / allow-list response skeleton.
9. Generic safe-deny response skeleton.
10. Completion submission skeleton.
11. Photo/signature metadata-only skeleton.
12. Synthetic fixtures only if separately authorized.
13. Minimal tests only if separately authorized.
14. Database/repository/persistence only if separately authorized.
15. Provider sending only if separately authorized.
16. AI/RAG/vector DB only if separately authorized.

This sequencing intentionally starts with a narrow skeleton cutline and delays persistence, provider sending, AI/RAG, and DB changes until explicitly approved.

## 8. Smallest Future Runtime Task If Explicitly Authorized

If runtime is explicitly authorized, the smallest safe first task should be:

`Engineer Mobile Workbench route/controller skeleton only`

That smallest task should not include:

- Database access.
- Repository implementation.
- Fixtures or tests unless separately authorized.
- Upload.
- Signature capture.
- Object/file storage.
- Provider sending.
- AI/RAG/vector DB.
- Official Case / Appointment / Field Service Report status mutation.
- Shared/prod/Zeabur runtime access.

The purpose of the first runtime skeleton would be to establish guarded routing boundaries without changing business behavior.

## 9. Required Authorization Before Any Runtime

Before any Engineer Mobile Workbench runtime work, the user must provide explicit authorization for:

- Runtime implementation.
- Exact file scope.
- Exact command scope.
- Whether backend `src/` may be touched.
- Whether admin `src/` or a mobile frontend may be touched.
- Whether tests / fixtures / smoke may be added.
- Confirmation that DB / migration work is not allowed, or explicit limited DB authorization if ever intended.
- Confirmation that provider sending is not allowed, or explicit provider authorization if ever intended.
- Confirmation that AI/RAG/vector DB work is not allowed, or explicit AI/RAG authorization if ever intended.
- Confirmation that no production data is involved.
- Confirmation that shared/prod/Zeabur runtime access is not allowed unless separately approved.
- Sensitive scan plan.
- Stop conditions.

General statements such as "continue", "go ahead", or "start the next task" must not be interpreted as runtime, DB, migration, provider, AI/RAG, upload, signature, or mobile implementation authorization.

## 10. Stop Conditions

Future work should stop and ask for explicit authorization if it would require:

- Modifying backend `src/`.
- Modifying admin `src/` or adding mobile UI.
- Adding API routes, controllers, resolvers, repositories, middleware, or services.
- Adding or modifying database schema, migration, or index.
- Touching Migration020.
- Adding fixtures, tests, smoke, or browser tests.
- Running DB / DDL / psql / migration commands.
- Implementing upload, signature capture, object/file storage, offline sync, or draft saving.
- Sending LINE / SMS / Email / App notifications.
- Calling AI provider, RAG, vector DB, or embedding services.
- Accessing shared/prod/Zeabur runtime.
- Using production data or raw personal data.
- Emitting token, secret, raw LINE id, customer mobile, raw payload, or provider credentials.

These stop conditions preserve the docs-only branch boundary.

## 11. Explicit Non-goals For Task461

Task461 does not:

- Implement runtime.
- Implement mobile web.
- Implement PWA.
- Implement UI components.
- Add API.
- Add route / controller / resolver / repository.
- Implement login/session runtime.
- Implement permission runtime.
- Implement upload.
- Implement signature capture.
- Implement object/file storage.
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

## 12. Future Test Readiness Notes

No tests are added by Task461.

Future tests, if separately authorized, should eventually cover:

- Engineer can see only assigned or authorized tasks.
- Cross-organization and unassigned task access are safely denied.
- Responses exclude internal, financial, audit, raw provider, and unrelated data.
- Engineer cannot manually select or override `finalAppointmentId`.
- Completion submission cannot create duplicate Field Service Reports.
- State actions operate only on appointment / dispatch visit records.
- Safe-deny response equivalence prevents resource enumeration.
- Future upload/signature metadata does not expose raw file contents.
- AI uses only authorized, minimized, redacted context.
- LINE push is not required for task visibility.

These are future implementation tests only.

## 13. Completion Checklist For This Memo

Task461 completion should confirm:

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

## 14. Runtime Decision

No runtime behavior is changed by Task461.

`NO RUNTIME AUTHORIZATION` remains in effect.

## 15. Migration / Schema Decision

No migration, schema, or index change is introduced by Task461.
