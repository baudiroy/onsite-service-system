# Task 356 - Multi-channel Customer Wording Review / No Runtime Change

## Scope Summary

This document reviews future customer wording boundaries across LINE, Web, App, SMS-directed links, and Email-directed links.

Task356 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG runtime, billing, invoice, payment, customer-facing report runtime, timeline runtime, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or wording runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task356 extends:

- Task352 customer-visible appointment timeline policy,
- Task353 customer-facing service report alignment review,
- Task355 customer-visible safe-deny message key design.

## Channel-agnostic Wording Principles

LINE is currently an important customer channel, but customer wording policy must not hard-code LINE as the only entry point.

Future customer-facing wording should support:

- LINE,
- Web link,
- Web portal,
- mobile App,
- SMS-directed link,
- Email-directed link.

Customer wording should use generic customer-safe language that works across channels whenever possible.

Customer wording must not expose internal channel identity values such as:

- raw LINE user ID,
- channel ID,
- provider ID,
- internal customer channel identity ID,
- webhook payload ID.

Error or deny messages must not reveal whether a customer has bound LINE or any other channel.

The same access denial scenario should receive equivalent safe-deny protection across LINE, Web, App, SMS-directed links, and Email-directed links.

## Channel-specific Constraints

| Channel | Customer wording style | Length / display constraint | Safe-deny consideration | Must-not-include content | Follow-up action wording direction |
| --- | --- | --- | --- | --- | --- |
| LINE | Short, conversational, action-oriented. | Keep messages concise; avoid dense paragraphs; use link or button text when approved. | Do not reveal whether LINE binding exists or whether a Case belongs to this LINE user. | Raw LINE ID, channel ID, webhook payload, internal Case IDs, internal status. | `請確認連結或聯絡客服。` / `請完成身分確認後再查看。` |
| Web link | Clear and slightly more explanatory. | Can show short paragraphs and help text; still avoid exposing internals. | Link errors must not reveal whether the link was valid, expired, revoked, or tied to a real Case unless already verified. | Raw token, full phone, full address, internal IDs, internal workflow reason. | `請重新取得連結或聯絡客服。` |
| App | Compact, structured, and state-driven. | Use concise labels and safe empty states; push details to customer-safe detail view. | App login does not automatically authorize every Case; organization/customer scope still applies. | Internal IDs, raw channel identity, hidden internal flags, AI drafts. | `請先完成身分確認。` / `請聯絡客服協助。` |
| SMS-directed link | Extremely short and link-oriented. | SMS itself should avoid sensitive details; the landing page handles verification. | SMS should not include enough data to reveal Case details if seen by another person. | Full Case details, full address, full phone, internal status, raw token in visible text if avoidable. | `請點選連結完成確認。` with safe landing page handling. |
| Email-directed link | Clear and formal. | Can include more context than SMS but still data-minimized. | Email forwarding risk means links should expire or require verification where appropriate. | Internal notes, raw IDs, settlement details, AI raw output, full sensitive data unless necessary. | `請透過安全連結查看。` / `如無法開啟請聯絡客服。` |

## Wording Examples By Surface

These examples are proposal-only. Task356 does not add localization keys or runtime wording.

### Appointment Timeline Normal Display

Safer wording:

- `您的服務進度已更新。`
- `目前預約時段如下。`
- `我們會依此時段安排到府服務。`

Avoid:

- internal appointment IDs,
- dispatch scoring,
- engineer ranking,
- internal route details.

### Appointment Waiting Confirmation

Safer wording:

- `請確認此服務時段是否方便。`
- `我們為您預留以下到府服務時段，請確認是否方便。`

Avoid:

- implying the appointment is final before customer confirmation,
- exposing internal dispatch rules.

### Reschedule Needed

Safer wording:

- `此服務時段需要重新確認，請選擇新的方便時間或聯絡客服。`
- `我們需要與您重新確認到府時間。`

Avoid:

- blaming customer or engineer,
- exposing internal route or staffing reasons.

### Pending Parts / Waiting Quote

Safer wording:

- `目前正在等待所需材料，後續會再與您確認到府時間。`
- `目前正在確認報價或後續處理方式。`

Avoid:

- internal inventory status,
- supplier details,
- warehouse movement,
- settlement or cost details.

### Engineer Arrived / Service Finished

Safer wording:

- `工程師已到府。`
- `本次服務已完成，您可以查看服務摘要。`

Avoid:

- internal actual timestamp precision if not needed,
- staff performance notes,
- internal exception reasons.

### Customer-facing Service Report Ready

Safer wording:

- `您的服務摘要已可查看。`
- `您可以查看本次服務結果與後續注意事項。`

Avoid:

- raw internal Field Service Report content,
- internal audit or billing details.

### Report Issue Entrypoint

Safer wording:

- `如果問題仍未解決，請告訴我們。`
- `需要客服協助嗎？請留下問題，我們會協助處理。`

Avoid:

- internal complaint classification,
- liability statements,
- supervisor review details.

### Survey Entrypoint

Safer wording:

- `歡迎留下本次服務回饋。`
- `您的意見能幫助我們改善服務。`

Avoid:

- implying a low rating will be hidden or ignored,
- internal escalation policy.

### Generic Unavailable / Safe Deny

Safer wording:

- `目前無法顯示此內容，請確認連結或聯絡客服。`
- `目前無法處理此操作，請稍後再試或聯絡客服。`

Avoid:

- `此案件不存在`,
- `你沒有此 Case 的權限`,
- `你的 LINE 尚未綁定`.

### Verification Required

Safer wording:

- `請先完成身分確認後再查看。`
- `為保護您的資料，請先完成驗證。`

Avoid:

- revealing whether the provided identifier matched the Case,
- revealing whether LINE is bound.

## Must-not-say / Must-not-include List

Customer-facing wording must not include:

- raw LINE ID,
- channel ID,
- provider ID,
- internal database ID,
- organization internal ID,
- full phone number unless clearly necessary and authorized,
- full address unless clearly necessary and authorized,
- internal appointment status not meant for customers,
- `finalAppointmentId`,
- internal Field Service Report status wording,
- AI confidence,
- AI draft,
- prompt,
- model output,
- dispatch scoring,
- engineer ranking,
- route optimization,
- billing internal terms,
- settlement internal terms,
- vendor reconciliation internal terms,
- internal complaint classification,
- wording that says `此案件不存在`,
- wording that says `此案件不屬於你`,
- wording that says `LINE 尚未綁定`,
- wording that says `organization 不存在`,
- raw provider payload,
- raw webhook payload.

## AI Boundary

AI may assist with drafting multi-channel customer-safe wording.

AI must not:

- generate customer wording from raw denied reasons in a way that leaks internal state,
- automatically publish customer-facing wording,
- modify official localization or message key policy,
- see full raw denial context unless it passes minimum necessary, masking / redaction, permission-aware, tenant-isolated, auditable gates,
- reveal Case existence,
- reveal customer ownership,
- reveal LINE binding status,
- reveal organization scope,
- reveal internal workflow state.

AI-generated wording remains a draft until reviewed and approved by product / operations policy.

## Non-goals

Task356 does not:

- add localization files,
- add runtime wording helpers,
- add API behavior,
- add notification sending,
- add LINE / SMS / Email / App provider integrations,
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

These are future tasks only and must not be implemented as part of Task356.

### Customer-visible Localization File Proposal

Create actual message keys only after product copy review and channel review.

### Multi-channel Customer Wording Copy Review

Review tone, length, and wording for LINE, Web, App, SMS-directed links, and Email-directed links.

### Safe-deny Response Helper Design

Design a shared helper for customer-facing safe-deny responses.

### Notification Channel Delivery Policy

Define what each channel can send, what must remain on verified landing pages, and how retries / reminders behave.

### Customer-visible Timeline / Report API Wording Contract

Define message keys in future API responses without leaking internal state.

### LINE / Web / App / SMS Smoke Tests

Add tests only after API contracts, projection services, and disposable local/test runtime are available.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task356.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future wording implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, or staff-management data.
