# Task 234 - Notification Delivery Readiness Planning / No Runtime Change

## Purpose And Scope

This document defines the future readiness boundary for notification delivery.

The goal is to make future notification work safer before any runtime implementation begins. Notifications may eventually support appointment reminders, completion notices, survey invitations, customer follow-up, quote reminders, pending parts updates, internal staff alerts, and channel binding messages.

Task234 is planning only. It does not approve notification runtime, provider sending, channel integration, worker execution, schema changes, or customer-visible messages.

This task is not:

- notification runtime,
- provider sending,
- LINE integration,
- SMS integration,
- email integration,
- APP push integration,
- web portal notification implementation,
- event outbox / worker implementation,
- API implementation,
- Admin implementation,
- migration / schema / index implementation,
- localization implementation,
- message template implementation,
- AI auto-decision.

Future notification design must preserve:

- one Case = one formal Field Service Report,
- one Case may have multiple appointments / dispatch visits,
- finalAppointmentId remains backend / system-determined,
- notification delivery cannot modify Case / Appointment / Field Service Report official state by itself,
- LINE is a current primary channel but not the only possible customer channel,
- provider identifiers are not global customer identities,
- organization scope and tenant isolation are mandatory,
- permission and entitlement are separate controls,
- AI remains advisory only.

## Notification Capability Boundaries

Notification capability should be split into explicit layers. Future implementation should not collapse these into one opaque "send message" action.

### Eligibility

Eligibility decides whether a notification category is allowed to be considered.

Eligibility may depend on:

- organization scope,
- Case / Appointment / Field Service Report lifecycle state,
- customer contact availability,
- consent / opt-in status,
- suppression / opt-out status,
- entitlement / feature gate,
- permission for manual actions,
- idempotency / duplicate suppression,
- configured business rules,
- no-send / sandbox mode.

Eligibility must not depend on AI as the final authority. AI may suggest a risk or missing-field warning, but the official decision to allow notification consideration must be deterministic and auditable.

### Recipient / Channel Identity Resolution

Recipient resolution decides which internal customer/contact reference may receive a future notification.

Channel identity resolution decides which verified, consented, non-suppressed channel identity can be used for delivery.

Resolution must:

- stay organization-scoped,
- avoid raw provider identifiers as core identity,
- fail closed when identity is ambiguous,
- avoid leaking whether a Case, customer, mobile, LINE identity, or channel configuration exists,
- separate customer identity from channel identity,
- support future LINE / APP / SMS / email / web portal channels.

### Message Composition

Message composition builds customer-visible or staff-visible content.

Composition should use approved templates or approved copy sources. It should not expose:

- internal notes,
- audit logs,
- provider diagnostics,
- permission / entitlement details,
- AI raw payload,
- raw provider identifiers,
- full customer payload,
- full report payload,
- raw appointment payload.

AI may assist with drafting or checking copy, but AI output must remain advisory until approved by deterministic workflow or authorized human review.

### Delivery Scheduling

Delivery scheduling decides when a notification should be attempted.

Future scheduling may support:

- immediate send,
- delayed send,
- reminder window,
- quiet hours,
- business hours,
- rate limit / cooldown,
- retry schedule,
- manual follow-up queue,
- no-channel pending state.

Scheduling must not modify formal business state. A scheduled notification cannot complete a Case, close a complaint, approve a quote, approve settlement, or override an appointment result.

### Provider Sending

Provider sending is the final outbound step to LINE, APP push, SMS, email, or another provider.

Provider sending is not implemented by this task.

Future sending must require:

- organization-scoped provider configuration,
- secure secret management,
- entitlement / feature gate,
- no-send / sandbox policy,
- idempotency / duplicate suppression,
- provider response redaction,
- audit readiness,
- kill switch / disable switch.

### Delivery Result Handling

Provider result handling should record delivery attempt status without turning provider callbacks into official business workflow authority.

A provider delivered / failed / clicked / replied event must not by itself:

- complete a Case,
- complete an appointment,
- finalize a Field Service Report,
- approve a quote,
- approve billing / settlement,
- bind a customer identity,
- close a complaint,
- trigger AI auto-decision.

### Audit / Diagnostics

Notification diagnostics should support operations and troubleshooting while staying internal and redacted.

Diagnostics must not be visible to customers and must not expose raw provider payloads, credentials, raw identifiers, stack traces, SQL errors, or DB constraint names in handoff output.

### Usage / Cost Tracking

Notification delivery may eventually affect SaaS costs and entitlement.

Future usage metering may track:

- LINE push attempts,
- SMS sends,
- email sends,
- APP push sends,
- AI-assisted copy generation,
- provider callback volume,
- retry attempts,
- storage for delivery evidence.

Task234 does not implement usage metering, billing events, feature flags, or entitlement runtime.

## Channel-agnostic Principles

Notifications must be designed as channel-agnostic platform capability.

LINE is the current primary customer channel, but future delivery may support:

- LINE,
- self-owned APP push,
- SMS,
- email,
- web link,
- web portal,
- admin manual follow-up.

Principles:

- Core Case / Appointment / Field Service Report logic must not hard-code LINE.
- `line_user_id` must be scoped by organization_id + line_channel_id + line_user_id.
- Raw provider identifiers must not become global customer identity.
- Provider callback status must not decide official Case / Appointment / Field Service Report status.
- Delivery resolver should map internal customer/contact references to eligible channel identities at send time.
- A customer may have no currently deliverable channel.
- Existing case reverse LINE binding must remain compatible with future notification delivery.
- Customer-visible notification content must be independent of internal provider diagnostics.

## Future Notification Categories

The following categories are future design candidates. Listing them here does not approve runtime implementation.

| Category | Future purpose | Notes |
| --- | --- | --- |
| Appointment reminder | Remind customer of an upcoming appointment | Must respect opt-out, quiet hours, idempotency, and channel eligibility. |
| Reschedule notice | Inform customer about appointment changes | Must not leak internal scheduling notes or route details beyond approved copy. |
| Engineer on-the-way notice | Let customer know an engineer is on the way | Must not expose sensitive engineer/internal route data. |
| Completion notice | Confirm service completion summary availability | Should reference Case-level completion context, not create a second formal report. |
| Survey invitation | Invite customer to post-completion feedback | Must only follow valid first-completion/survey policy; no repeat completion trigger. |
| Customer follow-up | Support service quality or complaint follow-up | Must not auto-close complaint or hide negative feedback. |
| Quote decision reminder | Remind customer to approve/reject quote | Must not imply quote approval occurred. |
| Pending parts update | Inform customer about parts waiting / arrival status | Must not expose internal supplier notes unless approved. |
| Cancellation notice | Inform customer of cancellation / no-show handling | Must use safe, neutral language. |
| Safe verification / binding message | Support channel verification or reverse binding | Must not leak Case existence, mobile correctness, or binding status on failure. |
| Internal staff alert | Notify staff about risk / SLA / exception | Must be permission-scoped and not customer-visible. |

## Delivery Prerequisites

Future delivery should not proceed unless prerequisites are satisfied:

- organization scope resolved,
- recipient internal identity resolved,
- channel identity verified where required,
- consent / opt-in valid where required,
- opt-out / unsubscribe / suppression respected,
- approved customer-visible copy available,
- provider config available under organization scope,
- feature entitlement / gate checked,
- user permission checked for manual delivery actions,
- idempotency / duplicate suppression checked,
- rate limit / cooldown checked,
- audit readiness available,
- no-send / sandbox mode verified before production sending,
- kill switch / disable switch not active.

If any prerequisite fails, the system should fail closed with a safe internal status and safe external message.

## No-send Mode And Provider Safety

No-send mode must exist before production notification sending is allowed.

No-send / sandbox readiness should support:

- generating eligibility decision without provider call,
- resolving recipient / channel candidate without revealing raw identifiers in logs,
- composing safe payload preview without sending,
- writing internal diagnostics in redacted form,
- verifying idempotency behavior,
- verifying suppression / opt-out behavior,
- verifying entitlement and permission checks,
- preventing provider network calls,
- preventing LINE / APP / SMS / email send attempts.

Provider safety requirements:

- provider credentials must not be committed,
- provider credentials must not be logged,
- provider credentials must be organization-scoped when future multi-tenant provider config exists,
- provider response must be redacted before diagnostics,
- raw provider payload must not be pasted in QA or handoff,
- provider retry must have rate limit / cooldown,
- provider sending must have a disable switch,
- sandbox / test provider mode must not target real customers.

## Customer-visible vs Internal Delivery Data

Customer-visible surfaces may show only safe notification content and general state.

Customers must not see:

- provider diagnostics,
- retry status details,
- audit log,
- internal notes,
- AI suggestions,
- permission details,
- entitlement details,
- raw provider identifiers,
- raw LINE user id,
- internal workflow status,
- stack traces,
- SQL errors,
- DB constraint names.

Internal staff surfaces should still follow least privilege. Support staff, dispatchers, supervisors, finance, and engineers should not automatically see all notification diagnostics.

## Delivery Failure And Retry Boundary

Delivery failure is a delivery-layer state, not a business-state decision.

Delivery failure must not:

- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- clear finalAppointmentId,
- reopen a completed report,
- approve or reject a quote,
- approve billing / settlement,
- close a complaint,
- change customer identity verification.

Retry means retrying a delivery attempt. It does not mean re-evaluating or mutating official Case / Appointment / Field Service Report state.

Retry must still respect:

- opt-out / unsubscribe,
- suppression,
- entitlement,
- permission,
- idempotency,
- rate limit / cooldown,
- kill switch,
- no-send / sandbox policy.

Manual resend, if ever implemented, requires:

- explicit permission,
- organization scope,
- audit record,
- suppression check,
- idempotency / duplicate suppression check,
- safe copy,
- reason / note where appropriate,
- no ability to override official business state.

## Safe-deny And Non-leakage

Notification and channel resolution flows must avoid enumeration.

Failure responses must not leak:

- whether a Case exists,
- whether a customer exists,
- whether a mobile / phone / tel is correct,
- whether LINE is bound,
- whether a survey exists,
- whether a notification exists,
- whether an organization has a channel enabled,
- whether a provider found an identity,
- whether a tenant has a paid feature,
- whether a token exists, expired, or was reused.

Customer-facing denial should be generic and actionable. Internal diagnostics may be more specific only when role, organization scope, and redaction rules allow it.

## Audit Readiness

Future notification audit event families may include:

- notification eligibility evaluated,
- notification blocked by lifecycle state,
- notification blocked by entitlement,
- notification blocked by permission,
- notification blocked by opt-out / unsubscribe,
- notification blocked by suppression,
- notification blocked by no-send / sandbox policy,
- notification blocked by missing provider config,
- recipient resolved,
- recipient resolution blocked,
- channel identity resolved,
- channel identity ambiguous,
- message composed,
- message composition blocked,
- notification scheduled,
- notification suppressed,
- delivery attempt created,
- delivery attempted,
- delivery succeeded,
- delivery failed,
- retry scheduled,
- retry skipped,
- manual resend requested,
- manual resend approved,
- manual resend rejected,
- provider callback received,
- provider callback ignored,
- opt-out respected,
- AI notification suggestion generated,
- AI notification suggestion accepted,
- AI notification suggestion rejected.

Audit payloads must be allow-listed and redacted.

Audit payloads must not contain:

- full customer mobile,
- raw LINE user id,
- provider credentials,
- LINE access token,
- channel secret,
- token / password / secret,
- raw provider payload,
- raw AI payload,
- full customer payload,
- full report payload,
- full appointment payload,
- DATABASE_URL,
- stack trace,
- SQL error,
- DB constraint name.

## Permission / Entitlement / Usage Readiness

Permission and entitlement are separate concepts:

- permission controls whether a user may perform an action,
- entitlement controls whether an organization / tenant has access to a feature.

Future notification capability may require both.

Placeholder permission families may include:

- `notification.read`,
- `notification.preview`,
- `notification.schedule`,
- `notification.resend`,
- `notification.cancel`,
- `notification.diagnostics.read`,
- `notification.provider_config.manage`.

Placeholder feature keys may include:

- `notification_basic`,
- `notification_line`,
- `notification_sms`,
- `notification_email`,
- `notification_app_push`,
- `notification_survey_invitation`,
- `notification_appointment_reminder`,
- `notification_manual_resend`,
- `notification_delivery_diagnostics`,
- `notification_usage_metering`,
- `ai_notification_copy_assist`,
- `ai_notification_risk_check`.

These are design placeholders only. Task234 does not add permission logic, entitlement logic, feature flag runtime, usage metering, schema, migration, API, Admin UI, localization, or tests.

Future usage metering should be considered for:

- LINE push attempts,
- SMS sends,
- email sends,
- APP push attempts,
- AI copy assistance,
- AI notification risk checks,
- export / evidence download if added,
- provider callback volume,
- retry count.

Usage metrics must not expose real usage values in public handoffs or customer-visible surfaces.

## AI Advisory-only Boundary

AI may assist notification operations by:

- drafting customer-visible copy for human or deterministic-template review,
- checking copy against safety rules,
- suggesting missing data before sending,
- identifying suppression / idempotency risk,
- classifying provider failures for internal triage,
- summarizing delivery diagnostics for staff,
- suggesting whether a case should receive human follow-up,
- warning about risky timing or duplicate notification patterns.

AI must not:

- send notifications,
- resend notifications,
- choose the official delivery channel as final authority,
- bypass opt-out / unsubscribe / suppression,
- bypass entitlement or permission,
- open a paid feature,
- modify Case / Appointment / Field Service Report status,
- approve quote / billing / settlement,
- bind or verify customer identity,
- write provider identifiers into official records,
- mark complaint resolved,
- write uncertain content as fact,
- expose raw provider or AI payloads.

AI suggestion and official record must remain separate.

## Readiness Decision For Task234

Runtime allowed now: No.

Task234 concludes that notification delivery needs a separate readiness package before any runtime begins. At minimum, future implementation requires:

- provider configuration design,
- no-send / sandbox mode,
- entitlement and permission decision,
- channel resolver implementation approval,
- safe copy / template strategy,
- audit event schema / runtime approval,
- idempotency / suppression model,
- usage metering decision,
- provider credential handling policy,
- test / QA strategy,
- explicit PM / business / security / engineering approval.

## Non-goals

Task234 does not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
- modify routes,
- modify controllers,
- modify services,
- modify repositories,
- modify OpenAPI / Swagger,
- modify generated clients,
- modify test files,
- modify fixtures,
- modify smoke tests,
- modify QA scripts,
- modify localization files,
- modify message template files,
- modify `package.json`,
- modify inventory docs,
- connect to DB,
- run DDL,
- run psql,
- run `npm run db:migrate`,
- dry-run or apply Migration020,
- operate shared Zeabur runtime,
- send LINE / APP / SMS / email,
- call provider sending,
- implement survey runtime,
- implement notification runtime,
- implement audit runtime,
- implement permission runtime,
- implement entitlement runtime,
- implement feature flag runtime,
- implement usage metering runtime,
- implement resolver,
- implement reverse binding runtime,
- implement LINE binding runtime,
- generate / hash / validate tokens,
- implement customer portal,
- implement AI identity runtime,
- implement AI auto-decision,
- perform destructive cleanup.

## Verification Checklist

Task234 should be verified with:

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

Future candidates only; not executed by Task234:

- Notification Provider Sending Readiness Checklist / No Runtime Change,
- Notification No-Send Mode and Sandbox Policy / No Runtime Change,
- Notification Outbox and Retry Design / No Runtime Change,
- Notification Permission and Entitlement Matrix / No Runtime Change,
- Notification Delivery Audit Event Catalog / No Runtime Change,
- Notification Provider Configuration and Secret Handling Policy / No Runtime Change,
- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Usage Metering and Cost Control Planning / No Runtime Change.
