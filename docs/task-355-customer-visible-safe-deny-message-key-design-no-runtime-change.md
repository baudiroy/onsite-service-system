# Task 355 - Customer-visible Safe-deny Message Key Design / No Runtime Change

## Scope Summary

This document proposes future safe-deny message key families for customer-visible appointment timeline and customer-facing service report surfaces.

Task355 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG runtime, billing, invoice, payment, customer-facing report runtime, timeline runtime, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or access-control runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task355 extends:

- Task352 customer-visible appointment timeline policy,
- Task353 customer-facing service report alignment review,
- Task354 access-control test plan.

## Protected Customer-visible Surfaces

Future safe-deny wording applies to:

- customer-visible appointment timeline,
- customer-facing service report,
- completion report link,
- report issue / unresolved issue entrypoint,
- satisfaction survey entrypoint,
- SMS-directed Web link,
- LINE-directed access surface,
- App-directed access surface,
- Web portal access surface.

Deny responses for these surfaces must be:

- customer-safe,
- channel-agnostic,
- non-enumerating,
- free of internal identifiers,
- free of raw provider payloads,
- free of sensitive personal data.

## Safe-deny Principles

Customer-facing deny messages must not reveal whether:

- a Case exists,
- a Customer exists,
- an Appointment exists,
- a Field Service Report exists,
- a LINE binding exists,
- an Organization exists,
- a link token is valid,
- a link token is expired,
- a link token is revoked,
- a Case belongs to a specific phone number,
- a Case belongs to a specific customer channel identity.

For unauthorized, wrong customer, wrong organization, expired link, revoked link, missing consent, or unverified identity, the default should be a generic safe-deny message.

Internal systems may record audit, security, diagnostic, contact attempt, or access-denied events, but those details must not be displayed to customers.

Customer-facing wording must not include:

- internal IDs,
- database IDs,
- raw LINE user IDs,
- provider payloads,
- tenant names,
- internal workflow status,
- full phone numbers,
- full addresses,
- raw access tokens,
- binding tokens,
- verification codes,
- AI raw payload.

## Proposed Message Key Families

These are proposal-only message keys. Task355 does not add localization files or runtime message keys.

| Message key | Intended use | Allowed surfaces | Example customer-safe wording | Must not reveal | Prefer more generic key when |
| --- | --- | --- | --- | --- | --- |
| `customerAccess.genericUnavailable` | Default deny for unauthorized, wrong customer, wrong organization, unavailable resource, or ambiguous access failure. | Timeline, service report, completion link, issue entrypoint, survey entrypoint, Web, LINE, App, SMS-directed page. | `目前無法顯示此內容，請確認連結或聯絡客服。` | Case existence, customer existence, organization existence, link validity, binding state, internal reason. | The system cannot safely distinguish whether the user should know the reason. |
| `customerAccess.verificationRequired` | Ask a potentially legitimate customer to complete verification without confirming resource ownership. | Web link, portal, App, LINE handoff, SMS-directed page. | `請先完成身分確認後再查看。` | Whether the Case exists, whether the identifier matches, whether LINE is bound. | The user is not verified and the surface must avoid confirming resource existence. |
| `customerAccess.linkUnavailable` | Link cannot be used due to expiration, revocation, malformed token, or unsupported state. | Completion link, report link, SMS-directed page, Email link. | `此連結目前無法使用，請重新取得連結或聯絡客服。` | Whether the link was ever valid, expired, revoked, or tied to a real Case. | The link state itself would reveal resource existence or ownership. |
| `customerAccess.actionUnavailable` | Customer action cannot be processed, such as confirming, reporting issue, or opening a gated surface. | Timeline action, report action, issue action, survey action. | `目前無法處理此操作，請稍後再試或聯絡客服。` | Internal workflow status, permission failure reason, Case/report existence. | The action failure might reveal internal state or ownership. |
| `customerAccess.tryAgainOrContactSupport` | Generic recoverable error or temporary access failure. | Web, App, LINE, SMS-directed page. | `目前暫時無法完成，請稍後再試或聯絡客服。` | Provider status, internal exception, tenant status, token details. | The technical failure reason is sensitive or not customer-actionable. |
| `customerAccess.reportIssueUnavailable` | Issue report entrypoint is not available or access cannot be verified. | Report issue / unresolved issue entrypoint. | `目前無法建立問題回報，請稍後再試或聯絡客服。` | Whether the Case/report exists, complaint category, internal eligibility reason. | The issue-report reason could reveal internal workflow status. |
| `customerAccess.surveyUnavailable` | Survey entrypoint is unavailable, ineligible, expired, or cannot be verified. | Satisfaction survey entrypoint. | `目前無法開啟此問卷，請稍後再試或聯絡客服。` | Survey eligibility reason, Case/report existence, customer identity match, internal suppression reason. | The survey state would reveal report or customer status. |

## Scenario-to-key Matrix

| Scenario | Recommended message key | Customer-safe wording direction | Internal log / audit direction | Enumeration risk note |
| --- | --- | --- | --- | --- |
| Correct customer but verification not complete | `customerAccess.verificationRequired` | Ask for identity verification without confirming Case details. | Log verification-required state with masked identifiers. | Do not confirm that the Case belongs to the customer. |
| Wrong customer identity | `customerAccess.genericUnavailable` | Generic unavailable / contact support wording. | Log access denied with actor/channel summary. | Do not reveal the correct customer. |
| Wrong organization | `customerAccess.genericUnavailable` | Generic unavailable / contact support wording. | Log cross-organization deny internally. | Do not reveal organization existence or tenant boundary. |
| Same external LINE ID in different organization/channel | `customerAccess.genericUnavailable` | Generic unavailable / contact support wording. | Log scoped channel identity mismatch internally. | Do not reveal that the external ID exists elsewhere. |
| Expired link | `customerAccess.linkUnavailable` or `customerAccess.genericUnavailable` | Generic link unavailable wording. | Log expired token state internally if safe. | Do not reveal whether the link was previously valid. |
| Revoked link | `customerAccess.linkUnavailable` or `customerAccess.genericUnavailable` | Generic link unavailable wording. | Log revoked token state internally if safe. | Do not reveal revocation reason or related Case. |
| Missing consent | `customerAccess.verificationRequired` or `customerAccess.genericUnavailable` | Ask for verification/consent only when safe. | Log missing consent internally. | Do not reveal Case/customer ownership. |
| Deleted / hidden / unavailable Case | `customerAccess.genericUnavailable` | Generic unavailable wording. | Log resource lifecycle state internally. | Do not reveal delete, hidden, or internal lifecycle reason. |
| Completion report not ready | `customerAccess.actionUnavailable` or customer-safe pending wording after verification | If verified, say content is not ready in a generic way. | Log report readiness state internally. | Before verification, do not confirm report existence. |
| Appointment timeline not ready | `customerAccess.actionUnavailable` or customer-safe pending wording after verification | If verified, say the timeline is not ready in a generic way. | Log projection readiness state internally. | Before verification, do not confirm appointment existence. |
| Customer tries another Case ID | `customerAccess.genericUnavailable` | Generic unavailable / contact support wording. | Log suspected enumeration attempt internally. | Do not reveal whether the target Case exists. |
| Internal error while resolving access | `customerAccess.tryAgainOrContactSupport` | Temporary unavailable wording. | Log exception details internally with redaction. | Do not show stack trace, provider failure, or internal IDs. |
| Report issue entrypoint unavailable | `customerAccess.reportIssueUnavailable` | Generic unable to create issue wording. | Log entrypoint unavailable reason internally. | Do not reveal complaint workflow eligibility. |
| Survey unavailable or not eligible | `customerAccess.surveyUnavailable` | Generic survey unavailable wording. | Log survey suppression / eligibility reason internally. | Do not reveal survey suppression, report status, or customer identity match. |
| AI draft exists but not approved | `customerAccess.actionUnavailable` or omit draft silently | Do not mention AI draft existence. | Log draft not approved internally if needed. | Do not reveal internal AI workflow. |
| Complaint exists but internal classification hidden | Customer-safe support wording, not internal classification | Show only approved support/follow-up status if verified. | Log complaint classification internally. | Do not reveal liability, risk class, or escalation level. |

## Wording Boundaries

Forbidden wording examples / patterns:

- `此案件不存在`
- `此案件不屬於你的手機`
- `你的 LINE 尚未綁定`
- `此 organization 不存在`
- `此報告尚未產生，因為工程師未完成 finalAppointmentId`
- `此客戶沒有同意`
- `你沒有此 Case 的權限`
- any wording containing raw database IDs,
- any wording containing raw LINE user IDs,
- any wording containing full phone numbers,
- any wording containing full addresses,
- any wording containing provider payloads,
- any wording containing internal status that is not approved for customer display.

Safer wording directions:

- `目前無法顯示此內容，請確認連結或聯絡客服。`
- `請先完成身分確認後再查看。`
- `目前無法處理此操作，請稍後再試或聯絡客服。`
- `此連結目前無法使用，請重新取得連結或聯絡客服。`

Even safer wording can be more generic when the denial reason has high enumeration risk.

## AI Boundary

AI may help draft multilingual customer-safe wording, but only under strict policy control.

AI must not:

- generate customer-visible denial messages from raw denial reasons that reveal internal state,
- see full raw denial context unless it passes minimum necessary, masking / redaction, permission-aware, tenant-isolated, auditable gates,
- publish safe-deny wording automatically,
- modify safe-deny message key policy,
- expose internal denial reason, resource existence, customer matching, organization matching, or channel binding state.

AI-generated wording must remain a draft until reviewed and approved through the appropriate localization / product policy workflow.

## Non-goals

Task355 does not:

- add localization files,
- add message key runtime,
- add API behavior,
- add access-control runtime,
- add smoke tests,
- modify validators,
- modify repositories,
- modify API error handlers,
- add a migration,
- add a schema or index change,
- add provider sending,
- add LINE / SMS / Email / App runtime,
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

These are future tasks only and must not be implemented as part of Task355.

### Customer-visible Safe-deny Localization File

Create actual localization keys after product copy review and channel review.

### Safe-deny Response Helper

Design a shared helper for customer-facing surfaces so timeline, report, survey, and issue entrypoints use consistent safe-deny behavior.

### Access-control API Contract With Safe-deny Mapping

Define response status, message key, telemetry, and internal audit mapping.

### Customer Channel Identity Verification Runtime

Implement scoped customer identity verification only after the API and data model are approved.

### Safe-deny Smoke / Integration Tests

Implement tests after disposable local/test runtime confirmation and API contract approval.

### Multi-channel Wording Review

Review wording for LINE, Web, App, SMS-directed link, and Email surfaces.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task355.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future safe-deny implementation must continue to redact sensitive values and avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, or AI payload.
