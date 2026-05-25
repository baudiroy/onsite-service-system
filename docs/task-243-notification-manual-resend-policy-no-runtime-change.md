# Task 243 - Notification Manual Resend Policy / No Runtime Change

## Purpose And Scope

This document defines future policy boundaries for notification manual resend, resend request, approval, duplicate suppression, opt-out, suppression, provider retry, no-send / sandbox, audit, permission, entitlement, and usage controls.

Task243 is documentation-only.

This task is not:

- manual resend runtime,
- notification runtime,
- provider sending,
- LINE integration,
- SMS integration,
- email integration,
- APP integration,
- outbox / worker implementation,
- retry scheduler implementation,
- API implementation,
- Admin implementation,
- migration / schema / index implementation,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

Task243 does not send messages, create resend tables, create APIs, modify backend/Admin code, or approve provider delivery.

## Manual Resend Principles

Manual resend is a future controlled operation, not a workaround for weak idempotency or unsafe retry design.

Principles:

- manual resend must be requested by a human actor,
- actor identity is required,
- organization scope is required,
- permission is required,
- resend reason is required,
- audit is required,
- opt-out / unsubscribe / suppression must be checked,
- duplicate suppression / idempotency must be checked,
- no-send / sandbox / production gate must be checked,
- provider readiness must be checked,
- customer-visible copy must be approved,
- manual resend must not be triggered automatically by AI,
- manual resend must not be triggered automatically by provider callback,
- manual resend must not be triggered by browser refresh, frontend retry, or duplicate API request,
- manual resend must not modify Case official status,
- manual resend must not modify Appointment official status,
- manual resend must not modify Field Service Report official status.

Manual resend must be auditable because it can increase customer contact frequency and provider cost.

## Resend vs Retry vs New Notification

Future implementation must distinguish several concepts.

Conceptual categories:

- retry same delivery attempt,
- resend same notification,
- create new notification,
- supervisor-approved exception,
- customer-requested resend,
- provider-failure retry,
- expired link resend.

These categories are conceptual only.

They are not:

- production enum,
- DB schema,
- API contract,
- Admin UI option,
- runtime behavior.

Future policy must define which category applies before any runtime operation is allowed.

## Required Future Checks Before Resend

Future manual resend should not proceed until checks pass.

Checklist:

1. Authenticate actor.
2. Resolve organization scope.
3. Resolve original notification context.
4. Resolve customer / channel identity safely.
5. Check entitlement.
6. Check permission.
7. Check usage / rate / cost control.
8. Check opt-out / unsubscribe / suppression.
9. Check duplicate policy.
10. Check no-send / sandbox / production mode.
11. Check provider readiness.
12. Check approved customer-facing copy.
13. Check audit readiness.
14. Apply safe-deny / non-leakage.

If any check fails or is ambiguous, future runtime should fail closed.

## Forbidden Resend Behavior

Manual resend must not:

- bypass opt-out / suppression,
- bypass unsubscribe,
- cross organization boundaries,
- resend to ambiguous identity,
- resend to unverified channel identity,
- send to raw provider identifier without safe identity resolution,
- retry across multiple channels just because one provider timed out,
- auto-resend because of AI suggestion,
- leak whether a notification exists through customer-visible error,
- expose provider diagnostics through resend failure wording,
- create repeated customer harassment,
- modify Case / Appointment / Field Service Report official status,
- approve quote / billing / settlement,
- hide complaint risk,
- override no-send / sandbox mode.

Provider timeout is not proof that the customer did not receive the message. Resend policy must avoid duplicate sending.

## No-send / Sandbox Integration

Manual resend must respect no-send and sandbox boundaries.

Principles:

- no-send mode allows only simulation,
- no-send mode must not call real provider APIs,
- no-send mode must not send customer messages,
- sandbox resend must not use production recipients,
- sandbox resend must not use production secrets,
- production resend requires explicit future approval gate,
- no-send result must not be treated as customer received,
- sandbox result must not be treated as production delivery success,
- retry / resend must not bypass no-send / sandbox mode.

Task243 does not implement no-send / sandbox runtime.

## Customer-visible vs Internal-only Separation

Customer-visible copy may include:

- general notification content,
- safe resend / re-send instruction,
- generic unavailable wording,
- safe contact-support wording.

Customer-visible copy must not include:

- resend reason,
- internal approval status,
- provider diagnostics,
- retry count,
- outbox status,
- audit log,
- permission detail,
- entitlement detail,
- usage detail,
- raw LINE user id,
- full mobile,
- token,
- secret,
- AI suggestion,
- internal risk label.

Internal-only resend diagnostics must remain role-gated, organization-scoped, redacted, and separated from customer-visible copy.

## Safe-deny And Non-leakage

Manual resend flows must not reveal protected resource existence.

Future safe-deny mapping:

- notification not found: generic unavailable,
- permission missing: generic unavailable / scoped denial,
- entitlement missing: generic unavailable,
- usage limit blocked: generic unavailable,
- channel identity ambiguous: generic unavailable,
- opt-out / suppression active: generic unavailable or safe internal block,
- provider unavailable: generic temporarily unavailable,
- cross-organization resource: generic unavailable.

Customer-facing output must not reveal:

- whether notification exists,
- whether Case exists,
- whether customer exists,
- whether LINE is bound,
- whether mobile is correct,
- whether provider attempted sending,
- entitlement / plan / quota internal detail,
- provider diagnostic detail,
- suppression rule detail.

Authorized internal surfaces may show more specific categories only after organization scope, permission, and visibility are confirmed.

## Audit Readiness

Future manual resend audit event families may include:

- notification resend requested,
- notification resend approved,
- notification resend rejected,
- notification resend executed,
- notification resend blocked by permission,
- notification resend blocked by entitlement,
- notification resend blocked by usage limit,
- notification resend blocked by suppression,
- notification resend blocked by duplicate policy,
- notification resend blocked by no-send,
- notification resend simulated,
- notification resend provider attempt skipped,
- AI resend suggestion generated,
- AI resend suggestion rejected.

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

Task243 does not implement audit runtime.

## Permission / Entitlement / Usage Readiness

Task243 does not implement permission, entitlement, or usage runtime.

Future questions:

- Who can request manual resend?
- Who can approve resend?
- Who can execute resend?
- Who can view resend diagnostics?
- Who can override duplicate suppression?
- Who can view usage / cost block?
- Which channel resend requires entitlement?
- Does manual resend count toward usage?
- Does sandbox resend count toward usage?
- Does failed resend count toward usage?
- Which resend categories require supervisor approval?
- Which resend categories require customer request evidence?

Placeholder permissions may include:

- `notification.resend.request`,
- `notification.resend.approve`,
- `notification.resend.execute`,
- `notification.resend.diagnostics.view`,
- `notification.resend.duplicate_override.request`,
- `notification.resend.duplicate_override.approve`.

Placeholder feature keys may include:

- `notification_manual_resend`,
- `notification_resend_approval`,
- `notification_duplicate_suppression`,
- `notification_resend_diagnostics`,
- `notification_resend_usage_metering`.

These are future design placeholders only. Task243 does not add production permissions, feature keys, schema, API, Admin UI, localization, tests, or runtime.

## AI Advisory-only Boundary

AI may:

- suggest that a case might need human resend review,
- summarize resend failure category using redacted inputs,
- check whether resend reason is safe and complete,
- flag duplicate / suppression / provider risk,
- suggest internal triage wording for a human actor.

AI must not:

- request resend,
- approve resend,
- execute resend,
- retry provider delivery,
- remove suppression,
- remove opt-out,
- switch production mode,
- turn off no-send,
- send notifications,
- modify provider config,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- write uncertain inference into official records.

AI suggestion is not a resend action.

## Runtime Readiness Decision For Task243

Runtime allowed now: No.

Task243 defines manual resend policy only. It does not approve manual resend runtime, API, provider sending, outbox / worker, retry scheduler, audit runtime, permission runtime, entitlement runtime, usage metering, schema, Admin UI, tests, or localization.

Future runtime remains blocked until separate approval covers:

- resend API contract,
- permission and entitlement enforcement,
- duplicate suppression,
- opt-out / suppression enforcement,
- no-send / sandbox implementation,
- provider sending controls,
- audit runtime,
- usage / cost control,
- Admin UI behavior,
- tests / QA,
- PM / business / security / engineering approval.

## Explicit Non-goals

Task243 does not:

- create manual resend tables,
- create notification tables,
- create outbox tables,
- create retry scheduler,
- create worker,
- create provider adapter,
- create callback route,
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
- implement audit runtime,
- implement permission runtime,
- implement entitlement runtime,
- implement usage runtime,
- implement feature flags,
- add localization files,
- add message template files,
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

Task243 should be verified with:

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

Future candidates only; not executed by Task243:

- Notification Provider Callback Safety Design / No Runtime Change,
- Notification Audit Redaction Allow-list / No Runtime Change,
- Notification Permission Safe-deny Error Matrix / No Runtime Change,
- Notification Template Versioning Proposal / No Migration,
- Notification Localization Key Draft / No Runtime Change,
- Notification Resend API Contract Draft / No Runtime Change,
- Notification Runtime Readiness Gate / No Runtime Change.
