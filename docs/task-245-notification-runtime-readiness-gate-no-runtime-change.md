# Task 245 - Notification Runtime Readiness Gate / No Runtime Change

## Purpose And Scope

This document summarizes the Notification Delivery Readiness branch from Task234 through Task244 and defines a future runtime readiness gate.

Task245 is documentation-only. It is not implementation approval.

This task is not:

- notification runtime implementation,
- provider sending approval,
- DB / migration approval,
- API implementation,
- Admin implementation,
- outbox / worker approval,
- provider adapter approval,
- callback route approval,
- permission runtime approval,
- entitlement runtime approval,
- usage metering runtime approval,
- automated test approval,
- AI auto-decision approval.

Completion of this document must not be interpreted as permission to implement DB changes, provider sending, notification runtime, API routes, Admin UI, workers, callbacks, provider adapters, or automated tests.

## Branch Input Summary

The Notification Delivery Readiness branch currently consists of proposal and policy documents only.

| Task | Main design conclusion | Explicit non-implemented boundary | Runtime allowed now? |
| --- | --- | --- | --- |
| Task234 - Notification Delivery Readiness Planning | Notification must be split into eligibility, recipient / channel identity resolution, message composition, scheduling, provider sending, result handling, audit, and usage layers. Provider status must not mutate official business state. | No runtime, provider sending, schema, API, Admin, outbox / worker, localization, message templates, or AI auto-decision. | No |
| Task235 - Notification No-Send Mode and Sandbox Policy | No-send and sandbox must be explicit safety modes. Production sending needs a separate approval gate and must not be implied by tests or docs. | No no-send runtime, sandbox runtime, provider call, API, Admin, feature flag, provider config, or tests. | No |
| Task236 - Notification Provider Configuration and Secret Handling Policy | Provider config and credentials must be organization-scoped, secret-safe, redacted, and separated from customer-visible copy and AI prompts. | No provider config schema, secret storage, credential validation runtime, API, Admin, provider integration, or secret reads. | No |
| Task237 - Notification Provider Sending Readiness Checklist | Provider sending requires business, security, engineering, provider/channel, no-send/sandbox, copy, audit, usage, and rollback readiness before any outbound message. | No provider sending, production approval, sandbox execution, runtime, API, Admin, schema, tests, or provider credentials. | No |
| Task238 - Notification Outbox And Retry Design | Outbox and retry must be idempotent, duplicate-safe, auditable, organization-scoped, and separated from official Case / Appointment / Field Service Report state. | No outbox table, worker, retry scheduler, schema, API, Admin, provider sending, or tests. | No |
| Task239 - Notification Delivery Audit Event Catalog | Future audit events should cover eligibility, channel resolution, composition, outbox, delivery, retry, manual resend, no-send, callbacks, permission, entitlement, usage, and AI advisory flows. | Event examples are placeholders only; no audit runtime, schema, API, Admin, tests, or production event names. | No |
| Task240 - Notification Permission And Entitlement Matrix | Permission, entitlement, usage, and subscription state are separate layers. Organization entitlement is not user permission, and AI must not bypass either. | Placeholder permissions and feature keys only; no RBAC, entitlement, feature flag, usage, API, Admin, schema, seed, or tests. | No |
| Task241 - Notification Usage Metering And Cost Control Planning | Usage and cost gates should protect LINE / SMS / email / APP / AI / retry / resend / diagnostics capabilities before production delivery is allowed. | No usage records, billing events, prices, quotas, feature flags, runtime, provider sending, exports, or tests. | No |
| Task242 - Notification Customer Copy Template Governance | Customer-visible copy requires approved templates, safe wording, localization readiness, internal/customer data separation, and AI advisory-only drafting. | No template files, localization keys, runtime composition, API, Admin, provider sending, or tests. | No |
| Task243 - Notification Manual Resend Policy | Manual resend is a controlled human action, not an automatic retry shortcut. It needs actor, reason, permission, entitlement, suppression, duplicate, no-send/sandbox, audit, and copy checks. | No manual resend runtime, API, Admin, provider sending, outbox / worker, retry scheduler, schema, tests, or localization. | No |
| Task244 - Notification Provider Callback Safety Design | Provider callback is a diagnostic signal, not an official business decision. Callback handling must preserve source validation, redaction, org/channel scope, identity boundary, business state isolation, and fail-closed behavior. | No callback route, webhook runtime, provider adapter, parser, signature validation, API, Admin, schema, tests, provider sending, or audit runtime. | No |

## Readiness Matrix

The matrix below is a proposal-only readiness gate. It does not approve runtime.

| Area | Current docs coverage | Readiness status | Required approval before implementation | Key blockers | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- |
| Notification eligibility | Task234 defines layers and prerequisites. | Policy outline only | PM / business, security, engineering | No deterministic eligibility service, no schema, no tests | No |
| Recipient / channel identity resolution | Task234 and Task244 define channel-agnostic and identity boundaries. | Conceptual | PM / business, security, engineering, channel owner | No runtime resolver, no verified channel identity contract, no safe-deny tests | No |
| Message composition / template governance | Task242 defines copy, template, localization, and AI drafting guardrails. | Policy outline | PM / business, localization, security, engineering | No template registry, no localization keys, no production copy approval | No |
| No-send mode | Task235 defines no-send boundary. | Policy outline | Engineering, security, PM | No runtime flag, no provider bypass test, no Admin/ops surface | No |
| Sandbox mode | Task235 and Task237 define sandbox expectations. | Policy outline | Provider/channel owner, security, engineering | No provider sandbox config, no sandbox recipient policy, no tests | No |
| Provider config | Task236 defines config and secret handling policy. | Policy outline | Security, engineering, provider/channel owner | No schema, no secret store, no config validation path | No |
| Secret handling | Task236 defines redaction and storage principles. | Policy outline | Security, engineering | No approved secret backend, no rotation workflow, no access control runtime | No |
| Provider callback safety | Task244 defines callback boundaries. | Policy outline | Security, engineering, provider/channel owner | No route, parser, signature verification, replay protection, callback tests | No |
| Outbox | Task238 defines outbox concepts. | Design outline | Engineering, PM, security | No schema, worker, transaction boundary, dead-letter policy runtime | No |
| Retry | Task238 defines retry concepts. | Design outline | Engineering, PM, security | No retry scheduler, retry caps, storm prevention runtime, tests | No |
| Manual resend | Task243 defines policy boundaries. | Policy outline | PM / business, security, engineering | No human action flow, approval flow, duplicate/suppression runtime, tests | No |
| Duplicate suppression | Task238 and Task243 define intent. | Conceptual | Engineering, security | No idempotency keys, storage, unique policy, tests | No |
| Audit event catalog | Task239 catalogs placeholders. | Catalog only | Security, engineering, PM | No audit runtime, schema, event naming freeze, redaction tests | No |
| Permission / entitlement | Task240 defines matrix. | Placeholder matrix | PM / business, security, engineering | No runtime enforcement, seed data, API guard, Admin disabled states | No |
| Usage / cost control | Task241 defines planning. | Policy outline | PM / business, finance, engineering | No usage records, quota runtime, billing event runtime, rate limit runtime | No |
| Safe-deny / non-leakage | Task234, Task240, Task243, Task244 cover principles. | Policy outline | Security, engineering | No error matrix, no resource enumeration tests, no API contract | No |
| Customer-visible / internal separation | Task234, Task239, Task242, Task244 cover principles. | Policy outline | PM / business, security, engineering | No template runtime, no Admin visibility matrix, no redaction tests | No |
| AI advisory | Task234, Task239, Task240, Task242, Task244 preserve advisory-only boundary. | Policy outline | PM / business, security, engineering | No AI prompt allow-list, no audit acceptance/rejection flow, no AI runtime approval | No |
| LINE / SMS / Email / APP provider sending | Task237 defines sending readiness checklist. | Not ready | Provider/channel owner, PM / business, security, engineering | No provider config, no sandbox/no-send runtime, no production approval, no provider adapter | No |
| API | Mentioned as future need across documents. | Not designed | Engineering, PM / business, security | No API contract, safe-deny mapping, permission / entitlement middleware, tests | No |
| Admin UI | Mentioned as future need across documents. | Not designed | PM / business, design, security, engineering | No wireframes, role surface, empty states, disabled states, diagnostics policy | No |
| DB schema / migration | Mentioned as future need across documents. | Not approved | Engineering, security, PM / business | No schema proposal, no migration approval, no local dry-run approval | No |
| Automated tests / smoke tests | Mentioned as future need across documents. | Not implemented | Engineering, QA | No fixtures, no no-send tests, no safe-deny tests, no callback tests | No |

## Required Gates Before Any Future Implementation

Future notification implementation must not begin until explicit gates are approved.

### PM / Business Gates

- notification scope approval,
- notification category approval,
- customer-facing copy approval,
- manual resend policy approval,
- provider sending rollout approval,
- production sending approval.

### Security / Privacy Gates

- provider credential handling review,
- secret management review,
- redaction / diagnostic policy review,
- organization isolation review,
- resource enumeration / safe-deny review,
- callback signature / replay protection design review,
- customer identity / consent / suppression review.

### Engineering Gates

- schema / migration proposal,
- API contract,
- Admin UI scope,
- outbox / worker / retry design,
- provider adapter design,
- callback route design,
- permission runtime design,
- entitlement runtime design,
- usage metering design,
- audit runtime design,
- idempotency / duplicate suppression design,
- rollback / disable switch design,
- test strategy.

### Provider / Channel Gates

- LINE provider readiness,
- SMS / email / APP provider readiness,
- provider sandbox readiness,
- no-send implementation readiness,
- organization-scoped provider config,
- channel-specific opt-out / unsubscribe handling,
- rate limit / cooldown / cost control.

### AI Gates

- AI advisory data separation,
- AI suggestion review policy,
- AI suggestion accepted / rejected audit,
- no AI auto-send / auto-resend / auto-production-switch confirmation.

## Explicit Not-ready Blockers

The notification branch is not ready for implementation because the following do not exist yet:

- notification schema,
- provider config schema,
- secret storage,
- notification runtime,
- outbox / worker,
- retry scheduler,
- provider adapter,
- callback route,
- API contract,
- finalized Admin UI design,
- runtime permission enforcement,
- runtime entitlement enforcement,
- usage metering runtime,
- audit runtime,
- localization / production template,
- automated tests / fixtures / smoke,
- provider sandbox implementation,
- no-send runtime implementation,
- production sending approval,
- DB / migration approval.

These blockers are intentional. They keep the branch fail-closed until a future implementation task receives explicit approval.

## Invariant Preservation Review

Notification runtime must preserve the core field-service invariants:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- multi-visit outcomes belong to appointment / dispatch visit,
- Field Service Report remains Case-level final completion summary,
- `field_service_reports.case_id` uniqueness must not be broken,
- same Case must not have multiple open appointments,
- `finalAppointmentId` remains backend / system-determined.

Notification delivery, retry, manual resend, callback, or provider result must not:

- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- modify `finalAppointmentId`,
- complete a Case,
- complete an appointment,
- create a second formal Field Service Report,
- approve quote / billing / settlement,
- create or close a formal complaint,
- bind / unbind customer channel identity,
- remove opt-out / unsubscribe / suppression without approved future workflow.

Provider callback must not become an official business decision.

Notification failure must not automatically create a complaint.

Manual resend must not modify official business state.

## Hard Boundaries Preserved

Task245 does not authorize:

- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run / apply,
- backend `src/` changes,
- Admin source changes,
- API implementation,
- migration / schema / index changes,
- provider sending,
- LINE sending,
- APP push,
- SMS sending,
- email sending,
- notification runtime,
- survey runtime,
- audit runtime,
- permission runtime,
- entitlement runtime,
- feature flag runtime,
- usage metering runtime,
- provider config runtime,
- secret storage,
- outbox / worker,
- retry scheduler,
- callback route,
- provider adapter,
- localization files,
- message template files,
- automated tests / fixtures / smoke tests,
- AI auto-decision,
- package.json changes,
- inventory docs changes,
- shared Zeabur runtime operations.

## Safe Sequencing Recommendation

Future task candidates only; none are approved by Task245:

1. Notification Docs Index and Branch Pause Summary / No Runtime Change.
2. Notification Resource Enumeration and Safe-Deny Test Plan / No Runtime Change.
3. Notification Implementation Risk Register / No Runtime Change.
4. Notification API Contract Draft / No Runtime Change.
5. Notification Schema Proposal / No Migration.
6. Notification Admin Wireframe Requirements / No Admin Code Change.
7. Notification Provider Adapter Design / No Runtime Change.
8. Notification Runtime Readiness Gate v2 after missing designs / No Runtime Change.

Recommended sequencing:

- keep this branch docs-only until the missing safe-deny, API, schema, Admin, and provider adapter designs are reviewed,
- do not implement provider sending before no-send and sandbox are implemented and tested,
- do not implement callbacks before signature / replay / organization / channel validation is designed,
- do not implement Admin diagnostics before role-gated redaction and permission policy are approved,
- do not implement production copy before customer-visible template governance is approved.

## AI Advisory-only Readiness Review

AI may assist future notification operations by:

- checking readiness checklist completeness,
- summarizing redacted diagnostics,
- reminding operators about provider / suppression / duplicate / callback risk,
- drafting internal copy review notes,
- identifying possible policy gaps for human review.

AI must not:

- automatically send notification,
- automatically resend notification,
- automatically switch production sending on,
- automatically disable no-send,
- automatically create provider config,
- read secrets,
- output secrets,
- rotate secrets,
- queue notification,
- retry notification,
- cancel notification,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- approve quote,
- approve billing / settlement,
- approve refund / compensation,
- create or close complaint,
- open entitlement,
- increase usage limit,
- bypass organization scope,
- bypass permission,
- bypass entitlement,
- write uncertain inference into official record.

AI remains an advisory assistant, not an operator, provider, workflow engine, or official record authority.

## Explicit Non-goals

Task245 does not:

- approve notification runtime,
- create notification table,
- create outbox table,
- create provider config table,
- create provider adapter,
- create callback route,
- add secret storage,
- add migration,
- modify schema,
- add API,
- modify backend,
- modify Admin,
- send LINE,
- send SMS,
- send email,
- send APP push,
- add worker / retry scheduler,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage runtime,
- add localization,
- add message template,
- add automated tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- execute DB connection,
- execute psql,
- execute `npm run db:migrate`,
- execute DDL,
- execute cleanup,
- operate shared Zeabur runtime.

## Verification Checklist

Task245 should be verified with:

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

Future candidates only; not executed by Task245:

- Notification Docs Index and Branch Pause Summary / No Runtime Change,
- Notification Resource Enumeration and Safe-Deny Test Plan / No Runtime Change,
- Notification Implementation Risk Register / No Runtime Change,
- Notification API Contract Draft / No Runtime Change,
- Notification Schema Proposal / No Migration,
- Notification Admin Wireframe Requirements / No Admin Code Change,
- Notification Provider Adapter Design / No Runtime Change,
- Notification Runtime Readiness Gate v2 / No Runtime Change.
