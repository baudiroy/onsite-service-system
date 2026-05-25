# Task465 - Engineer Mobile Workbench Phase 1 Risk Register and Mitigation Matrix / No Runtime Change

## Status

Task465 is a docs-only / risk register and mitigation design memo / no runtime change task.

This memo creates a Phase 1 risk register for Engineer Mobile Workbench and maps each major risk to guardrails, proposed mitigations, stop conditions, and future authorization needs.

Current status remains:

```text
Engineer Mobile Workbench Phase 1 docs branch remains NO RUNTIME AUTHORIZATION.
```

## 1. Non-authorization Statement

Task465 is not:

- Runtime approval.
- Route/controller skeleton approval.
- API approval.
- Mobile UI approval.
- Database approval.
- Migration approval.
- Migration020 approval.
- Fixture or test approval.
- Provider sending approval.
- AI/RAG/vector database approval.
- Shared/prod/Zeabur access approval.

Task465 only organizes risks and mitigations. It does not start implementation.

## 2. Current Status

Engineer Mobile Workbench Phase 1 docs branch is still docs-only.

Current design inputs:

- Task455: Phase 1 scope boundary.
- Task456: Data access / permission boundary matrix.
- Task457: Status transition and completion submission boundary.
- Task458: Completion payload and file evidence boundary.
- Task459: UX flow and screen boundary.
- Task460: Future API contract boundary draft.
- Task461: Readiness and sequencing closure.
- Task462: Runtime authorization decision packet.
- Task463: Completion review and admin handoff boundary.
- Task464: Audit evidence and retention boundary.

Important interpretation:

- "Continue developing the system" is not runtime authorization.
- Task465 does not authorize route/controller skeleton work.
- Task465 does not authorize fixtures, tests, database work, provider sending, or AI/RAG/vector DB calls.

## 3. Risk Register Field Definitions

Risk register columns:

- Risk ID.
- Risk area.
- Risk description.
- Impact.
- Existing guardrail / design reference.
- Proposed mitigation.
- Stop condition.
- Runtime required? yes/no/future.
- Test required? yes/no/future.
- DB/migration required? yes/no/future.
- Provider / AI involved? yes/no/future.

The register is intentionally conservative: most mitigations are future implementation requirements, not current runtime actions.

## 4. Risk Register And Mitigation Matrix

| Risk ID | Risk area | Risk description | Impact | Existing guardrail / design reference | Proposed mitigation | Stop condition | Runtime required? | Test required? | DB/migration required? | Provider / AI involved? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EMW-R01 | Assignment isolation | Engineer sees an unassigned task. | Data leakage and unauthorized work. | Task456 data access matrix; Task460 request/response boundary. | Enforce authenticated engineer context plus assignment/authorization guard. | Any task query not scoped to engineer assignment. | Future | Future | No by default | No |
| EMW-R02 | Organization isolation | Cross-organization data leaks in list/detail/review. | Tenant isolation breach. | PROJECT_GUARDRAILS; Task456; Task460; Task464. | Mandatory organization filter and safe-deny for cross-scope access. | Any missing organization scope in future runtime. | Future | Future | No by default | No |
| EMW-R03 | Resource enumeration | Task list or detail leaks whether a task exists. | Privacy and enumeration risk. | Task459 safe-deny UX; Task460 safe-deny boundary. | Generic safe-deny and response equivalence. | Any differentiated forbidden vs not-found response. | Future | Future | No | No |
| EMW-R04 | Response overexposure | Task detail returns internal note, audit log, AI raw payload, billing or settlement internal data. | Internal data leakage. | Task456 non-visible matrix; Task460 response allow-list. | Allow-list first projection DTO and forbidden-field scan. | Any response containing internal-only fields. | Future | Future | No | Future for AI scan |
| EMW-R05 | Final appointment override | Engineer manually selects or overwrites `finalAppointmentId`. | Breaks backend/system source of truth. | Task457 and Task460 final appointment boundary. | Reject engineer-supplied final appointment fields; system-owned inference only. | Any engineer UI/API field that sets final appointment. | Future | Future | No | No |
| EMW-R06 | Duplicate formal report | Multi-appointment workflow creates multiple formal FSRs. | Breaks one Case / one formal report invariant. | Task455-Task463 FSR boundary. | Keep completion submission as draft/source data; formal report backend guard. | Any per-visit formal report creation path. | Future | Future | No by default | No |
| EMW-R07 | Report uniqueness | `field_service_reports.case_id` uniqueness is weakened. | Core schema invariant failure. | Task455-Task463 core invariants. | Do not change uniqueness without explicit schema decision and review. | Any proposed schema/migration weakening uniqueness. | No for current docs | Future if schema touched | Future only with explicit approval | No |
| EMW-R08 | Completion meaning drift | Completion submission is treated as formal FSR completion. | False completion and incorrect customer/report state. | Task457 status boundary; Task463 handoff positioning. | Label as field input/draft source; formal completion requires backend validation. | Any runtime that closes Case solely from field submit. | Future | Future | No by default | No |
| EMW-R09 | Wrong state layer | Arrival/start/completion are written to Case layer instead of appointment/dispatch visit layer. | Case lifecycle corruption. | Task457 status layer definitions. | Keep field progress on appointment/dispatch visit layer. | Any direct Case status mutation from mobile status action. | Future | Future | No by default | No |
| EMW-R10 | Unauthorized dispatch mutation | Cancellation/reschedule field report directly changes official appointment. | Dispatch control bypass. | Task457 and Task459 state UX boundary. | Treat as field report signal for dispatcher/customer service review. | Any engineer action that creates official reschedule directly. | Future | Future | No by default | No |
| EMW-R11 | Signature overblocking | Missing signature blocks all completion incorrectly. | Field workflow deadlock. | Task458 signature exception boundary. | Support signature exception reason and evidence; route high-risk cases to review. | Any rule requiring signature for every completion without exception. | Future | Future | No by default | No |
| EMW-R12 | Exception under-review | Refused/representative/remote completion lacks review path. | Dispute and audit risk. | Task463 exception review path; Task464 review evidence. | Future review queue/follow-up/escalation with reason codes. | Any exception stored only as free text without review policy. | Future | Future | Future if review persisted | No |
| EMW-R13 | Raw file leakage | Raw photo or raw signature enters audit log or notification. | Sensitive evidence leakage. | Task458 file boundary; Task464 file evidence boundary. | Store file metadata references, not binary; provider payload allow-list. | Any binary file content in audit/notification payload. | Future | Future | Future if storage schema added | Provider future |
| EMW-R14 | AI file exposure | Unmasked photo is sent to AI provider. | Personal/sensitive data exposure. | Cloud AI guardrails; Task458/Task464 AI boundary. | Redaction/masking and minimum context policy before AI. | Any raw unmasked file sent externally. | Future | Future | No by default | AI future |
| EMW-R15 | Customer-facing leakage | Customer-facing report exposes internal data. | Customer privacy, trust, and legal risk. | Task458 customer-facing policy; Task463 report boundary. | Projection allow-list and customer-visible field map. | Any internal-only field in customer-facing report. | Future | Future | No by default | No |
| EMW-R16 | Sensitive engineer note | Engineer note includes sensitive data and leaks outward. | Privacy and internal leakage. | Task458 engineer internal note boundary. | Separate internal note from customer-facing summary; redaction reminders. | Any raw internal note used as customer-facing content. | Future | Future | No | AI future if summarizing |
| EMW-R17 | LINE dependency | LINE becomes required for engineer task management. | Channel lock-in and cost/operational complexity. | Task455 LINE boundary; Task459 task list UX. | Engineer logs into workbench directly; LINE shortcut only. | Any design requiring LINE push for task visibility. | Future | Future | No | Provider future |
| EMW-R18 | Raw channel id exposure | Raw LINE/provider channel id appears in UI/log/report. | Identity leakage. | Data access guardrails; Task456 non-visible data. | Use internal references and masking; never expose raw channel ids. | Any raw channel id in response/log/customer output. | Future | Future | No | Provider future |
| EMW-R19 | AI permission bypass | AI reads unauthorized tasks or cross-organization data. | Tenant and permission breach. | Closed-domain AI guardrails; Task456/Task460 AI boundary. | Permission-aware retrieval with organization and assignment filters. | Any AI retrieval without permission scope. | Future | Future | No by default | AI future |
| EMW-R20 | AI autonomous decision | AI approves formal completion, fees, settlement, quote, or complaint closure. | Unauthorized business decision. | Project AI-ready boundary; Task455-Task464 AI boundaries. | AI advisory-only; human or deterministic logic controls official decisions. | Any AI output directly mutating official decisions. | Future | Future | No | AI future |
| EMW-R21 | Retry duplication | Weak network/retry creates duplicate submission. | Duplicate evidence, duplicate report risk, state confusion. | Task459 draft/failure UX; Task461 future tests. | Idempotency key and duplicate-submission guard in future runtime. | Any retry path without idempotency plan. | Future | Future | No by default | No |
| EMW-R22 | Repeat submission side effects | Repeated submission creates duplicate FSR or corrupts state. | Completion integrity failure. | Task109 repeat completion hardening; Task457/Task461. | Side-effect guards before formal completion; draft/source idempotency. | Any repeated action that mutates formal completion twice. | Future | Future | No by default | No |
| EMW-R23 | Audit over-retention | Audit/evidence stores excessive personal data. | Privacy and retention risk. | Task464 retention and minimization boundary. | Store metadata references and reason codes; define retention policy later. | Any full personal data in audit without policy. | Future | Future | Future if schema added | No |
| EMW-R24 | Review scope creep | Review queue/admin handoff is treated as runtime authorized. | Accidental implementation beyond docs. | Task463 and Task462 authorization gates. | Explicit runtime authorization required. | Any review queue file/runtime change without authorization. | No | No | No | No |
| EMW-R25 | Entitlement confusion | SaaS entitlement is treated as user permission. | Unauthorized access under enabled feature. | PROJECT_GUARDRAILS; Task456 security boundary. | Check entitlement and user permission separately. | Any feature gate without user permission guard. | Future | Future | No by default | No |
| EMW-R26 | Admin isolation bypass | Admin role hides organization isolation bug. | Cross-tenant access risk. | Data Access Control guardrail. | Admin still scoped by organization unless super-admin is separately designed. | Any admin path missing tenant scope. | Future | Future | No by default | No |
| EMW-R27 | Usage payload leakage | Usage tracking stores sensitive payload. | Billing/usage privacy leak. | SaaS usage guardrails; Task456 security boundary. | Store counts/categories, not raw content. | Any usage record containing raw customer or provider payload. | Future | Future | Future if usage schema added | Provider/AI future |
| EMW-R28 | Fixture data leak | Future fixture/test uses production data. | Sensitive data leakage. | Test authorization gate; synthetic fixture policy. | Synthetic-only fixtures and sensitive scan before commit. | Any real customer/provider payload in tests. | Future if tests authorized | Future | No | No |
| EMW-R29 | DB creep | Future skeleton task unexpectedly connects to DB/repository. | Runtime scope violation. | Task462 decision packet. | Keep first skeleton no-DB/no-repository unless explicitly authorized. | Any DB/repository import in skeleton-only task. | No unless authorized | Future | Future only with approval | No |
| EMW-R30 | Provider send creep | Future work triggers LINE/SMS/Email/App sending. | Customer-impacting side effect. | Notification/provider non-goals. | No provider integration without explicit authorization and no-send tests. | Any provider call or send-capable code path. | Future only with approval | Future | No by default | Provider future |

## 5. Mitigation Principles

Baseline mitigation principles:

- Allow-list first response.
- Generic safe-deny.
- Response equivalence for forbidden vs not-found cases.
- Minimum necessary data.
- Organization isolation.
- Engineer task isolation.
- No raw provider payload.
- No raw channel id exposure.
- No production data.
- No customer-facing internal data.
- One Case / one official Field Service Report.
- Appointment / dispatch visit owns visit-level outcomes.
- System-owned `finalAppointmentId`.
- AI advisory-only.
- File metadata reference, not binary in audit.
- Explicit authorization before runtime.
- Explicit authorization before tests / fixtures.
- Explicit authorization before database / repository / migration.
- Explicit authorization before provider sending.
- Explicit authorization before AI/RAG/vector database.

These principles should be converted into implementation checks only after explicit runtime authorization.

## 6. Stop Conditions

Future work must stop if any of the following appears unexpectedly:

- Unexpected backend `src/` change.
- Unexpected admin `src/` change.
- Unexpected API / route / controller / resolver / repository change.
- Unexpected database / DDL / migration / Migration020 change.
- Unexpected tests / fixtures / smoke change.
- Unexpected provider sending.
- Unexpected AI/RAG/vector database call.
- Production/shared/Zeabur access.
- Production data usage.
- Token, secret, or raw credential exposure.
- Full customer phone/address exposure.
- Raw LINE / channel id exposure.
- Attempt to create duplicate official Field Service Report.
- Attempt to let engineer manually choose `finalAppointmentId`.
- Attempt to mutate official Case / Appointment / Field Service Report state without explicit runtime authorization.

Stop conditions should be treated as stronger than schedule pressure or continuation momentum.

## 7. Future Verification Mapping

This section is proposal only and does not execute tests.

Potential future verification types:

- Static code review.
- Permission boundary unit tests.
- Response allow-list tests.
- Generic safe-deny equivalence tests.
- Duplicate submission tests.
- Field Service Report uniqueness tests.
- `finalAppointmentId` ownership tests.
- Synthetic fixture sensitive scan.
- No-provider-sending assertions.
- No-AI-provider assertions.
- No-database task guard where applicable.
- Customer-facing projection forbidden-field scan.
- Audit metadata sensitive-field scan.

These future tests require explicit test/fixture authorization.

## 8. Explicit Non-goals For Task465

Task465 does not:

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
- Add audit log runtime.
- Add evidence runtime.
- Add upload.
- Add signature capture.
- Add object/file storage.
- Add database schema.
- Add migration or index.
- Touch Migration020.
- Add tests / fixtures / smoke.
- Add browser tests.
- Run database / migration / psql commands.
- Send notifications through LINE / SMS / Email / App.
- Call AI provider.
- Use RAG or vector database.
- Modify package files.
- Modify inventory docs.
- Access shared / production / Zeabur runtime.

## 9. Completion Checklist For This Memo

Task465 completion should confirm:

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

## 10. Runtime Decision

No runtime behavior is changed by Task465.

`NO RUNTIME AUTHORIZATION` remains in effect.

## 11. Migration / Schema Decision

No migration, schema, or index change is introduced by Task465.
