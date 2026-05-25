# Task 357 - Customer-visible Localization Key Catalog Proposal / No Runtime Change

## Scope Summary

This document proposes future customer-visible localization key families for appointment timeline, customer-facing service report, safe-deny responses, report issue entrypoints, and satisfaction survey entrypoints.

Task357 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG runtime, billing, invoice, payment, customer-facing report runtime, timeline runtime, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or localization runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task357 extends:

- Task352 customer-visible appointment timeline policy,
- Task353 customer-facing service report alignment review,
- Task355 safe-deny message key design,
- Task356 multi-channel customer wording review.

## Localization Key Principles

This key catalog is a proposal only. It does not mean the runtime keys, localization files, or API response fields already exist.

Customer-visible wording keys should be:

- customer-safe,
- channel-agnostic,
- non-enumerating,
- data-minimized,
- suitable for LINE, Web, App, SMS-directed link, and Email-directed link surfaces.

Localization keys must not hard-code LINE as the only customer channel.

Keys and wording must not expose:

- internal workflow state,
- database IDs,
- raw LINE user IDs,
- organization-internal IDs,
- provider IDs,
- internal appointment state not meant for customers,
- raw Field Service Report status,
- AI drafts,
- internal notes,
- audit logs,
- billing internal data,
- settlement rules,
- inventory internals,
- customer ownership test results,
- link validity internals.

Safe-deny keys must avoid revealing whether a Case, Customer, Appointment, Field Service Report, Organization, LINE binding, or access token exists.

## Proposed Key Families

| Key family | Purpose | Example keys | Allowed customer-visible usage | Must-not-include content | Notes for multi-channel wording |
| --- | --- | --- | --- | --- | --- |
| `customerTimeline.*` | Customer-safe appointment progress and actions. | `customerTimeline.status.confirmed`, `customerTimeline.action.viewReport` | Timeline status, appointment confirmation state, support actions. | Internal status, `finalAppointmentId`, dispatch scoring, engineer ranking, route optimization. | Keep short for LINE/SMS; Web/App can show slightly more detail. |
| `customerReport.*` | Customer-facing service report labels and summaries. | `customerReport.title`, `customerReport.summary.repairAction` | Service summary, repair result, customer-safe signature and charge information. | Internal Field Service Report dump, audit log, engineer internal comments, settlement data. | Wording should be clear and low-friction across Web/App/LINE. |
| `customerAccess.*` | Safe-deny, verification, and unavailable states. | `customerAccess.genericUnavailable`, `customerAccess.verificationRequired` | Access errors, unavailable links, verification prompts, action denial. | Case existence, customer match, LINE binding state, organization existence, token state. | Use equivalent protection across all channels. |
| `customerIssue.*` | Unresolved issue / support follow-up entrypoints. | `customerIssue.entrypoint`, `customerIssue.received` | Let customers report unresolved issues and know the report was received. | Internal complaint classification, liability, escalation level, supervisor notes. | Keep supportive and non-accusatory. |
| `customerSurvey.*` | Satisfaction survey entrypoints and completion states. | `customerSurvey.entrypoint`, `customerSurvey.thankYou` | Ask for feedback after completion and acknowledge receipt. | Survey suppression reason, internal score routing, complaint risk labels. | Avoid implying negative feedback will be hidden. |
| `customerVerification.*` | Identity verification prompts and generic verification outcomes. | `customerVerification.required`, `customerVerification.completed` | Ask customers to complete safe verification before viewing content. | Whether an entered phone / LINE / email matched the Case. | Verification wording must not enumerate resources. |
| `customerCommon.*` | Shared labels and generic actions. | `customerCommon.contactSupport`, `customerCommon.tryAgain` | Common buttons, fallback actions, support prompts. | Internal IDs, provider details, access-control reason. | Keep reusable across channels. |

## Proposed Key Catalog

| Proposed key | Surface | Purpose | Example customer-safe wording direction | Must not reveal | Notes / future implementation caution |
| --- | --- | --- | --- | --- | --- |
| `customerTimeline.status.confirmed` | Timeline | Show confirmed appointment state. | `到府服務時間已確認。` | Internal schedule source, dispatch scoring, route data. | Only show after customer-safe confirmation state is available. |
| `customerTimeline.status.waitingConfirmation` | Timeline | Ask customer to confirm proposed time. | `請確認此到府服務時段是否方便。` | Internal proposed appointment ID, dispatch reason. | Do not imply final appointment before confirmation. |
| `customerTimeline.status.rescheduleNeeded` | Timeline | Show safe reschedule need. | `我們需要與您重新確認到府時間。` | Internal route/staffing reason. | Avoid blame or internal cause. |
| `customerTimeline.status.pendingParts` | Timeline | Show waiting-for-parts state. | `目前正在等待所需材料，後續會再與您確認。` | Warehouse, supplier, inventory, cost data. | Keep wording high-level. |
| `customerTimeline.status.waitingQuote` | Timeline | Show quote/follow-up waiting state. | `目前正在確認報價或後續處理方式。` | Internal quote approval state, settlement rules. | Only use if customer-visible quote policy is approved. |
| `customerTimeline.status.engineerArrived` | Timeline | Show high-level arrival. | `工程師已到府。` | Precise internal timestamps if not needed, engineer notes. | Use only if approved for channel. |
| `customerTimeline.status.serviceFinished` | Timeline | Show service finished state. | `本次服務已完成。` | Internal FSR status, audit state. | Should align with formal completion and customer-facing report policy. |
| `customerTimeline.action.viewReport` | Timeline | Link to customer-facing report. | `查看服務摘要` | Internal report ID, raw FSR data. | Requires access control and customer-safe projection. |
| `customerTimeline.action.contactSupport` | Timeline | Contact support action. | `聯絡客服` | Internal support queue details. | Can be shared across channels. |
| `customerReport.title` | Service report | Customer-facing report title. | `服務摘要` | Internal Field Service Report naming or IDs. | Keep understandable for customers. |
| `customerReport.summary.issue` | Service report | Customer-safe issue summary. | `問題摘要` | Internal diagnosis notes if not customer-safe. | Should come from approved projection. |
| `customerReport.summary.repairAction` | Service report | Customer-safe repair action summary. | `處理結果` | Engineer internal notes, audit data. | AI draft requires human/product approval before use. |
| `customerReport.summary.partsVisible` | Service report | Customer-visible parts/service item summary. | `更換項目` | Internal cost, stock movement, warehouse, settlement rules. | Only expose approved customer-visible parts labels. |
| `customerReport.signature.completed` | Service report | Show signature/evidence status. | `已完成現場確認。` | Raw signature data, signer sensitive details if not needed. | Avoid implying signature is mandatory in all cases. |
| `customerReport.signature.exceptionCustomerSafe` | Service report | Show customer-safe signature exception. | `本次服務以其他方式完成確認。` | Internal exception reason, supervisor notes, audit. | Requires policy review before runtime use. |
| `customerReport.charge.confirmed` | Service report | Show confirmed customer charge. | `已確認費用` | Internal settlement, supplier payout, margin. | Only after customer charge/approval policy is approved. |
| `customerReport.action.reportIssue` | Service report | Report unresolved issue. | `問題仍未解決？請告訴我們。` | Internal complaint routing. | Should create follow-up only in future runtime. |
| `customerReport.action.contactSupport` | Service report | Contact support. | `需要協助？請聯絡客服。` | Internal queue/permission details. | Channel-agnostic action label. |
| `customerAccess.genericUnavailable` | Access / safe deny | Generic unavailable deny. | `目前無法顯示此內容，請確認連結或聯絡客服。` | Resource existence, ownership, org, link state. | Default safest key. |
| `customerAccess.verificationRequired` | Access / verification | Ask for verification. | `請先完成身分確認後再查看。` | Whether entered identity matches a Case. | Do not enumerate. |
| `customerAccess.linkUnavailable` | Link access | Link unavailable. | `此連結目前無法使用，請重新取得連結或聯絡客服。` | Whether link expired/revoked/ever valid. | Use generic key if link status is sensitive. |
| `customerAccess.actionUnavailable` | Action deny | Action cannot proceed. | `目前無法處理此操作，請稍後再試或聯絡客服。` | Internal workflow reason. | For report/survey/timeline actions. |
| `customerAccess.tryAgainOrContactSupport` | Fallback | Recoverable generic error. | `目前暫時無法完成，請稍後再試或聯絡客服。` | Internal exception/provider details. | For temporary failures. |
| `customerAccess.reportIssueUnavailable` | Issue entrypoint | Issue entry unavailable. | `目前無法建立問題回報，請稍後再試或聯絡客服。` | Complaint eligibility, report existence. | Avoid issue workflow enumeration. |
| `customerAccess.surveyUnavailable` | Survey | Survey unavailable. | `目前無法開啟此問卷，請稍後再試或聯絡客服。` | Survey eligibility/suppression reason. | Avoid report completion enumeration. |
| `customerIssue.entrypoint` | Issue | Open issue report. | `我要回報問題` | Internal complaint category. | Customer action label only. |
| `customerIssue.received` | Issue | Acknowledge issue report. | `已收到您的問題回報，我們會協助處理。` | Internal SLA/queue details unless approved. | Follow-up policy required later. |
| `customerIssue.followUpNotice` | Issue | Follow-up notice. | `客服將協助您確認後續處理。` | Supervisor review, liability, escalation. | Keep non-committal. |
| `customerSurvey.entrypoint` | Survey | Survey CTA. | `留下本次服務回饋` | Internal survey routing. | Only after survey eligibility is approved. |
| `customerSurvey.thankYou` | Survey | Survey completion. | `謝謝您的回饋。` | Score routing, complaint flag. | Do not imply negative feedback suppression. |
| `customerSurvey.unavailable` | Survey | Survey unavailable. | `目前無法開啟此問卷，請稍後再試或聯絡客服。` | Eligibility or link state. | Align with `customerAccess.surveyUnavailable`. |

## Must-not-use Key Patterns

Avoid key names that encode internal denial reasons or expose resource existence.

Do not use key patterns such as:

- `caseNotFound`,
- `customerNotMatched`,
- `lineNotBound`,
- `organizationNotFound`,
- `finalAppointmentMissing`,
- `internalFsReportPending`,
- `aiDraftRejected`,
- `billingSettlementPending`,
- `engineerRankingHidden`.

These names can lead future implementers to expose resource enumeration, internal workflow state, AI state, billing / settlement internals, or operational details in customer-facing surfaces.

Prefer neutral key families such as `customerAccess.genericUnavailable`, `customerAccess.verificationRequired`, and `customerAccess.actionUnavailable`.

## AI Boundary

AI may help draft customer-safe wording variants.

AI must not:

- add official localization keys automatically,
- modify official localization policy,
- generate customer-visible wording directly from raw denial reasons,
- see full raw denial context unless it passes minimum necessary, masking / redaction, permission-aware, tenant-isolated, auditable gates,
- reveal resource existence,
- reveal channel binding state,
- reveal internal workflow state.

AI output must go through human / product review before entering official localization.

## Non-goals

Task357 does not:

- add localization files,
- add runtime helpers,
- add API behavior,
- add notification sending,
- add provider integrations,
- add smoke tests,
- modify validators,
- add a migration,
- add a schema or index change,
- add AI / RAG runtime,
- add billing / settlement runtime,
- add customer-facing report runtime,
- add timeline runtime,
- add survey runtime,
- add complaint / callback runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow,
- add inventory / parts / WMS behavior.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task357.

### Customer-visible Localization File Implementation

Create actual localization resources only after product copy review and API contract approval.

### Product Copy Review

Review all customer-visible wording for clarity, tone, channel fit, safe-deny behavior, and non-enumeration.

### Safe-deny Response Helper Design

Design shared helper behavior for customer-facing surfaces.

### Customer-visible Timeline / Report API Wording Contract

Define how future APIs return message keys without exposing internal reason codes.

### Multi-channel Notification Delivery Policy

Define what content belongs in the channel message versus the verified landing page.

### Localization Smoke / Integration Tests

Add tests only after localization files, API contracts, projection services, and disposable local/test runtime are available.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task357.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future localization implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, or staff-management data.
