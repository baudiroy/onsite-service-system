# Task 231 - Customer Channel Identity Safe-Deny and Enumeration Review / No Runtime Change

## Purpose and Scope

Task231 defines a documentation-only safe-deny and resource enumeration review for future customer channel identity flows.

It covers customer identity, channel identity, LINE binding, reverse binding, verification, consent, suppression, provider readiness, survey / notification links, and future Admin / API / customer-facing surfaces.

Task231 is not:

- resource enumeration test implementation,
- API behavior implementation,
- Admin UI implementation,
- customer portal implementation,
- LINE binding runtime,
- reverse binding runtime,
- resolver implementation,
- migration proposal,
- provider sending implementation,
- automated test,
- AI decision engine.

This document does not add endpoints, UI, tests, runtime behavior, schema, or provider sending.

## Enumeration Risk Surfaces

Future risk surfaces:

- customer-facing verification page,
- reverse LINE binding link,
- survey link / notification link,
- LINE rich menu / webhook / message flow,
- SMS / email verification flow,
- Web Portal / App login or linking flow,
- Admin customer search,
- Admin channel identity detail,
- API customer channel identity lookup,
- API binding / verification endpoint,
- provider callback handler,
- audit / diagnostic view,
- export / QA artifact / screenshot / handoff.

Task231 does not add any endpoint, UI, test, fixture, or runtime behavior.

## Information That Must Not Leak

Future errors, messages, status codes, timing, metadata, logs, diagnostics, QA artifacts, exports, and handoffs must not leak:

- whether Case exists,
- whether customer exists,
- whether customer belongs to a specific organization,
- whether mobile is correct,
- whether email is correct,
- whether LINE is bound,
- whether LINE is bound to another customer / Case,
- whether token exists,
- whether token expired,
- whether token was reused,
- whether provider returned identity,
- whether organization enabled a specific channel entitlement,
- whether customer opted out / unsubscribed,
- whether survey / notification exists,
- whether low-rating / complaint / follow-up exists,
- internal workflow status,
- raw LINE user id,
- complete mobile / phone / tel,
- token / secret / provider credential,
- raw provider payload,
- AI raw payload.

## Safe-Deny Response Families

The following safe-deny families are proposal-only. They are not production copy, localization keys, API status implementation, or test assertions.

### Customer-Facing Generic Unavailable

Apply to:

- invalid / expired / reused token,
- Case not found,
- phone mismatch,
- LINE binding mismatch,
- organization mismatch,
- entitlement unavailable,
- provider readiness unavailable,
- ambiguous identity.

Conceptual copy examples:

- "目前無法完成此操作，請稍後再試或聯絡客服。"
- "此連結目前無法使用，請透過官方客服管道協助。"
- "我們無法確認此請求，請重新操作或聯絡客服。"

These are not production translations.

### Admin-Facing Scoped Safe-Deny

Apply to:

- authenticated user without resource scope,
- organization mismatch,
- missing permission,
- hidden customer identity,
- restricted audit / evidence.

Admin-facing copy must avoid revealing whether a cross-organization resource exists.

### API-Facing Safe-Deny

Apply to:

- unknown resource visibility,
- tenant / organization mismatch,
- channel identity ambiguity,
- entitlement or permission failure,
- hidden / deleted / archived resource.

Guidance:

- use generic not available for unknown resource / cross-organization / hidden resource,
- use forbidden only when resource existence is already authorized,
- avoid diagnostic metadata that reveals hidden state.

### Internal Diagnostic Safe Reference

Internal diagnostic can use safe reason categories only when:

- the actor is authenticated,
- the actor is authorized,
- organization scope is verified,
- the surface is internal-only,
- metadata is redacted.

It must not include raw values.

## Scenario Decision Matrix

This matrix is proposal-only. It does not create tests or runtime behavior.

| Scenario | Surface | Risk | Expected safe behavior | Specific detail allowed? | Audit needed? | Customer-visible? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Reverse binding invalid token | Customer verification | Token enumeration | Generic unavailable | No | Future redacted audit | Yes, generic only | No |
| Reverse binding expired token | Customer verification | Token status leak | Generic unavailable / expired only if safe | No | Future redacted audit | Yes, generic only | No |
| Reverse binding reused token | Customer verification | Token lifecycle leak | Generic unavailable | No | Future redacted audit | Yes, generic only | No |
| Phone mismatch | Customer verification | Contact correctness leak | Generic verification failure | No | Future redacted audit | Yes, generic only | No |
| Existing LINE binding conflict | Customer verification | Binding existence leak | Generic failure | No | Future redacted audit | Yes, generic only | No |
| LINE channel mismatch | Customer / API | Channel scope leak | Generic unavailable | No | Future redacted audit | Yes, generic only | No |
| Organization mismatch | Customer / API / Admin | Tenant enumeration | Generic not available | No for customer; scoped category for authorized internal | Future redacted audit | Generic only | No |
| Customer identity ambiguous | Customer / Admin | Identity matching leak | Fail closed and review | Internal category only | Future redacted audit | Generic only | No |
| Case not found | Customer verification | Case enumeration | Generic unavailable | No | Future redacted audit | Yes, generic only | No |
| Survey link not found | Customer survey | Survey enumeration | Generic unavailable | No | Future redacted audit | Yes, generic only | No |
| Notification target missing | Delivery flow | Contact existence leak | Suppress / fail closed | Internal category only | Future redacted audit | No direct detail | No |
| Provider callback without organization scope | Provider callback | Cross-tenant leak | Ignore / fail closed | Internal category only | Future redacted audit | No | No |
| Provider callback unknown LINE user | Provider callback | Identity enumeration | Ignore / fail closed | Internal category only | Future redacted audit | No | No |
| SMS opt-out conflict | Delivery flow | Consent status leak | Suppress / safe deny | Internal category only | Future redacted audit | Generic if customer-facing | No |
| Email unsubscribe conflict | Delivery flow | Consent status leak | Suppress / safe deny | Internal category only | Future redacted audit | Generic if customer-facing | No |
| Admin user lacks permission | Admin | Hidden resource leak | Scoped safe-deny | Only if resource visibility is authorized | Future redacted audit | No | No |
| Tenant admin accesses another organization | Admin / API | Cross-org enumeration | Generic not available | No | Future redacted audit | No | No |
| Entitlement missing | Admin / API / customer | Plan leak | Generic unavailable to customer; safe feature-gate copy internally | Limited internal detail | Future redacted audit | Generic only | No |
| AI suggested identity match but evidence incomplete | Internal review | False match / hidden leak | No bind; human review | Internal category only | Future redacted audit | No | No |

## HTTP Status / Message Guidance

This section is proposal-only guidance and does not implement API behavior.

Guidance:

- 404-style generic not available for unknown resource / cross-organization / hidden resource,
- 403 only when resource existence is already authorized but action permission is missing,
- 409 only when conflict can be safely disclosed to an authorized internal actor,
- 400 validation errors must not reveal which sensitive proof failed,
- 429 / cooldown must not reveal whether token or identity is valid,
- customer-facing flows should avoid raw error codes,
- API response metadata must not include diagnostic raw values.

## Admin and Internal Diagnostic Boundary

Admin-facing allowed only when scoped and permissioned:

- generic blocked reason category,
- redacted channel type,
- masked contact display if policy allows,
- safe audit reference,
- safe correlation reference.

Admin-facing forbidden:

- raw LINE user id,
- complete mobile / phone / tel,
- token,
- provider raw payload,
- provider credential,
- AI raw payload,
- SQL error,
- DB constraint,
- stack trace,
- cross-organization details,
- hidden resource hints.

## Audit Readiness

Future audit events may include:

- safe-deny rendered,
- reverse binding safe-deny rendered,
- channel identity lookup denied,
- channel identity ambiguity detected,
- organization scope mismatch denied,
- permission denied,
- entitlement denied,
- token verification failed,
- token expired,
- token reuse detected,
- provider callback ignored,
- provider identity ambiguity detected,
- AI identity suggestion rejected due to insufficient evidence.

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

Task231 does not implement permission or entitlement runtime.

Future questions:

- Who can see safe-deny reason category?
- Who can view identity ambiguity details?
- Who can view reverse binding failure audit?
- Who can view provider callback ignored reason?
- Who can view entitlement denied internal reason?
- Which safe-deny diagnostics require tenant admin?
- Which diagnostics should be limited to security / support roles?

Placeholder permissions:

- `customer_channel_identity.safe_deny_reason.view`
- `customer_channel_identity.enumeration_review.view`
- `customer_channel_identity.diagnostic.view`
- `customer_channel_identity.audit.view`

Placeholder feature keys:

- `customer_channel_identity_audit`
- `customer_channel_identity_diagnostics`
- `customer_channel_reverse_binding`
- `customer_channel_security_review`

These are not production permissions or production feature keys.

Task231 does not add permission runtime or entitlement runtime.

## AI Advisory-Only Boundary

AI may:

- flag possible enumeration risk,
- check safe-deny copy for leakage,
- summarize redacted diagnostic categories,
- suggest human review priority,
- identify policy gaps.

AI must not:

- reveal hidden resource,
- decide customer identity match,
- bind or reverse-bind LINE,
- lift suppression / opt-out,
- send verification message,
- modify Case / Appointment / Field Service Report,
- approve quote / settlement / refund / compensation,
- create or close complaint,
- bypass permission / organization scope / entitlement,
- write uncertain inference into official record.

## Relationship to Existing Branches

Task231:

- extends Task228 Generic Customer Channel Identities Proposal,
- extends Task229 Verification and Consent Policy,
- extends Task230 Reverse LINE Binding Security Design,
- aligns with Survey safe-deny / messaging policies from Task225,
- aligns with SLA / Operations Risk non-leakage patterns,
- supports future Notification Delivery Readiness.

Task231 does not:

- reopen Survey branch,
- modify SLA / Operations Risk branch,
- modify inventory docs,
- touch Migration020.

## Explicit Non-Goals

Task231 does not:

- create automated test,
- create resource enumeration test,
- add API,
- modify API response behavior,
- modify Admin UI,
- add customer portal,
- add resolver,
- add LINE binding runtime,
- add reverse binding runtime,
- create customer channel identity table,
- create token table,
- add migration,
- modify schema,
- add indexes,
- add provider integration,
- send LINE / APP / SMS / email,
- add notification runtime,
- add survey runtime,
- add audit runtime,
- add permission / entitlement runtime,
- add feature flag / usage metering runtime,
- add AI identity runtime,
- add localization file,
- add message template file,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Task231 is enumeration review documentation only.

Future implementation requires separate PM / user approval for:

- resource enumeration tests,
- API status / response behavior,
- Admin safe-deny UI,
- customer-facing copy,
- resolver,
- reverse binding runtime,
- token runtime,
- provider callback runtime,
- permission and entitlement enforcement,
- audit runtime.

General continuation language does not approve these steps.

## Verification Checklist

Task231 completion should verify:

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
