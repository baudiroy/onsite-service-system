# Task 242 - Notification Customer Copy Template Governance / No Runtime Change

## Purpose And Scope

This document defines future governance boundaries for customer-facing notification copy, message templates, channel-specific wording, safe-deny wording, service recovery messages, survey invitations, appointment reminders, quote reminders, pending parts updates, and related customer communication.

Task242 is documentation-only.

This task is not:

- localization implementation,
- message template implementation,
- notification runtime,
- provider sending,
- LINE integration,
- SMS integration,
- email integration,
- APP integration,
- API implementation,
- Admin implementation,
- customer portal implementation,
- migration / schema / index implementation,
- automated test implementation,
- AI auto-message runtime.

Task242 does not create production translation strings, localization keys, message template files, template tables, approval workflows, provider adapters, customer-visible messages, or notification sending.

## Core Copy Governance Principles

Customer-facing notification copy must be neutral, concise, respectful, and safe.

Principles:

- customer-facing copy must not leak internal workflow status,
- customer-facing copy must not leak provider diagnostics,
- customer-facing copy must not leak permission detail,
- customer-facing copy must not leak entitlement detail,
- customer-facing copy must not leak usage / plan detail,
- customer-facing copy must not reveal whether a Case exists when the customer is not authorized,
- customer-facing copy must not reveal whether a mobile / phone / tel is correct,
- customer-facing copy must not reveal whether LINE is bound,
- customer-facing copy must not include raw LINE user id,
- customer-facing copy must not include complete mobile,
- customer-facing copy must not include token, secret, or provider credential,
- customer-facing copy must not promise unapproved refund, compensation, discount, or free service,
- customer-facing copy must not assign engineer blame,
- customer-facing copy must not treat AI suggestion as official conclusion,
- customer-facing copy must not expose provider failure detail,
- customer-facing copy must not expose audit, outbox, worker, retry, or diagnostics internals.

Customer copy should help the customer understand the next safe action without exposing internal system details.

## Future Notification Copy Scenario Catalog

The following scenarios are proposal-only. They are not production templates, localization keys, message files, API responses, or runtime behavior.

Future copy scenarios may include:

- appointment reminder,
- appointment reschedule notice,
- engineer on-the-way notice,
- completion notice,
- survey invitation,
- survey follow-up,
- low-rating follow-up,
- customer service follow-up,
- quote decision reminder,
- pending parts update,
- cancellation notice,
- reverse binding / verification message,
- opt-out / unsubscribe confirmation,
- safe unavailable / safe-deny message,
- service recovery message,
- internal staff alert copy boundary.

Internal staff alert copy is not customer-facing and must still avoid unnecessary sensitive data exposure.

Task242 does not add production templates, localization keys, message files, or sending logic.

## Allowed vs Forbidden Copy Patterns

The examples below are policy examples only. They are not production translation strings.

### Allowed Pattern Examples

Allowed customer-safe patterns may include:

- "提醒您，預約服務時間即將到來。"
- "我們已收到您的回覆，感謝您的意見。"
- "目前無法完成此操作，請稍後再試或聯絡客服。"
- "若需要進一步了解，客服人員可能會與您聯繫。"

Allowed patterns should be:

- neutral,
- concise,
- actionable,
- free of internal diagnostics,
- free of sensitive identifiers,
- free of unapproved promises,
- appropriate to the channel.

### Forbidden Pattern Examples

Forbidden patterns include:

- "此案件不存在。"
- "手機號碼錯誤。"
- "LINE 尚未綁定。"
- "您的方案未開通此功能。"
- "Provider 發送失敗。"
- "AI 判定您是高風險客訴。"
- "工程師處理有誤。"
- "我們會退款 / 補償 / 免費重修。"

Refund, compensation, discount, and free-service wording must not appear unless a future approved human workflow explicitly authorizes it.

Forbidden content also includes:

- complete token,
- raw LINE user id,
- complete mobile,
- provider credential,
- internal diagnostic,
- raw provider payload,
- raw AI payload,
- stack trace,
- SQL error,
- DB constraint name.

## Channel-specific Copy Boundaries

Different channels have different formatting constraints, but the same safety principles apply.

### LINE

LINE copy should be short and customer-friendly. It must not expose LINE binding details, raw LINE identifiers, provider diagnostics, or internal account state.

### SMS

SMS copy should be brief, avoid sensitive details, and respect opt-out / unsubscribe policy. SMS should not include internal diagnostics or unnecessary Case details.

### Email

Email can be more complete than LINE or SMS, but it still must not expose internal diagnostics, raw identifiers, provider errors, audit logs, billing internals, or AI raw output.

### APP Push

APP push copy should be short and should not include sensitive details. Detailed information should be shown only after authenticated in-app context if future product design approves it.

### Web Link / Portal

Web link and portal copy must separate unauthenticated safe-deny from authenticated customer context. A public link must not reveal Case existence, mobile correctness, or binding state through wording.

## Customer-visible vs Internal-only Separation

Customer-visible copy may include:

- general notification content,
- safe link instructions,
- general status,
- approved service recovery message,
- customer service contact instruction.

Customer-visible copy must not include:

- audit log,
- provider diagnostics,
- retry count,
- outbox status,
- worker status,
- permission internal reason,
- entitlement internal reason,
- usage internal reason,
- AI suggestion,
- billing internal data,
- settlement internal data,
- engineer internal note,
- supervisor internal note,
- internal risk label,
- raw identifiers,
- secrets.

Internal-only copy and staff notes must still follow redaction and role-based visibility rules.

## Safe-deny And Non-leakage Copy

Safe-deny copy must avoid revealing the reason behind a denial when the customer is not authorized to know it.

Future safe-deny mapping:

- token invalid / expired / reused: generic unavailable,
- Case not found: generic unavailable,
- phone mismatch: generic verification failed,
- LINE binding mismatch: generic unavailable,
- entitlement missing: customer-facing generic unavailable,
- usage limit blocked: customer-facing generic unavailable,
- provider unavailable: generic temporarily unavailable,
- channel identity ambiguous: generic unavailable.

Customer-facing copy must not expose:

- token state,
- Case existence,
- mobile correctness,
- LINE binding state,
- entitlement state,
- usage limit state,
- provider config state,
- internal suppression state.

Authorized Admin/internal surfaces may show more actionable categories only after organization scope and permission are confirmed.

## Template Approval Readiness

Future template governance needs approval rules before production use.

Future questions:

- Who can draft templates?
- Who can review customer-facing copy?
- Who can approve service recovery wording?
- Who can approve channel-specific templates?
- Who can approve production localization?
- Who can disable unsafe templates?
- Which templates require legal review?
- Which templates require privacy review?
- Which messages require supervisor approval before sending?
- Which templates require provider/channel compliance review?
- Which copy changes require audit?

Task242 does not implement an approval workflow.

## Localization And Template Governance Boundary

Task242 does not add:

- localization files,
- production translation strings,
- localization keys,
- message template files,
- template tables,
- versioning tables,
- template runtime.

Future localization / template work should define:

- message key naming,
- template versioning,
- channel variants,
- locale variants,
- review workflow,
- approval workflow,
- audit,
- rollback / disable behavior,
- customer-visible QA,
- sensitive data linting.

Production copy changes need review, audit, and version control.

Customer-facing copy must not be created by AI and deployed without review.

## AI-assisted Copy Boundary

AI may assist by:

- drafting internal copy drafts,
- rewriting copy to be neutral, polite, and concise,
- checking whether copy leaks sensitive information,
- flagging unsafe promises,
- flagging blame / liability wording,
- generating internal support reply outlines,
- suggesting safe-deny wording candidates for human review.

AI must not:

- create production templates,
- modify localization files,
- send messages,
- promise refund,
- promise compensation,
- promise discount,
- promise free service,
- decide engineer fault,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- write uncertain inference into official records.

AI suggestion must remain separate from official copy and official records.

## Audit Readiness

Future copy governance audit event families may include:

- notification copy drafted,
- notification copy reviewed,
- notification copy approved,
- notification copy rejected,
- unsafe copy blocked,
- template version created,
- template version approved,
- template version disabled,
- AI copy suggestion generated,
- AI copy suggestion accepted,
- AI copy suggestion rejected,
- customer-facing message rendered,
- safe-deny copy rendered,
- service recovery copy approved.

Audit redaction requirements:

- do not record complete mobile,
- do not record raw LINE user id,
- do not record token,
- do not record secret,
- do not record provider credential,
- do not record LINE access token,
- do not record channel secret,
- do not record raw provider payload,
- do not record raw AI payload,
- do not expose audit on customer-visible surfaces.

Task242 does not implement audit runtime.

## Permission / Entitlement Readiness

Task242 does not implement permission or entitlement runtime.

Future questions:

- Who can view templates?
- Who can create templates?
- Who can modify templates?
- Who can approve templates?
- Who can disable templates?
- Who can use AI copy assist?
- Which channel templates require entitlement?
- Which AI copy assist features require AI add-on?
- Which customer-facing messages require supervisor approval?
- Which service recovery messages require legal / privacy review?

Placeholder permission families may include:

- `notification.template.view`,
- `notification.template.create`,
- `notification.template.update`,
- `notification.template.approve`,
- `notification.template.disable`,
- `notification.copy_review.approve`,
- `notification.ai_copy_assist.use`.

Placeholder feature keys may include:

- `notification_templates`,
- `notification_template_versioning`,
- `notification_localization`,
- `notification_service_recovery_copy`,
- `notification_ai_copy_assist`,
- `notification_channel_line`,
- `notification_channel_sms`,
- `notification_channel_email`,
- `notification_channel_app`.

These are future design placeholders only. Task242 does not add production permissions, feature keys, schema, API, Admin UI, localization, tests, or runtime.

## Runtime Readiness Decision For Task242

Runtime allowed now: No.

Task242 defines copy governance only. It does not approve localization, message templates, notification runtime, provider sending, AI copy runtime, audit runtime, permission runtime, entitlement runtime, API, Admin UI, schema, or tests.

Future runtime remains blocked until separate approval covers:

- production copy review,
- localization / template strategy,
- template versioning,
- permission / entitlement,
- AI copy assist controls,
- audit runtime,
- safe-deny wording,
- customer-visible QA,
- tests / QA,
- PM / business / legal / privacy / security / engineering approval where applicable.

## Explicit Non-goals

Task242 does not:

- add localization files,
- add production translations,
- add message template files,
- create template tables,
- create approval workflow runtime,
- create notification tables,
- add provider adapters,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
- send LINE messages,
- send SMS,
- send email,
- send APP push,
- implement notification runtime,
- implement AI copy runtime,
- implement audit runtime,
- implement permission runtime,
- implement entitlement runtime,
- implement usage runtime,
- add automated tests,
- add fixtures,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- operate shared Zeabur,
- connect to DB,
- run DDL,
- run psql,
- run `npm run db:migrate`,
- implement survey runtime,
- implement resolver,
- implement reverse binding runtime,
- implement LINE binding runtime,
- implement AI auto-decision,
- perform destructive cleanup.

## Verification Checklist

Task242 should be verified with:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive / internal diagnostic scan.

Sensitive / internal diagnostic scan should confirm there are no actual:

- DATABASE_URL values,
- passwords,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE user ids,
- customer mobile values,
- raw provider payloads,
- provider credentials,
- real tenant IDs,
- real organization IDs,
- real usage values,
- real pricing values,
- AI token counts,
- stack traces,
- SQL errors,
- DB constraint names,
- production translation strings.

Policy words, placeholders, prohibition lists, and guardrail references are allowed when they do not include actual values.

## Future Task Candidates

Future candidates only; not executed by Task242:

- Notification Manual Resend Policy / No Runtime Change,
- Notification Provider Callback Safety Design / No Runtime Change,
- Notification Audit Redaction Allow-list / No Runtime Change,
- Notification Permission Safe-deny Error Matrix / No Runtime Change,
- Notification Template Versioning Proposal / No Migration,
- Notification Localization Key Draft / No Runtime Change,
- Notification Runtime Readiness Gate / No Runtime Change.
