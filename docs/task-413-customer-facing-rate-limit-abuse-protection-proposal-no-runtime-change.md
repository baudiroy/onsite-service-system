# Task413 — Customer-Facing Rate-Limit / Abuse Protection Proposal / No Runtime Change

Task413 proposes future rate-limit and abuse-protection boundaries for
customer-facing token/link access, route/controller entry points, resolver
decisions, channel identity lookup, issue/follow-up entry points, and support
fallback flows.

This task is documentation-only. It is not a runtime kickoff and does not
authorize middleware, rate-limit runtime, abuse detection runtime, API, DB,
provider sending, localization runtime, or AI runtime.

## Current Baseline

Task413 follows the Task370-412 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing pure utilities and pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.
- Token/link lifecycle proposal.
- Audit/security event model proposal.
- Audit/security event permission matrix proposal.
- Generic safe-deny localization/message key proposal.
- Safe-deny test matrix proposal.
- Runtime readiness consolidation cutline.

Current state remains:

- no customer-facing runtime,
- no rate-limit middleware,
- no abuse detection runtime,
- no route/controller/API implementation,
- no resolver runtime,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task413 does not authorize rate-limit runtime, API, DB, middleware, provider
sending, localization, or AI runtime.

## Threat Model

Future customer-facing access must account for abuse patterns without creating
existence leakage.

Threats include:

- token guessing,
- token replay,
- expired token probing,
- revoked token probing,
- customer enumeration,
- case enumeration,
- appointment enumeration,
- report enumeration,
- channel identity binding probing,
- repeated issue/follow-up spam,
- link reissue abuse,
- support-assisted overreach,
- cross-organization probing,
- timing-based leakage.

These threats are future design inputs only. Task413 does not implement
detection or blocking.

## Rate-Limit Principles

Future rate-limit and abuse protection should follow these principles:

- Default deny.
- Tenant-scoped.
- Purpose-bound.
- Route-family-aware internally.
- Externally generic.
- Channel-agnostic.
- Permission-aware.
- Data-minimized.
- Auditable.
- Human-controlled for high-risk support actions.

Detailed principles:

- Rate-limit decisions must include organization scope.
- Rate-limit decisions should consider route family, but external response must
  not reveal route-specific denial reason.
- Rate-limit decisions must not be LINE-only.
- Rate-limit results must not reveal internal cause to customers.
- `line_user_id` must not be used as a global rate-limit key.
- Raw token must not be used as a log-visible key.
- Raw channel id must not be used as a log-visible key.
- Complete phone number must not be used as a log-visible key.
- Complete address must not be used as a log-visible key.
- Rate-limit must not replace permission checks.
- Rate-limit must not replace resolver authorization.
- Rate-limit must not become a support bypass.

## Future Conceptual Keys

The following are symbolic design candidates only. They are not implemented by
Task413.

Future rate-limit/abuse keys may reference:

- organization scope reference,
- route family,
- sanitized request reference,
- sanitized token reference,
- symbolic channel identity reference,
- symbolic customer identity reference,
- IP coarse bucket placeholder,
- device coarse bucket placeholder,
- user-agent coarse bucket placeholder,
- correlation reference.

Forbidden key material:

- raw token,
- raw channel id,
- raw `line_user_id`,
- complete phone number,
- complete address,
- secret,
- access token,
- channel secret,
- webhook secret,
- binding token,
- verification code,
- `DATABASE_URL`,
- raw provider payload,
- cross-organization data.

Design notes:

- The future implementation should use derived/sanitized references, not raw
  sensitive values.
- Log-visible keys should be safe to inspect by authorized staff without
  exposing secrets or customer personal data.
- Coarse IP/device/user-agent buckets may help abuse detection, but they must
  be handled as privacy-sensitive metadata.
- Any future analytics over abuse signals must remain tenant-scoped unless a
  separate anonymized aggregate design is approved.

## Abuse Response Behavior

Future abuse outcomes should externally collapse to generic safe-deny where
appropriate.

Sensitive outcomes include:

- rate-limited,
- blocked,
- suspicious,
- token replay,
- high-frequency probing,
- excessive failed identity checks,
- repeated wrong-purpose token access,
- repeated wrong-resource token access,
- repeated support fallback attempts.

External behavior must not reveal:

- whether a token exists,
- whether a token was previously valid,
- whether a token expired,
- whether a token was revoked,
- whether a token was replayed,
- whether a customer/channel identity exists,
- whether a case/report/appointment exists,
- whether support has internal information about the case.

Leakage surfaces to control:

- status code,
- message key,
- response shape,
- redirect path,
- headers,
- retry-after wording,
- retry hints,
- next-action wording,
- timing.

Controller code must not map abuse category directly to a customer-visible
message key. Retry hints must avoid revealing token state, resource state,
identity state, or customer existence.

## Issue / Follow-up Entry Abuse Boundary

Issue/follow-up entry points must not become existence probes.

Principles:

- Issue/follow-up acknowledgement must be generic.
- Acknowledgement must not confirm that a specific case/report exists unless
  already authorized by projection policy.
- Repeated submissions may create future abuse/security event candidates.
- Repeated submissions must not automatically close complaints.
- Repeated submissions must not hide negative feedback.
- Repeated submissions must not modify customer rating.
- Repeated submissions must not modify official case/report status.
- AI may help summarize future spam patterns for authorized staff.
- AI must not automatically block, close, hide, modify, or downgrade official
  customer feedback.

Future issue/follow-up abuse controls should remain human-reviewable for
high-risk cases.

## Link Reissue / Support Fallback Abuse Boundary

Link reissue is high-risk and must not become an identity or permission bypass.

Future link reissue should require:

- support staff permission,
- purpose validation,
- resource scope validation,
- organization scope validation,
- channel consent or equivalent contact policy,
- verification appropriate to the channel,
- audit/security event recording,
- generic external messaging.

Support staff must not reissue a full access link only because a caller claims
to be a customer.

Support fallback wording must not reveal:

- link expired,
- token revoked,
- token already used,
- case exists,
- case does not exist,
- report exists,
- LINE not bound,
- channel identity missing,
- wrong phone/email/channel.

Break-glass handling may be considered as a future design topic, but Task413
does not implement it. Any future break-glass path must be permission-gated,
audited, time-bound, minimal, and reviewed.

## Audit / Security Event Integration

Rate-limit and abuse events are future event candidates only.

Task413 does not add:

- audit/security event table,
- audit/security event write runtime,
- audit/security event query runtime,
- worker,
- log pipeline,
- dashboard,
- alerting.

Future event metadata should be:

- tenant-scoped,
- purpose-bound,
- minimal,
- sanitized,
- permission-controlled,
- safe for authorized internal review,
- excluded from customer-facing output,
- excluded from raw AI context.

Future event candidates may include:

- customer_access_rate_limited,
- customer_access_abuse_suspected,
- customer_access_token_replay_suspected,
- customer_access_high_frequency_denied,
- customer_access_support_reissue_requested,
- customer_access_support_reissue_denied,
- customer_issue_follow_up_spam_suspected,
- customer_channel_identity_probe_suspected,
- customer_cross_scope_probe_suspected.

AI must not read raw audit/security event full text. If AI assists with abuse
pattern summarization in the future, it must receive only sanitized summaries
under Data Access Control.

## SaaS / Entitlement / Usage Boundary

Rate-limit and abuse protection must not blur SaaS concepts.

Principles:

- Rate-limit does not replace permission.
- Entitlement does not replace permission.
- Subscription status does not prove customer identity.
- Seat billing does not prove customer identity.
- Usage tracking does not prove customer identity.
- AI add-on entitlement does not allow AI to bypass security boundaries.
- Enterprise SSO does not bypass organization isolation or Data Access Control.
- Customer channel identity must remain separate from SaaS billing identity.
- Rate-limit decision data must not expose customer existence to usage reports.

Usage tracking:

- may record aggregate counts in the future,
- must be tenant-scoped,
- must avoid raw sensitive payload,
- must not reveal customer/case/report existence through billing-facing detail.

Cross-tenant analytics must be prohibited unless a separate anonymized aggregate
proposal is approved.

## Timing-Based Leakage

Future runtime must consider timing leakage.

Risks:

- valid-token lookup takes longer than invalid-token lookup,
- existing-resource lookup takes longer than missing-resource lookup,
- wrong-organization path has a distinct timing profile,
- rate-limited path responds faster/slower than normal denial,
- provider or repository failure reveals route-specific behavior.

Future implementation should consider:

- consistent safe-deny envelopes,
- broad timing buckets in tests,
- avoiding user-visible timing differences where practical,
- not exposing retry-after details that reveal exact internal category,
- not calling providers or downstream systems when unnecessary.

Task413 does not implement timing controls or tests.

## Current-Stage Strategy

Current-stage decision:

- document the abuse-protection boundary,
- keep customer-facing runtime blocked,
- keep rate-limit runtime blocked,
- keep audit/security event persistence blocked,
- keep DB/migration/schema blocked,
- keep provider sending blocked,
- keep AI runtime blocked.

Future implementation should start only after explicit runtime authorization and
should begin with local-only design/verification boundaries.

## Future Task Candidates

Future candidates only:

- customer-facing rate-limit middleware design,
- sanitized rate-limit key derivation design,
- abuse/security event schema proposal,
- support fallback / link reissue workflow proposal,
- break-glass access proposal,
- timing leakage test proposal,
- local-only abuse integration test plan after explicit runtime authorization.

These are not implemented by Task413.

## Explicit Non-goals

Task413 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify test files,
- add or modify smoke tests,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- implement rate-limit middleware,
- implement abuse detection runtime,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement repository access,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- add audit write / log runtime / worker,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task413 records a future customer-facing rate-limit / abuse protection proposal
only.

Decision summary:

- Customer-facing abuse protection must be tenant-scoped, purpose-bound,
  channel-agnostic, generic externally, and auditable internally.
- Raw tokens, raw channel ids, complete phone numbers, complete addresses,
  secrets, and raw provider payloads must not become log-visible keys.
- Rate-limit and abuse categories must not become customer-visible message
  keys.
- Support fallback and link reissue require future permission, verification,
  consent, and audit design before runtime.
- DB/API/runtime/provider/localization/smoke/browser work remains blocked.

## Verification Plan

For Task413 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only proposal.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
