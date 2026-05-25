# Task464 - Engineer Mobile Workbench Audit Evidence and Retention Boundary / No Runtime Change

## Status

Task464 is a docs-only / audit and evidence design memo / no runtime change task.

This memo defines future audit evidence, completion evidence, review evidence, and file metadata retention boundaries for Engineer Mobile Workbench Phase 1.

Current status remains `NO RUNTIME AUTHORIZATION`.

## 1. Non-authorization Statement

Task464 is not:

- Runtime approval.
- Audit log runtime approval.
- Evidence runtime approval.
- Database approval.
- Migration approval.
- Migration020 approval.
- API approval.
- Route/controller/resolver/repository approval.
- File storage approval.
- Upload or signature runtime approval.
- Fixture or test approval.
- Provider sending approval.
- AI/RAG/vector database approval.
- Shared/prod/Zeabur access approval.

Task464 only defines audit/evidence boundaries for future design.

## 2. Audit / Evidence Positioning

Audit log and evidence records serve governance and traceability purposes.

Positioning:

- Audit log is a future runtime governance requirement.
- Evidence record is future completion / review / exception supporting data.
- Task464 defines boundaries only.
- Task464 does not create tables.
- Task464 does not implement writes.
- Task464 does not design final schema.
- Evidence is not customer-facing report.
- Evidence is not billing / settlement approval.
- Evidence is not automatic completion confirmation.
- Evidence is not permission to expose raw files or sensitive payloads.

Audit/evidence should help answer who did what, when, under which organization and permission context, without becoming a sensitive-data dumping ground.

## 3. Future Auditable Event Candidates

Future auditable events may include the following proposal-only event types:

- Engineer login / session start, if needed by future security policy.
- Engineer task list viewed, with caution to avoid over-logging sensitive payload.
- Task detail viewed.
- Arrived / 到府.
- Started / 開始處理.
- Completion submitted.
- Unable to complete.
- Pending parts.
- Customer unavailable.
- Signature captured metadata.
- Signature exception reason submitted.
- Photo metadata registered.
- Replaced parts recorded.
- Admin / dispatcher / supervisor review opened.
- Review approved / rejected / returned for correction.
- Customer service follow-up created.
- Complaint / low score escalation linked.
- Permission denied.
- Cross-organization access denied.

These are future candidates only. Task464 does not add audit events.

## 4. Audit Event Minimum Fields

Future audit events should store only minimum necessary metadata.

Proposal-only minimum fields:

- Organization scope.
- Actor type.
- Actor id reference, avoiding raw identity leakage.
- Role / permission context reference.
- Case reference.
- Appointment / dispatch visit reference.
- Field Service Report draft/reference, if applicable.
- Action type.
- Timestamp.
- Result / outcome.
- Reason code, if applicable.
- Source channel / client type, without raw provider payload.
- Request correlation id, future design.
- Metadata reference, not raw sensitive payload.

Audit event design should prefer stable internal references and summarized metadata over raw customer content.

## 5. Data That Should Not Enter Audit Log

Audit log must not become a place to store sensitive raw data.

Do not write the following into audit logs:

- Token / secret / API key.
- Full phone number.
- Full address, unless future policy explicitly defines minimal authorized use.
- Raw LINE user id.
- Raw provider payload.
- Full customer message content unless a future minimum necessary policy explicitly allows it.
- Raw photo binary.
- Raw signature image.
- Unmasked photo.
- AI raw payload.
- Full audit log content embedded again inside audit log.
- Full internal note.
- Full billing / settlement internal data.
- Full vendor contract rule.
- Unrelated customer history.
- Cross-organization data.
- Password or password hash.
- Database connection URL or environment secret.

If a future workflow needs evidence that touches sensitive material, store a metadata reference and protect the underlying file or record with proper access control.

## 6. File Evidence Boundary

Photos, signatures, and attachments should use object/file storage in future runtime.

File evidence principles:

- Audit log stores file metadata reference, not binary.
- File metadata may include file type, purpose, created actor, created time, linked Case, linked appointment, linked Field Service Report draft/reference, and visibility flag.
- File access must be permission-aware and organization-scoped.
- Raw photo / signature should not appear in audit log.
- Raw photo / signature should not appear in provider notification payloads.
- Raw photo / signature should not appear in AI context by default.
- Raw photo / signature should not appear in customer-facing report by default.
- Unmasked photos must not be sent to an AI provider by default.
- Signature raw files must not become generally visible data.

Customer-facing display of photos or attachments requires separate future explicit visibility policy.

## 7. Review Evidence Boundary

Review evidence supports internal governance and exception handling.

Future review evidence may include:

- Supervisor review reason.
- Admin correction reason.
- Dispatcher confirmation reason.
- Customer service follow-up reason.
- Exception handling reason.
- Signature exception reason.
- Unresolved issue reason.
- Low score / complaint escalation reason.
- Returned-for-correction reason.
- Missing evidence reason.

Review evidence principles:

- Review evidence is internal governance data.
- Review evidence is not customer-facing by default.
- Review evidence must not contain unnecessary full personal data.
- Review evidence must not contain AI raw payload.
- Review evidence must not contain full billing / settlement internal rules.
- Review evidence must be organization-scoped and permission-controlled.
- Review evidence should record actor, timestamp, reason, result, and safe references.

Review evidence should make decisions traceable without exposing sensitive materials to unnecessary roles.

## 8. Customer-facing Report Separation

Customer-facing service report is not an audit/evidence record.

Boundaries:

- Customer-facing report can display only allow-listed fields that satisfy customer visible data policy.
- Customer-facing report must not display internal note.
- Customer-facing report must not display audit log.
- Customer-facing report must not display AI raw payload.
- Customer-facing report must not display supervisor internal review.
- Customer-facing report must not display billing / settlement internal data.
- Customer-facing report must not display vendor contract rules.
- Customer-facing report must not display raw LINE / provider channel ids.
- Customer-facing report must not display token / secret.
- If photos or attachments are shown, a future explicit visibility policy is required.
- If fees are shown, only confirmed customer-related charge / approval / invoice information should appear.

Evidence can support internal review, but it should not automatically become customer-facing content.

## 9. Data Retention And Minimization Principles

Future audit/evidence retention should follow data minimization and purpose limitation.

Future principles:

- Minimum necessary retention.
- Purpose limitation.
- Role-based access.
- Organization isolation.
- Retention period future policy.
- Deletion / redaction future policy.
- Export / report default should not include full personal data.
- Usage tracking should not include unnecessary sensitive payload.
- Entitlement is not permission.
- Retention policy should distinguish audit metadata, evidence metadata, raw files, customer-facing report, and internal review notes.
- Sensitive files should have stricter access and retention rules than ordinary metadata.

Task464 does not define final retention periods or deletion mechanisms.

## 10. AI Boundary

AI can help summarize trends in future audit/evidence workflows, but must not own governance records.

AI may:

- Summarize audit/evidence trends as future design.
- Classify exception/risk categories.
- Suggest missing evidence reminders.
- Help identify repeated issues or training opportunities.

AI must not:

- Receive raw signature by default.
- Receive unmasked photos by default.
- Receive token or secret.
- Receive complete customer mobile/address values by default.
- Receive full audit log text by default.
- Receive full internal note text by default.
- Receive full billing/settlement internal data by default.
- Rewrite audit log.
- Delete evidence.
- Hide negative feedback or complaints.
- Automatically approve review.
- Automatically approve fees, settlement, quotes, or formal completion.
- Bypass permission or organization scope.

AI output must remain advisory and separate from official audit/evidence records unless accepted through a future authorized workflow.

## 11. Future Runtime Sequencing Notes

This section is proposal only and does not authorize implementation.

If future audit/evidence runtime is explicitly authorized, sequencing should be conservative:

1. Runtime authorization evidence.
2. Exact file touch plan.
3. Audit/evidence event catalog finalization.
4. Safe metadata allow-list.
5. File metadata reference policy.
6. Permission and organization-scope guard design.
7. Storage/repository design only if separately authorized.
8. Tests only if separately authorized.
9. DB/migration only if separately authorized.

Do not implement audit/evidence tables or writes without explicit DB and runtime authorization.

## 12. Explicit Non-goals For Task464

Task464 does not:

- Implement runtime.
- Modify backend `src/`.
- Modify admin `src/`.
- Add API.
- Add route / controller / resolver / repository.
- Add audit log service.
- Add evidence service.
- Add file storage.
- Add upload runtime.
- Add signature runtime.
- Add review queue runtime.
- Add database schema.
- Add migration or index.
- Touch Migration020.
- Add tests / fixtures / smoke.
- Add browser tests.
- Run DB / migration / psql commands.
- Send notifications through LINE / SMS / Email / App.
- Call AI provider.
- Use RAG or vector database.
- Modify package files.
- Modify inventory docs.
- Access shared / production / Zeabur runtime.

## 13. Future Test Plan

When runtime is explicitly authorized in a future task, expected tests should cover:

- Audit metadata excludes tokens, secrets, raw LINE ids, full mobile values, raw payloads, raw photo binary, and raw signature images.
- File evidence stores references and metadata, not binary content in audit log.
- Customer-facing reports do not expose audit/evidence records.
- Review evidence remains internal by default.
- Cross-organization audit/evidence access is denied safely.
- AI does not receive raw signatures, unmasked photos, full audit logs, or full internal notes by default.
- Permission denied and cross-scope denied events avoid sensitive payloads.
- Retention/export behavior follows minimum necessary policy when implemented.

These are future implementation tests only. Task464 does not add tests.

## 14. Completion Checklist For This Memo

Task464 completion should confirm:

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

No runtime behavior is changed by Task464.

`NO RUNTIME AUTHORIZATION` remains in effect.

## 16. Migration / Schema Decision

No migration, schema, or index change is introduced by Task464.
