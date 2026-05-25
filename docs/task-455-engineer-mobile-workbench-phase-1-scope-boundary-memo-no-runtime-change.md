# Task455 - Engineer Mobile Workbench Phase 1 Scope Boundary Memo / No Runtime Change

## Status

Task455 is a docs-only / future design memo / no runtime change task.

This memo records the Phase 1 product scope, non-goals, data boundary, permission boundary, and future runtime authorization conditions for the Engineer Mobile Workbench / 工程師手機工作台.

This task does not implement any Engineer Mobile Workbench runtime, mobile web, PWA, native app, upload, signature capture, offline sync, LINE push, notification sending, API, database schema, migration, fixture, test, smoke, provider integration, AI provider, RAG, or vector database behavior.

## 1. Phase 1 Positioning

Engineer Mobile Workbench Phase 1 should be a lightweight field work surface for engineers, not a full native mobile app program.

Recommended Phase 1 positioning:

- Engineer Mobile Workbench / 工程師手機工作台.
- Mobile web, PWA, LIFF-like mobile web entry, or installable Web App.
- Low-cost and fast iteration before committing to full iOS / Android native apps.
- Focus on daily field work completion, not a complete mobile app ecosystem.

Phase 1 should not prioritize:

- Full native iOS / Android App.
- Complex engineer scheduling app.
- Engineer LINE push notification dependency.
- Heavy offline synchronization system.
- Overly detailed field forms.
- AI-driven automatic decisions in the field workflow.

## 2. Phase 1 Required Capabilities

Phase 1 should cover only the minimum field workflow needed for engineers to complete assigned visits safely and simply.

Required capabilities:

- Engineer login.
- Permission check.
- Engineer can only view assigned or explicitly authorized tasks.
- Today / upcoming task list.
- Task detail page.
- Customer address and contact information, shown only when allowed by permission and data minimization policy.
- Appointment time.
- Product / reported issue / service note / attention items.
- Arrival / start work / completion status actions.
- Short completion form.
- Photo upload as future runtime capability.
- Parts replacement record.
- Fault reason and repair action.
- Customer signature or signature exception reason.
- Completion submit as a source for Field Service Report data.

These capabilities describe future scope only. Task455 does not implement any of them.

## 3. Core Invariants

Engineer Mobile Workbench must preserve the existing field service model:

- One Case has one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Appointment / dispatch visit records hold per-visit outcomes.
- Field Service Report is the Case-level formal completion summary.
- The one-open-appointment invariant must not be weakened.
- `finalAppointmentId` should be resolved by the system based on the final completed appointment.
- Engineers should not manually choose `finalAppointmentId` in the normal flow.
- Manual `finalAppointmentId` selection is only an admin exception / override path, not a field engineer workflow.

Engineer Mobile Workbench must not introduce a per-visit formal report model.

## 4. Engineer UX Principles

Engineer UX must stay simple, fast, and low burden.

Phase 1 UX principles:

- Mobile-first layout.
- Large buttons.
- Few fields.
- Short text.
- Fast completion.
- Photo capture / upload support as future runtime.
- Customer signature or signature exception support as future runtime.
- Weak-network draft saving as future design.
- Avoid long back-office style forms.
- Engineers should enter only necessary field information.
- System and AI can later help transform concise input into structured records.

The workbench should help engineers finish field work; it should not transfer office, finance, supervisor, settlement, or AI complexity into the field form.

## 5. LINE Boundary

Engineer Mobile Workbench should not depend on LINE push notifications by default.

LINE may be used in the future only as:

- A quick login entry.
- An identity binding entry.
- A shortcut to open the Engineer Mobile Workbench.

LINE should not be required for:

- Engineer task management.
- Engineer notification delivery.
- Engineer workbench availability.
- Field service completion.

Design rationale:

- Avoid unnecessary LINE message cost.
- Avoid notification management complexity.
- Avoid hard-coding the engineer workflow into LINE.
- Preserve future App, Web, SMS, email, and other channel flexibility.

## 6. AI Boundary

AI can support Engineer Mobile Workbench only as an assistant layer.

AI may assist with:

- Turning short engineer input into a standardized completion summary.
- Fault reason classification suggestions.
- Parts replacement information organization.
- Field Service Report draft completion.
- Photo / nameplate / serial label extraction as future design.
- Missing photo, signature, serial, or parts reminders.
- Future learning from engineer completion outcomes.

AI must not:

- Increase the engineer's field form burden.
- Require engineers to fill extra AI-specific fields.
- Bypass permission or organization scope.
- Automatically forge arrival records.
- Automatically forge customer signatures.
- Automatically approve quotes.
- Automatically approve settlement or official fee decisions.
- Automatically change official Case / Appointment / Field Service Report status.
- Automatically close complaints.
- Write uncertain content directly into official records.

AI output must remain separate from official records until accepted by authorized human workflow or deterministic business logic.

## 7. Data And Security Boundary

Engineer Mobile Workbench must follow the shared project data access model.

Required boundaries:

- Organization isolation.
- Engineer task isolation.
- Role and permission checks.
- Minimum necessary data.
- Customer-visible vs internal data separation.
- Field-level masking and sensitive data redaction where applicable.
- Audit log for important actions.
- Object / file storage for photos, signatures, and documents as future runtime design.
- No exposure of internal notes, audit logs, AI raw payload, billing internal data, or settlement internal data to engineers unless explicitly authorized.

Sensitive data must not be logged or exposed unnecessarily:

- Tokens.
- Secrets.
- LINE access tokens.
- LINE channel secrets.
- Raw LINE user ids.
- Full customer phone / mobile values.
- Full raw payloads.
- Customer signatures.
- Unmasked photos.
- AI raw sensitive payload.

## 8. Data Flow Boundary

Future Engineer Mobile Workbench data flow should align with:

Case -> Appointment / Dispatch Visit -> Field Service Report -> Service Parts -> Photos / Signature -> Completion Confirmation.

Phase 1 should treat engineer completion input as a source for:

- Appointment / dispatch visit outcome.
- Service parts usage.
- Photo metadata and file attachment references.
- Signature or signature exception evidence.
- Field Service Report draft or completion data.
- Audit log.

The workbench should not create a second formal Field Service Report for the same Case.

## 9. Explicit Non-goals For Task455

Task455 does not:

- Implement runtime.
- Implement Engineer Mobile Workbench.
- Implement App.
- Implement mobile web.
- Implement PWA.
- Implement upload.
- Implement signature capture.
- Implement offline sync.
- Implement LINE push.
- Add database schema.
- Add migration.
- Modify Migration020.
- Add API.
- Modify API.
- Add route / controller / resolver / repository.
- Add tests / fixtures / smoke.
- Modify package files.
- Modify inventory docs.
- Call AI provider.
- Use RAG or vector database.
- Send notifications through LINE / SMS / Email / App.
- Access shared / production / Zeabur runtime.

## 10. Future Runtime Authorization Conditions

Any future runtime task for Engineer Mobile Workbench requires separate, explicit, scoped authorization.

Future authorization should name:

- Allowed files or modules.
- Whether backend `src/` may be modified.
- Whether admin `src/` may be modified.
- Whether a new frontend/mobile surface may be created.
- Whether new API endpoints may be added.
- Whether file upload or signature capture may be implemented.
- Whether tests / fixtures / smoke may be added.
- Whether migration or schema changes are allowed.
- Whether local-only runtime or browser testing is authorized.
- Whether any notification provider may be touched.
- Whether AI provider / RAG / vector DB is in scope.

General words such as "continue", "go ahead", or "start runtime" must not be treated as authorization for DB, migration, provider sending, AI/RAG/vector DB, backend runtime, admin runtime, upload, signature, or mobile implementation.

## 11. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Engineers only see assigned or authorized tasks.
- Cross-organization access is denied safely.
- Engineer completion does not create a second formal Field Service Report.
- `finalAppointmentId` remains system-determined.
- Engineer cannot manually override `finalAppointmentId` in normal flow.
- Completion input can create or update only allowed appointment / service report draft fields.
- Photos and signatures use file/object storage references, not large blobs in core tables.
- Sensitive fields are masked or omitted.
- Internal notes, audit logs, AI raw payload, billing internal data, and settlement internal data are not exposed.
- Weak-network draft behavior does not duplicate completion writes.
- LINE push is not required for task visibility.
- AI suggestions remain separate from official records.

These are future implementation tests only. Task455 does not add tests.

## 12. Completion Checklist For This Memo

Task455 completion should confirm:

- Modified files.
- Whether the task is docs-only.
- Implementation summary.
- Non-implemented scope.
- Verification results.
- Whether `docs/PROJECT_GUARDRAILS.md` was violated.
- Whether any data table, API, permission logic, audit log, smoke test, test, or fixture was added or modified.
- Whether any sensitive data, token, secret, personal data, LINE logic, or runtime provider was touched.
- Whether customer channel identity, organization isolation, SaaS-ready, entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO behavior was affected.

## 13. Runtime Decision

No runtime behavior is changed by Task455.

## 14. Migration / Schema Decision

No migration, schema, or index change is introduced by Task455.
