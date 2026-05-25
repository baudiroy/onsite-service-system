# Task 225 - Survey Customer Follow-Up Copy and Safe Messaging Policy / No Runtime Change

## Purpose and Scope

Task225 defines a documentation-only safe messaging policy for future customer-facing survey invitation, survey status, low-rating follow-up, complaint-risk follow-up, service recovery, opt-out, and safe-deny messages.

Task225 is not:

- localization implementation,
- message template implementation,
- LINE / SMS / Email / APP provider implementation,
- survey runtime,
- notification runtime,
- customer portal,
- API contract,
- Admin UI,
- AI auto-message runtime,
- automated test.

This document does not create production translations, provider templates, notification runtime, message sending, API behavior, Admin UI, or survey runtime.

## Safe Customer-Facing Copy Principles

Future customer-facing survey and follow-up copy should be neutral, respectful, concise, and non-leaking.

Principles:

- use neutral and respectful wording,
- do not promise unapproved refund, compensation, discount, or free service,
- do not imply engineer fault or responsibility assignment,
- do not expose internal labels such as low-rating risk, complaint risk, AI risk label, or supervisor classification,
- do not expose audit events,
- do not expose provider diagnostics,
- do not expose permission / entitlement / organization scope details,
- do not reveal whether a Case exists to an unverified or ambiguous requester,
- do not reveal whether mobile verification matched,
- do not reveal whether LINE is bound,
- do not reveal whether a survey exists,
- do not include token values, secrets, raw identifiers, or complete contact identifiers,
- link text should not display full token or sensitive id,
- follow-up messages must respect opt-out / suppression / channel eligibility.

Customer-facing copy should help the customer understand the next safe action without exposing internal system state.

## Message Scenario Catalog

The following scenarios are future copy guidance only. They are not production translations, not localization keys, not message template files, and not provider configuration.

### A. Survey Invitation

Purpose:

- invite customer to submit post-completion feedback.

Guidance:

- keep wording short,
- avoid internal appointment / finalAppointmentId details,
- do not include complete Case id if it could be used for enumeration,
- do not display token in visible text,
- do not imply the survey is mandatory,
- do not hard-code LINE as the only channel.

### B. Survey Submitted

Purpose:

- confirm the system received feedback.

Guidance:

- thank the customer,
- do not promise compensation,
- do not promise follow-up unless future policy supports it,
- may say customer service may contact them if more detail is needed.

### C. Survey Already Submitted

Purpose:

- avoid duplicate submissions without exposing internal state.

Guidance:

- use general received wording,
- do not reveal whether internal review exists,
- do not reveal response classification or complaint risk.

### D. Survey Expired / Unavailable

Purpose:

- fail safely when the link cannot be used.

Guidance:

- use generic unavailable wording,
- do not reveal whether Case exists,
- do not reveal whether token is wrong or expired,
- do not reveal whether the survey was already submitted.

### E. Low-Rating Follow-Up

Purpose:

- acknowledge feedback and possibly initiate human follow-up.

Guidance:

- express thanks and care,
- do not say complaint has been formally created unless future workflow explicitly allows customer-visible complaint status,
- do not imply engineer fault,
- do not promise refund / compensation,
- may say a relevant team member will understand the situation.

### F. Unable to Reach Customer

Purpose:

- provide safe communication when customer contact attempt fails.

Guidance:

- avoid sensitive service details,
- do not expose internal low-rating classification,
- do not mention provider failures,
- do not include raw identifiers.

### G. Service Recovery Message

Purpose:

- communicate approved service recovery action.

Guidance:

- only include human-approved and policy-approved content,
- do not let AI or survey result auto-promise compensation,
- do not include internal responsibility analysis,
- do not include billing / settlement internal data.

### H. Permission / Unavailable / Safe-Deny Message

Purpose:

- avoid resource enumeration and internal leakage.

Guidance:

- use generic wording,
- do not reveal resource existence,
- do not reveal organization entitlement status,
- do not reveal permission failure detail.

### I. Opt-Out / Unsubscribe

Purpose:

- respect customer preference.

Guidance:

- be clear and respectful,
- do not threaten or pressure,
- do not hide the option,
- do not imply opt-out changes official Case status,
- do not use opt-out as reason to hide required service communication unless future policy defines the distinction.

### J. Channel Identity Ambiguity

Purpose:

- handle unclear channel identity safely.

Guidance:

- do not reveal whether LINE is bound,
- do not reveal whether mobile matched,
- suggest contacting official customer service or completing a safe verification flow,
- keep wording neutral.

## Allowed vs Forbidden Copy Patterns

These examples are policy guidance only. They are not production translations.

Allowed patterns:

- "感謝您的回饋，我們已收到。"
- "若需要進一步了解，客服人員可能會與您聯繫。"
- "此連結目前無法使用，請聯絡客服協助。"
- "我們重視您的服務體驗，將由相關人員了解情況。"
- "目前無法完成此操作，請稍後再試或聯絡客服。"

Forbidden patterns:

- "您的客訴已成立。" unless a future formal complaint workflow explicitly allows customer-visible status,
- "工程師處理有誤。",
- "我們會退款 / 補償 / 免費重修。" unless already human-approved through formal process,
- "您的 LINE 尚未綁定。",
- "手機號碼不正確。",
- "此案件不存在。",
- "您的方案未開通此功能。",
- "AI 判定您是高風險客訴。",
- "Provider 發送失敗。",
- any message containing complete token, raw LINE user id, complete mobile, provider diagnostics, or internal diagnostic detail.

## Channel-Agnostic Messaging Boundary

LINE is currently an important channel, but safe copy policy must not be hard-coded to LINE.

Future channels may include:

- LINE,
- SMS,
- email,
- web link,
- web portal,
- APP.

Principles:

- different channels may have different length and formatting limits,
- safety principles remain the same across channels,
- channel-specific implementation is not part of Task225,
- Task225 does not create LINE template,
- Task225 does not create SMS template,
- Task225 does not create email template,
- Task225 does not create APP push template,
- Task225 does not send any message.

## Customer-Visible vs Internal-Only Separation

### Customer-Visible Copy May Include

- general survey invitation,
- submit result,
- safe error message,
- approved customer service reply,
- approved service recovery explanation.

### Customer-Visible Copy Must Not Include

- internal review status,
- low-rating queue status,
- complaint risk label,
- AI suggestion,
- audit event,
- provider diagnostics,
- delivery retry status,
- permission / entitlement decision detail,
- billing / settlement internal decision,
- engineer internal note,
- supervisor note,
- raw identifiers or secrets.

Internal-only notes, audit entries, AI suggestions, and provider diagnostics must not leak through customer-facing copy.

## AI-Assisted Copy Boundary

AI may:

- draft internal follow-up message,
- rewrite text to be more neutral, polite, and concise,
- flag unsafe promises,
- check for internal information leakage,
- suggest customer callback outline.

AI must not:

- automatically send message,
- promise refund, compensation, discount, or free service,
- create or close formal complaint,
- modify Case / Appointment / Field Service Report,
- modify survey response,
- act as supervisor approval,
- bypass permission / organization scope / entitlement,
- write uncertain content into official record,
- use raw AI payload as customer-facing copy.

AI-assisted copy should remain draft-only until reviewed by an authorized human in a future approved workflow.

## Safe-Deny and Non-Leakage Copy

Future safe-deny copy should collapse sensitive failure categories into generic unavailable wording.

Sensitive failure categories include:

- resource does not exist,
- missing permission,
- cross-organization request,
- token mismatch,
- token expired,
- LINE binding ambiguity,
- mobile mismatch,
- survey disabled,
- survey already completed,
- entitlement unavailable,
- provider readiness unavailable.

Do not display:

- "案件不存在",
- "手機錯誤",
- "LINE 未綁定",
- "問卷已被其他人填寫",
- "此 organization 未開通功能",
- "權限不足",
- provider diagnostic detail,
- internal workflow detail.

Recommended generic wording:

- "此連結目前無法使用，請聯絡客服協助。"
- "目前無法完成此操作，請稍後再試或聯絡客服。"
- "我們無法確認此請求，請透過官方客服管道協助。"

## Audit Readiness

Future audit events may include:

- customer follow-up copy drafted,
- customer follow-up copy edited,
- customer follow-up copy approved,
- customer follow-up message sent,
- customer follow-up message blocked,
- unsafe copy rejected,
- AI copy suggestion generated,
- AI copy suggestion accepted / rejected,
- service recovery message approved,
- opt-out message rendered,
- safe-deny message rendered.

Audit redaction:

- do not record complete mobile / phone / tel values,
- do not record raw LINE user id,
- do not record token / secret / provider credential,
- do not record raw provider payload,
- do not record AI raw payload,
- do not expose audit to customer-visible surfaces.

## Permission / Entitlement Readiness

Task225 does not implement permission or entitlement runtime.

Future questions:

- Who can write customer follow-up message?
- Who can approve service recovery message?
- Who can send or schedule message?
- Who can view AI copy suggestion?
- Who can view blocked unsafe copy reason?
- Which channels require organization entitlement?
- Which message types require higher approval?

Placeholder feature keys:

- `survey_customer_follow_up_message`
- `survey_service_recovery_message`
- `survey_ai_copy_assist`
- `survey_message_approval`
- `survey_channel_line`
- `survey_channel_sms`
- `survey_channel_email`
- `survey_channel_app`

These are not production feature keys.

Task225 does not add permission runtime, entitlement runtime, provider sending, usage metering, or billing.

## Explicit Non-Goals

Task225 does not:

- add localization files,
- add production translations,
- add message template files,
- add LINE / SMS / Email / APP template,
- add notification provider,
- send LINE / APP / SMS / email,
- add customer portal,
- add API,
- modify backend service / repository / controller,
- modify Admin UI,
- add survey runtime,
- add notification runtime,
- add audit runtime,
- add permission / entitlement runtime,
- add AI copy runtime,
- add automated test / fixture / smoke,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Task225 is safe copy policy only.

Future implementation requires separate PM / user approval for:

- localization files,
- message template files,
- notification runtime,
- provider sending,
- AI copy assist runtime,
- Admin UI,
- API,
- permission and entitlement enforcement,
- opt-out / suppression runtime,
- audit runtime,
- tests and smoke coverage.

## Verification Checklist

Task225 completion should verify:

- docs-only change,
- no backend source touched,
- no Admin source touched,
- no API touched,
- no migration / schema / index touched,
- no DB / DDL / psql / db:migrate executed,
- no Migration020 dry-run / apply,
- no shared Zeabur runtime touched,
- no provider sending,
- no LINE / APP / SMS / email sending,
- no survey runtime,
- no notification runtime,
- no audit runtime,
- no permission runtime,
- no entitlement runtime,
- no feature flag runtime,
- no usage metering runtime,
- no localization files touched,
- no message template files touched,
- no customer portal,
- no AI copy runtime,
- no AI message sending,
- no AI auto-decision,
- no smoke / automated tests / fixtures / QA scripts touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
