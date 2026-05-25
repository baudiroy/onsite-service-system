# Task 280 - Data Access AI / RAG Retrieval Permission Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Data Access Control / Data Permission Model branch from Task274 through Task279.

The purpose is to define future-only boundaries for AI retrieval and RAG retrieval so AI cannot bypass the platform's shared Data Access Control / Data Permission Model.

Task280 is documentation-only.

This task is not:

- AI retrieval runtime,
- RAG retrieval runtime,
- retrieval service,
- vector DB implementation,
- embedding implementation,
- indexer implementation,
- external AI provider integration,
- AI prompt implementation,
- AI decision runtime,
- official-record write runtime,
- permission runtime,
- entitlement runtime,
- subscription runtime,
- usage tracking runtime,
- customer self-service lookup runtime,
- report / export / download runtime,
- scheduled report runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation.

Task280 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why AI / RAG Retrieval Boundaries Are Needed After Task279

Task279 defined customer self-service lookup boundaries and made clear that customer channel identity must not become internal user permission.

AI and RAG retrieval are another high-risk data surface because AI can accidentally combine, summarize, or expose data that a user should not see.

Future AI must support useful workflows:

- customer service summaries,
- dispatch suggestions,
- engineer completion summaries,
- settlement checks,
- quality/risk signals,
- survey feedback summaries,
- SOP / repair knowledge lookup,
- AI-assisted import mapping,
- AI risk radar.

But AI must not become:

- a permission bypass,
- a cross-tenant search engine,
- a way to retrieve raw internal notes,
- a way to send full raw files to external AI providers,
- a way to expose customer/channel identities,
- a way to write official records without human or deterministic control.

Task280 defines future boundaries only. It does not approve runtime implementation.

## Definitions

### AI Retrieval

AI retrieval is the future process of gathering authorized context for AI summaries, suggestions, risk flags, drafts, mapping recommendations, or explanations.

AI retrieval must use the same Data Access Control model as normal data access.

### RAG Retrieval

RAG retrieval is the future process of retrieving relevant source documents, snippets, SOPs, brand rules, vendor rules, knowledge documents, or case-related references for grounded AI responses.

RAG retrieval must be organization-scoped and visibility-filtered.

### Retrieval Policy Builder

Retrieval policy builder is a future conceptual component that decides which sources may be retrieved for a specific AI task.

It is not implemented by Task280.

### Permission-aware Filter

Permission-aware filter means retrieval results are constrained by:

- organization scope,
- user identity,
- role,
- permission,
- feature entitlement,
- subscription status,
- usage limit,
- allowed case / customer / document scope,
- customer-visible policy,
- internal-only policy,
- field-level masking.

### Minimum Necessary Context

Minimum necessary context means AI receives only the smallest authorized data needed for the requested task.

It must not receive full raw payloads or full raw files for convenience.

### Source Visibility

Source visibility defines whether a source is customer-visible, internal-only, supervisor-only, finance-only, engineer-visible, public knowledge, or otherwise restricted.

### Customer-visible Source

Customer-visible source may be used for customer-facing answers if it is approved for the channel and task.

### Internal-only Source

Internal-only source must not be used in customer-facing AI answers or exposed to unauthorized roles.

### AI Suggestion Record

AI suggestion record is future AI advisory output that remains separate from official records until accepted, rejected, edited, or otherwise handled by authorized human or deterministic workflow.

### AI Raw Sensitive Payload

AI raw sensitive payload means raw prompt, context, provider response, retrieval result, or diagnostic data that may contain sensitive customer, tenant, internal, billing, channel, provider, or model data.

It must not be exposed to customers or unauthorized internal roles.

### RAG Source Metadata

RAG source metadata describes source identity, visibility, version, tenant scope, permission scope, and effective period.

### AI Add-on Usage Tracking

AI Add-on usage tracking is a future SaaS cost-control and metering concept for AI/RAG usage.

It must not store unnecessary sensitive payload.

## Boundary Principles

- AI is not a permission exception.
- AI / RAG must not directly query unfiltered DB.
- AI / RAG must not directly query unfiltered vector DB.
- Every retrieval must include an `organization_id` filter.
- Retrieval must apply role, permission, entitlement, subscription, usage, visibility, and masking.
- Customer-visible context and internal-only context must remain separated.
- AI suggestion / risk flag must remain separate from official records.
- AI must not automatically approve, close, dispatch, complete, settle, close complaints, agree to fees, or modify official Case / Appointment / Field Service Report / Billing / Settlement records.
- External AI provider usage must follow Cloud AI / External AI Provider Data Protection Principle.
- AI-assisted file import must not send full raw files to AI.

## Future-only Retrieval Matrix

The matrix below is conceptual only. It is not a schema, API response contract, prompt contract, route, retrieval service, vector index, or implementation checklist.

| Retrieval scenario | Source type | Required organization scope | Required permission | Requires entitlement? | Requires usage check? | Customer-visible eligible? | Internal-only eligible? | Requires masking / redaction? | May be sent to external AI provider? | Requires audit? | May AI write official record? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case summary retrieval | Case / customer-visible and internal Case fields | Yes | Yes | Conditional | Conditional | Conditional safe subset | Conditional | Yes | Future-only Conditional after minimization | Yes | No | No |
| Appointment / dispatch visit retrieval | Appointment / visit data | Yes | Yes | Conditional | Conditional | Conditional safe subset | Conditional | Yes | Future-only Conditional after minimization | Yes | No | No |
| Field Service Report retrieval | Formal report data | Yes | Yes | Conditional | Conditional | Conditional approved summary | Conditional | Yes | Future-only Conditional after minimization | Yes | No | No |
| Internal note retrieval | Internal note source | Yes | Internal note permission | Conditional | Conditional | No | Yes, authorized roles only | Yes | Future-only Restricted; avoid full text | Yes | No | No |
| Customer-visible service summary retrieval | Customer-facing summary | Yes | Customer-visible policy or internal permission | Conditional | Conditional | Yes | No by default | Yes | Future-only Conditional | Conditional | No | No |
| Billing / settlement internal data retrieval | Finance / settlement data | Yes | Finance/settlement permission | Conditional | Conditional | No | Yes, finance/supervisor roles | Yes | Future-only Restricted; avoid full data | Yes | No | No |
| Quote / customer fee consent retrieval | Quote / customer approval record | Yes | Quote/approval permission or customer-visible policy | Conditional | Conditional | Conditional approved subset | Conditional | Yes | Future-only Conditional | Yes | No | No |
| Survey result retrieval | Survey / feedback data | Yes | Survey/feedback permission | Conditional | Conditional | Conditional by policy | Conditional internal review | Yes | Future-only Conditional | Yes | No | No |
| Complaint / callback future record retrieval | Operations / quality records | Yes | Complaint/follow-up permission | Conditional | Conditional | No by default | Yes, authorized roles | Yes | Future-only Restricted | Yes | No | No |
| Quality review future record retrieval | Quality/supervisor records | Yes | Supervisor/quality permission | Conditional | Conditional | No | Yes, supervisor roles | Yes | Future-only Restricted | Yes | No | No |
| Audit log retrieval | Audit source | Yes | Audit permission | Conditional | Conditional | No | Yes, audit/admin roles | Yes | No by default | Yes | No | No |
| Customer channel identity metadata retrieval | Channel identity metadata | Yes | Channel identity permission or customer-visible policy | Conditional | Conditional | No raw identifiers | Conditional | Yes | Future-only Restricted/minimized | Yes | No | No |
| RAG SOP document retrieval | SOP / policy document | Yes | SOP/RAG source permission | Conditional | Conditional | Conditional customer-safe docs only | Conditional | Yes | Future-only Conditional | Yes | No | No |
| Brand / vendor rule document retrieval | Brand / vendor rule source | Yes | Brand/vendor rule permission | Conditional | Conditional | No by default | Yes, authorized roles | Yes | Future-only Restricted | Yes | No | No |
| AI suggestion history retrieval | AI suggestion records | Yes | AI suggestion permission | AI entitlement | AI usage check | No by default | Yes, authorized roles | Yes | No by default | Yes | No | No |

## Sensitive Data Minimization Rules

Future AI / RAG retrieval must not send the following to external AI providers:

- token,
- secret,
- full phone,
- full address,
- LINE access token,
- LINE channel secret,
- raw LINE id,
- raw provider payload,
- raw signature data,
- unmasked photos,
- audit log full text,
- internal note full text,
- billing / settlement internal data full text,
- full customer lists,
- full raw import files,
- cross-organization / cross-tenant data.

External AI providers may receive only:

- authorized data,
- organization-scoped data,
- permission-filtered data,
- visibility-filtered data,
- masked / redacted data,
- minimum necessary context for the specific task.

High-sensitivity tasks should preserve future architecture options:

- private AI,
- dedicated environment,
- local model,
- hybrid AI architecture.

## RAG Source Metadata Rules

Future RAG sources should carry metadata that enables filtering before retrieval.

Suggested future metadata fields:

- `organization_id`,
- `source_type`,
- `source_id`,
- `visibility`,
- `permission_scope`,
- `customer_visible`,
- `internal_only`,
- `brand_id`,
- `vendor_id`,
- `case_id` nullable,
- `appointment_id` nullable,
- `customer_id` nullable,
- `document_id` nullable,
- `version`,
- `effective_from`,
- `effective_to`,
- `status`.

RAG retrieval must not proceed when metadata is missing or ambiguous for required filters.

## Audit / Usage Rules

Future AI/RAG workflows should support audit readiness for:

- AI retrieval requested,
- RAG retrieval requested,
- retrieval policy applied,
- retrieval denied by scope,
- retrieval denied by permission,
- retrieval denied by entitlement,
- source citation used,
- AI suggestion generated,
- human accepted AI suggestion,
- human rejected AI suggestion,
- human edited AI suggestion,
- official write proposal created,
- official write performed by authorized human or deterministic workflow.

Future AI/RAG usage tracking should support:

- organization-level usage,
- feature key,
- agent type,
- request count,
- retrieval count,
- token usage category,
- billing period,
- AI Add-on / entitlement status.

Audit and usage records must not store unnecessary sensitive payload.

## Interaction With Existing Access Contexts

| Access context | AI/RAG retrieval boundary | Runtime allowed now? |
| --- | --- | --- |
| Normal read | AI cannot retrieve records the actor cannot read. | No |
| Customer self-service lookup | Customer-facing AI may use customer-visible sources only. | No |
| Report / export / download | AI-related exports must follow report/export/download permissions and masking. | No |
| Scheduled report | Scheduled AI summaries must re-check permission, entitlement, usage, visibility, and masking. | No |
| AI-assisted import | AI may assist mapping only after parsing, minimization, masking, and human confirmation boundaries. | No |
| AI suggestion records | Suggestions remain advisory and separate from official records. | No |

## SaaS-ready / Security Considerations

Future AI/RAG retrieval design must remain compatible with:

- tenant isolation,
- organization isolation,
- role / permission separation,
- entitlement / subscription / usage separation,
- AI Add-on readiness,
- field-level masking readiness,
- audit readiness,
- usage tracking readiness,
- customer-visible / internal-only separation,
- Enterprise private AI / dedicated environment / local model / hybrid AI options,
- Enterprise SSO future design.

Enterprise private AI or SSO must not bypass permission, organization scope, audit, visibility, masking, or usage tracking.

Higher SaaS plans or AI Add-ons must not relax tenant isolation, privacy, customer-visible policy, internal-only policy, or ISO 27001-aligned guardrails.

## Future Test Ideas

These are future test ideas only. Task280 does not add tests.

Future coverage should include:

- AI retrieval fails without organization filter,
- AI retrieval cannot read cross-organization records,
- RAG retrieval cannot read source with mismatched organization metadata,
- customer-facing AI excludes internal-only sources,
- internal AI suggestion cannot be viewed by unauthorized role,
- AI retrieval masks phone/address before external provider,
- AI-assisted import does not send full raw file to AI,
- audit log full text is not sent to AI,
- billing / settlement full internal data is not sent to AI,
- AI suggestion cannot mutate official record without authorized human/deterministic workflow,
- AI Add-on entitlement present but permission missing still denies,
- AI usage limit exceeded blocks AI retrieval where applicable.

## Non-goals

Task280 does not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API routes,
- add or modify migrations / schema / indexes,
- connect to DB,
- execute DDL,
- execute `psql`,
- execute `npm run db:migrate`,
- run Migration020 dry-run or apply,
- add permission runtime,
- add entitlement runtime,
- add subscription runtime,
- add usage runtime,
- add customer self-service lookup runtime,
- add report / analytics runtime,
- add export / download runtime,
- add scheduled report runtime,
- add AI retrieval / RAG runtime,
- add retrieval service,
- add vector DB,
- add embedding,
- add indexer,
- add external AI provider integration,
- add AI auto-decision,
- add official record write automation,
- modify tests / smoke / fixtures,
- modify `package.json`,
- modify inventory docs,
- touch provider sending,
- send LINE / SMS / Email / APP notifications,
- expose sensitive data.

## Verification Plan

For Task280, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, customer self-service runtime, AI runtime, RAG runtime, report runtime, export runtime, scheduled report runtime, provider sending, or inventory verification is required.

## Conclusion

Task280 defines future-only AI / RAG retrieval permission boundaries.

The key rule is:

```text
AI is not a permission exception.
AI/RAG retrieval must be organization-scoped, permission-aware, visibility-filtered,
masked, audited, usage-aware, and separated from official-record writes.
```

Task280 is docs-only AI / RAG retrieval permission boundary guidance and does not approve AI retrieval, RAG retrieval, vector DB, embedding, indexer, external AI provider integration, or AI decision runtime.
