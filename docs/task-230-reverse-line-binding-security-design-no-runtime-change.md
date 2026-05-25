# Task 230 - Reverse LINE Binding Security Design / No Runtime Change

## Purpose and Scope

Task230 defines a documentation-only security design for future existing Case reverse LINE binding.

The goal is to define how a future workflow may safely connect an existing Case / customer context to a scoped LINE channel identity without leaking whether a Case, customer, mobile value, LINE binding, or token exists.

Task230 is not:

- LINE binding runtime implementation,
- reverse binding API contract,
- token implementation,
- migration proposal,
- schema implementation,
- resolver implementation,
- Admin UI,
- customer portal,
- LINE provider sending,
- notification runtime,
- automated test,
- AI decision engine.

This document does not create tokens, add API behavior, add tables, modify schema, call LINE APIs, send messages, or implement binding.

## Reverse Binding Use Case

Future use case:

- an existing Case already exists in the system,
- the customer later enters through LINE,
- the system needs a safe way to link that LINE channel identity to an existing customer / Case context,
- the process must not rely on raw `line_user_id` as a global identity,
- the process must not let attackers infer Case existence, mobile correctness, or LINE binding state through error messages,
- the process must not automatically modify Case / Appointment / Field Service Report official status.

Reverse binding is a customer identity / channel identity operation, not a Case completion operation.

## Required Security Principles

Future reverse binding security requirements:

- reverse binding token must expire,
- token must be single-use or governed by a strictly defined retry policy,
- token must be stored hashed if future storage is implemented,
- token must not be logged,
- token must not be exposed in analytics, screenshots, QA artifacts, handoffs, customer-visible surfaces, or filenames,
- token validation failure must collapse to generic failure,
- phone verification failure must collapse to generic failure,
- existing binding conflict must collapse to generic failure unless authenticated authorized internal context allows more detail,
- organization scope must be resolved before binding,
- LINE channel scope must be resolved before binding,
- binding success must be auditable,
- binding failure must be auditable without leaking sensitive values,
- binding must not bypass opt-out / suppression policy for future messaging,
- binding must not imply consent for all future message types.

## LINE Identity Scope Boundary

`line_user_id` must not be treated as global identity.

LINE identity must be scoped by:

- organization_id,
- line_channel_id,
- line_user_id.

Rules:

- the same line_user_id under different LINE channel or organization context must not be mixed,
- do not lookup Case / customer by raw line_user_id alone,
- do not expose raw LINE user id in logs, errors, frontend, audit metadata, QA artifacts, or handoffs,
- do not expose LINE access token, channel secret, or provider credential in docs examples, logs, API responses, or customer-facing messages.

## Conceptual Future Flow

The following flow is conceptual only. It is not API contract, runtime spec, or schema proposal.

Potential future steps:

1. Generate reverse binding invitation under organization scope.
2. Store only safe reference / hashed token in future storage.
3. Deliver invitation through approved channel only after future provider readiness.
4. Customer opens link or enters verification flow.
5. System resolves organization and LINE channel context safely.
6. Customer provides required verification proof through safe UI.
7. System validates token, expiry, one-time status, scope, verification proof, and ambiguity conditions.
8. If valid, create scoped channel identity binding.
9. If invalid, return generic failure.
10. Audit success / failure / expired / reused / ambiguity events with redaction.

Task230 does not create API, token, DB, LINE flow, invitation delivery, or provider sending.

## Verification Proof Boundaries

Future proof categories may include:

- masked mobile verification,
- one-time code,
- customer-known case reference with anti-enumeration controls,
- authenticated customer portal session,
- support-assisted verification.

Limitations:

- do not bind by phone suffix alone,
- do not bind by Case id alone,
- do not bind by LINE follow event alone,
- do not bind by AI match confidence alone,
- do not reveal which proof failed in customer-facing errors,
- do not display complete mobile, raw LINE id, or internal Case diagnostic in customer-facing UI.

## Failure and Non-Leakage Behavior

Customer-facing failure should collapse to generic wording for:

- token invalid,
- token expired,
- token reused,
- token not found,
- Case not found,
- phone mismatch,
- LINE already bound,
- LINE channel mismatch,
- organization mismatch,
- customer ambiguity,
- permission / entitlement unavailable,
- provider readiness unavailable.

Forbidden wording:

- "案件不存在",
- "手機號碼錯誤",
- "LINE 尚未綁定",
- "LINE 已綁定其他案件",
- "token 無效",
- "organization 不一致",
- "此 LINE channel 不符",
- "此功能未開通",
- "AI 無法確認身份".

Allowed generic wording examples:

- "目前無法完成驗證，請稍後再試或聯絡客服協助。"
- "此連結目前無法使用，請透過官方客服管道協助。"
- "我們無法確認此請求，請重新操作或聯絡客服。"

These examples are proposal-only copy, not production localization.

## Binding Conflict and Ambiguity Handling

Fail closed. Do not automatically bind when:

- same scoped LINE identity is already linked to another active customer context,
- same Case has conflicting customer identity,
- phone verification conflicts with Case contact,
- token belongs to another organization or channel context,
- multiple customer profiles match,
- token status is ambiguous,
- existing binding status is ambiguous,
- provider callback lacks scope,
- AI suggests match but evidence is incomplete.

Ambiguity should enter future human review and audit readiness, not automatic processing.

## Consent and Messaging Boundary

LINE binding success is not consent for all messages.

Principles:

- verification / binding and marketing consent must stay separate,
- survey / service notification / promotional message consent requires future policy,
- opt-out / unsubscribe / suppression must be respected,
- manual resend must not bypass suppression because binding succeeded,
- provider-level restrictions must not be ignored,
- Task230 sends no message.

## Customer-Visible vs Internal-Only Data

### Customer-Visible May Include

- generic verification success,
- generic verification failure,
- generic expired / unavailable message if safe,
- safe customer support instruction.

### Customer-Visible Must Not Include

- complete mobile / phone / tel,
- raw LINE user id,
- token,
- internal case status,
- internal binding status,
- organization / channel diagnostics,
- provider diagnostics,
- audit log,
- AI confidence / explanation.

### Internal-Only May Include

- binding attempt category,
- verification status,
- scope match / mismatch category,
- ambiguity category,
- consent / suppression category,
- audit reference,
- AI advisory suggestion,
- provider diagnostic category.

Internal-only access still requires permission, organization scope, and redaction.

## Audit Readiness

Future audit events may include:

- reverse LINE binding invitation created,
- reverse LINE binding token generated,
- reverse LINE binding token expired,
- reverse LINE binding token reused,
- reverse LINE binding verification attempted,
- reverse LINE binding verification succeeded,
- reverse LINE binding verification failed,
- reverse LINE binding scope mismatch detected,
- reverse LINE binding ambiguity detected,
- reverse LINE binding conflict detected,
- reverse LINE binding completed,
- reverse LINE binding revoked,
- AI binding suggestion generated,
- AI binding suggestion rejected,
- support-assisted binding review created,
- support-assisted binding approved / rejected.

Audit redaction:

- do not record complete mobile / phone / tel values,
- do not record raw LINE user id,
- do not record token / secret,
- do not record LINE access token / channel secret,
- do not record provider credential,
- do not record raw provider payload,
- do not record AI raw payload,
- do not expose audit to customer-visible surfaces.

## Permission / Entitlement Readiness

Task230 does not implement permission or entitlement runtime.

Future questions:

- Who can generate reverse binding invitation?
- Who can view binding status?
- Who can revoke binding?
- Who can view ambiguity reason?
- Who can perform support-assisted binding review?
- Who can approve / reject manual binding exception?
- Which organizations can use LINE reverse binding?
- Does reverse binding require plan entitlement?
- Does LINE channel require organization-scoped provider config?
- Does usage / provider cost require future metering?

Placeholder permissions:

- `customer_channel_identity.reverse_binding.request`
- `customer_channel_identity.reverse_binding.view`
- `customer_channel_identity.reverse_binding.review`
- `customer_channel_identity.reverse_binding.approve`
- `customer_channel_identity.reverse_binding.revoke`
- `customer_channel_identity.audit.view`

Placeholder feature keys:

- `customer_channel_reverse_binding`
- `customer_channel_line`
- `customer_channel_line_reverse_binding`
- `customer_channel_identity_audit`
- `customer_channel_support_assisted_binding`

These are not production permissions or production feature keys.

Task230 does not add permission runtime, entitlement runtime, usage metering, billing, subscription, or plan pricing.

## AI Advisory-Only Boundary

AI may:

- flag ambiguous binding risk,
- summarize failed binding categories for authorized users,
- check safe-deny copy,
- organize support-assisted review context,
- suggest human review priority.

AI must not:

- automatically bind LINE,
- reverse-bind existing Case,
- unbind,
- approve manual binding exception,
- generate or send token,
- send LINE message,
- overwrite verified identity,
- modify Case / Appointment / Field Service Report,
- create or close complaint,
- approve quote / settlement / refund / compensation,
- bypass permission / organization scope / entitlement,
- write uncertain inference into official record.

## Relationship to Existing Branches

Task230:

- extends Task228 Generic Customer Channel Identities Proposal,
- extends Task229 Verification and Consent Policy,
- supports future Notification Delivery Readiness,
- supports future Survey delivery channel abstraction without reopening Survey branch,
- supports LINE not hard-coded principle.

Task230 does not:

- modify SLA / Operations Risk branch,
- modify Survey branch docs,
- modify inventory docs,
- touch Migration020.

## Explicit Non-Goals

Task230 does not:

- create LINE binding table,
- create reverse binding token table,
- create customer channel identity table,
- add migration,
- modify schema,
- add indexes,
- add token generation,
- add token hashing utility,
- add token validation,
- add API,
- modify backend service / repository / controller,
- modify Admin UI,
- add customer portal,
- add LINE provider integration,
- send LINE / APP / SMS / email,
- add notification runtime,
- add survey runtime,
- add audit runtime,
- add permission / entitlement runtime,
- add feature flag / usage metering runtime,
- add resolver,
- add AI identity runtime,
- add automated test / fixture / smoke,
- add localization file,
- add message template file,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Task230 is security design only.

Future implementation requires separate PM / user approval for:

- schema and migration,
- token generation / hashing / validation,
- reverse binding API,
- customer-facing verification UI,
- Admin support-assisted review UI,
- LINE binding runtime,
- provider sending,
- resolver,
- permission and entitlement enforcement,
- audit runtime,
- tests and smoke coverage.

General continuation language does not approve these steps.

## Verification Checklist

Task230 completion should verify:

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
- no resolver,
- no reverse binding runtime,
- no LINE binding runtime,
- no token generation / hashing / validation,
- no customer portal,
- no AI identity runtime,
- no AI auto-decision,
- no smoke / automated tests / fixtures / QA scripts touched,
- no localization files touched,
- no message template files touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
