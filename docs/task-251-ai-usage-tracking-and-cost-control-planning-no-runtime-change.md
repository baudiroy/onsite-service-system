# Task 251 - AI Usage Tracking And Cost Control Planning / No Runtime Change

## Purpose And Scope

This document defines future planning boundaries for AI usage tracking, cost control, quota, rate limit, AI Add-on entitlement, audit, and organization-scoped usage governance.

Future AI usage may include AI agents, RAG, retrieval, summarization, suggestions, risk flags, classification, AI copy assistance, and internal AI reporting.

Task251 is documentation-only.

This task is not:

- AI usage runtime implementation,
- SaaS billing / subscription / pricing implementation,
- AI agent runtime,
- RAG runtime,
- retrieval service,
- token metering implementation,
- API contract,
- Admin UI,
- migration / schema proposal,
- automated test implementation,
- AI auto-decision engine.

Task251 does not add usage records, billing events, pricing, quota runtime, rate limits, token metering, API, Admin UI, DB changes, AI runtime, or tests.

## Core Usage Governance Principles

Future AI usage governance must be organization-scoped.

Principles:

- AI usage must be tracked by organization when runtime exists.
- AI usage must not be mixed across organizations.
- permission, entitlement, usage, and subscription / plan are separate concepts.
- AI Add-on availability does not mean a user has permission.
- user permission does not mean organization usage is within limit.
- usage / cost control must not bypass security.
- usage / cost control must not bypass permission.
- usage / cost control must not bypass organization scope.
- usage / cost control must not justify cross-tenant retrieval.
- AI raw sensitive payload should not enter usage metadata.
- AI token count / cost detail should not be customer-visible.
- customer-facing and internal AI may require separate entitlement and usage policy.

Usage governance protects cost and abuse risk. It is not a substitute for permission, entitlement, safe-deny, redaction, or official-record controls.

## Future AI Usage Categories

The categories below are proposal-only.

They are not:

- production usage keys,
- DB fields,
- billing events,
- pricing items,
- API fields,
- runtime behavior.

Future AI usage categories may include:

- AI request count,
- RAG retrieval count,
- retrieved source count,
- generated suggestion count,
- summary generation count,
- risk flag generation count,
- AI copy assist count,
- AI classification count,
- AI explanation generation count,
- human accept / reject / edit count,
- customer-facing AI response count,
- internal AI response count,
- failed / denied retrieval count,
- safety-blocked AI request count.

Task251 does not add usage records, billing events, pricing, quotas, feature flags, or runtime.

## Cost Control Readiness

Future cost controls should be designed before AI runtime is enabled broadly.

Future controls may include:

- organization-level quota,
- agent-type quota,
- feature-key quota,
- retrieval count limit,
- request count limit,
- source count limit,
- token usage limit,
- daily period limit,
- monthly period limit,
- rate limit,
- cooldown,
- AI Add-on disabled safe-deny,
- over-limit safe-deny,
- emergency AI disable switch,
- customer-facing AI disable switch,
- internal AI disable switch,
- high-cost source retrieval gate.

Cost controls should fail closed.

If the system cannot safely determine entitlement, usage, or scope, AI runtime should not proceed in production.

## Suggested Future Evaluation Order

Future runtime should evaluate AI usage and cost gates in a deterministic order.

Suggested future order:

1. Authenticate actor.
2. Resolve organization scope.
3. Resolve user role / permission.
4. Check organization subscription / plan state if future runtime exists.
5. Check AI feature entitlement / AI Add-on.
6. Check agent type availability.
7. Check usage / rate / cost limit.
8. Build retrieval policy if RAG is involved.
9. Apply masking / redaction policy.
10. Apply safe-deny / non-leakage.
11. Audit allowed / denied request where safe.
12. Track usage only with redacted metadata.
13. Keep AI suggestion separate from official record.

This is a future design sequence only.

Task251 does not implement middleware, guards, metering, rate limits, feature flags, or audits.

## Customer-visible vs Internal Usage Data

Customer-visible surfaces must not show internal AI usage or cost details.

Customer-visible surfaces must not show:

- token count,
- model cost,
- organization quota,
- internal usage threshold,
- entitlement internal reason,
- provider / model diagnostics,
- raw AI prompt,
- raw AI payload,
- internal retrieval diagnostics,
- hidden source counts,
- plan / subscription internal details.

Internal-only surfaces may eventually show safe categories such as:

- safe usage category,
- agent type,
- feature key,
- billing period category,
- quota status category,
- cost threshold category,
- retrieval count category,
- redacted correlation reference,
- audit reference.

Internal usage views must be role-gated, organization-scoped, redacted, and auditable.

## Safe-deny And Non-leakage

Future AI usage blocking must avoid leaking protected details.

Safe-deny examples:

- AI Add-on unavailable: customer-facing generic unavailable.
- usage exceeded: customer-facing generic unavailable.
- retrieval denied: generic no available information.
- source hidden: do not reveal whether source exists.
- cross-organization retrieval denied: generic unavailable.
- internal-only AI feature unavailable: do not expose plan detail on customer-facing surfaces.
- model/provider unavailable: generic temporarily unavailable.

Authorized Admin-facing surfaces may show safe usage / entitlement categories only after role, organization scope, and permission checks pass.

AI should not reveal:

- whether organization has a particular AI Add-on,
- whether another organization's usage exists,
- whether hidden Case / source exists,
- provider/model cost details,
- internal quota threshold,
- internal entitlement logic,
- denied retrieval diagnostics to customers.

## AI Usage Audit Readiness

Future audit event families may include:

- `ai.usage.evaluated`,
- `ai.usage.recorded`,
- `ai.usage.blocked`,
- `ai.addon_entitlement.denied`,
- `ai.quota.reached`,
- `ai.rate_limit.applied`,
- `ai.cost_threshold.reached`,
- `ai.retrieval_usage.evaluated`,
- `ai.retrieval_usage.blocked`,
- `ai.request.safety_blocked`,
- `ai.usage_report.viewed`,
- `ai.usage_report.exported`.

These are placeholders only.

They are not production event names, schema enums, localization keys, API responses, or audit runtime.

Audit redaction must prohibit:

- full customer mobile values,
- full addresses,
- raw LINE user ids,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw provider payloads,
- provider credentials,
- raw AI sensitive payloads,
- customer-facing pricing secrets,
- internal audit diagnostics on customer-visible surfaces.

AI usage audit should help operators understand safety and cost categories without exposing sensitive payloads.

## SaaS Entitlement / Plan Readiness

Future questions:

- Which AI agents require AI Add-on?
- Which agent types belong to higher plans?
- Are customer-facing AI and internal AI separate entitlements?
- Is RAG retrieval usage-counted separately?
- Is source ingestion usage-counted separately?
- Is token usage recorded?
- How is usage period defined?
- Is overage allowed?
- Can Enterprise tenants have custom quota?
- Can AI usage reports be exported?
- Who can view AI cost / usage dashboard?
- Can tenant admins set internal user-level AI limits?
- Should denied or safety-blocked requests be counted?

Task251 does not implement plan, subscription, billing, entitlement, or usage runtime.

## AI Advisory-only Boundary

AI may:

- summarize redacted usage trends,
- remind staff about cost anomaly,
- flag usage spike,
- suggest quota policy gaps,
- draft internal AI usage report notes.

AI must not:

- automatically increase quota,
- automatically remove usage block,
- automatically open AI Add-on,
- automatically modify plan / subscription,
- automatically bypass cost control,
- read secrets,
- output secrets,
- modify official records,
- use cost reason to bypass permission,
- use cost reason to bypass organization scope,
- write uncertain inference into official usage / billing record.

AI can help humans understand usage. It cannot become billing authority or entitlement authority.

## Explicit Non-goals

Task251 does not:

- create AI usage table,
- create billing events table,
- create pricing table,
- create subscription runtime,
- create invoice / payment runtime,
- add AI agent runtime,
- add RAG runtime,
- add retrieval service,
- add token metering,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage runtime,
- add worker,
- add scheduler,
- add tests,
- add fixtures,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- connect to DB,
- run psql,
- run DDL,
- run `npm run db:migrate`,
- operate shared Zeabur runtime,
- send provider notifications,
- implement notification runtime,
- implement survey runtime,
- implement AI auto-decision,
- implement billing / invoice / payment runtime.

## Verification Checklist

Task251 should be verified with:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive / internal diagnostic scan.

Sensitive scan should confirm there are no actual:

- DATABASE_URL values,
- passwords,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE user ids,
- customer mobile values,
- full addresses,
- signature data,
- raw provider payloads,
- provider credentials,
- real tenant IDs,
- real organization IDs,
- real usage values,
- real pricing values,
- actual AI token counts,
- stack traces,
- SQL errors,
- DB constraint names,
- production translation strings.

Policy words, placeholders, prohibition lists, and guardrail references are allowed when they do not include actual sensitive values.

## Future Task Candidates

Future candidates only; not executed by Task251:

- AI Usage Entitlement Matrix / No Runtime Change,
- AI Usage Safe-deny Error Matrix / No Runtime Change,
- AI Cost Control Role Dashboard Requirements / No Admin Code Change,
- AI Usage Audit Event Catalog / No Runtime Change,
- AI Agent Branch Pause Summary / No Runtime Change.
